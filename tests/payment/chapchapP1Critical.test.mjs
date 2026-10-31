import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import path from 'node:path'
import ts from 'typescript'
import { createHmac } from 'node:crypto'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '../..')
const reservationId = '11111111-1111-4111-8111-111111111111'
const conferenceReservationId = '22222222-2222-4222-8222-222222222222'

function resolveSibling(abs, name) {
  if (!name.startsWith('.')) return null
  const base = path.resolve(path.dirname(abs), name)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]
  const found = candidates.find((c) => existsSync(c))
  return found ? path.relative(root, found) : null
}

function compileTs(file, env, mocks, cache = new Map()) {
  const abs = path.join(root, file)
  if (cache.has(abs)) return cache.get(abs).exports

  const mod = { exports: {} }
  cache.set(abs, mod)

  const source = readFileSync(abs, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  })

  // require résout dans l'ordre : mocks, alias "@/…", chemins relatifs
  // au module compilé (ex. './roomPayment.ts'), puis node_modules réel.
  const localRequire = (name) => {
    if (mocks[name]) return mocks[name]
    if (name.startsWith('@/')) return compileTs(`src/${name.slice(2)}.ts`, env, mocks, cache)
    const sibling = resolveSibling(abs, name)
    if (sibling) return compileTs(sibling, env, mocks, cache)
    return require(name)
  }

  runInNewContext(outputText, {
    module: mod,
    exports: mod.exports,
    require: localRequire,
    process: { env },
    console,
    Buffer,
    URL,
    Headers,
    Request,
    Response,
    setTimeout,
    clearTimeout,
    crypto: globalThis.crypto,
  })

  return mod.exports
}

function sign(raw, secret) {
  return createHmac('sha256', secret).update(raw).digest('hex')
}

function makeDb() {
  const rows = {
    reservations: {
      [reservationId]: {
        id: reservationId,
        total_price: 1_520_000,
        currency: 'GNF',
        payment_status: 'pending',
        chapchap_transaction_id: null,
      },
    },
    conference_reservations: {
      [conferenceReservationId]: {
        id: conferenceReservationId,
        total_price: 2_400_000,
        currency: 'GNF',
        payment_status: 'pending',
        transaction_id: null,
      },
    },
  }

  return {
    rows,
    from(table) {
      return {
        _table: table,
        _id: null,
        select() {
          return this
        },
        eq(_column, value) {
          this._id = value
          return this
        },
        async single() {
          const row = rows[this._table]?.[this._id]
          return row ? { data: row, error: null } : { data: null, error: { message: 'not_found' } }
        },
        update(patch) {
          return {
            eq: async (_column, id) => {
              const row = rows[table]?.[id]
              if (!row) return { error: { message: 'not_found' } }
              Object.assign(row, patch)
              return { error: null }
            },
          }
        },
      }
    },
  }
}

function loadWebhookRoute({ env, db, verifyOk = true }) {
  const mocks = {
    '@/lib/supabase': { createServiceRoleClient: () => db },
    '@/lib/chapchap': {
      checkRateLimit: () => ({ allowed: true }),
      getClientIp: () => '127.0.0.1',
      secureJson: (payload, _site, init) => Response.json(payload, init),
      verifyChapchapHmac: () => verifyOk,
    },
  }

  return compileTs('src/app/api/payment/webhook/route.ts', env, mocks)
}

function loadChapchapPayRoute({ env, db, providerStatus = 200, providerBody = { payment_url: 'http://local/checkout' } }) {
  const mocks = {
    '@/lib/supabase': { createServiceRoleClient: () => db },
    '@/lib/chapchap': {
      checkRateLimit: () => ({ allowed: true }),
      ensureSameOrigin: () => true,
      fetchWithTimeout: async () => new Response(JSON.stringify(providerBody), { status: providerStatus }),
      getClientIp: () => '127.0.0.1',
      sanitizeText: (v) => String(v),
      secureJson: (payload, _site, init) => Response.json(payload, init),
    },
    // L'auth du claim (X-Reservation-Claim) a ses propres tests sur main ;
    // ce scénario se concentre sur le chemin prestataire (erreur 502).
    '@/lib/reservationClaim': { checkReservationClaim: () => ({ allow: true }) },
  }

  return compileTs('src/app/api/payment/chapchap/route.ts', env, mocks)
}

function webhookRequest(payload, secret = 'local-secret') {
  const raw = JSON.stringify(payload)
  return new Request('http://localhost:3000/api/payment/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-ccp-signature': sign(raw, secret),
    },
    body: raw,
  })
}

function payRequest() {
  return new Request('http://localhost:3000/api/payment/chapchap', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify({
      reservationId,
      customerName: 'Aicha',
      customerEmail: 'aicha@example.com',
      roomName: 'Suite Prestige',
      bookingReference: 'MB-TEST-P1',
    }),
  })
}

test('webhook paiement valide (room): paid + transaction id', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-OK-1',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-OK-1')
})


test('webhook devise différente: refuse confirmation paid', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-BAD-CURRENCY',
    amount: 1_520_000,
    currency: 'USD',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 202)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
})

test('webhook paid sans transaction_id: refuse confirmation', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 202)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
})



test('webhook montant différent: refuse confirmation paid', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-BAD-AMOUNT',
    amount: 999_999,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 202)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, null)
})

test('webhook identifiant transaction incohérent: idempotent sans overwrite', async () => {
  const db = makeDb()
  db.rows.reservations[reservationId].chapchap_transaction_id = 'TX-LOCKED'

  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-OTHER',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.note, 'already_processed')
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-LOCKED')
})

test('webhook dupliqué: second envoi est idempotent', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const payload = {
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-REPLAY',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  }

  const res1 = await route.POST(webhookRequest(payload))
  assert.equal(res1.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')

  const res2 = await route.POST(webhookRequest(payload))
  assert.equal(res2.status, 200)
  const body2 = await res2.json()
  assert.equal(body2.note, 'already_processed')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-REPLAY')
})

test('erreur prestataire create payment: route renvoie 502', async () => {
  const db = makeDb()
  const env = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_API_KEY_TEST: 'k'.repeat(64),
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
  }

  const route = loadChapchapPayRoute({
    env,
    db,
    providerStatus: 500,
    providerBody: { message: 'provider_error' },
  })

  const res = await route.POST(payRequest())
  assert.equal(res.status, 502)
})

test('webhook conférence valide: paid + transaction_id (flow conservé)', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    conference_reservation_id: conferenceReservationId,
    transaction_id: 'TX-CONF-1',
    amount: 2_400_000,
    currency: 'GNF',
    metadata: {
      reservation_type: 'conference',
      conference_reservation_id: conferenceReservationId,
    },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 200)
  assert.equal(db.rows.conference_reservations[conferenceReservationId].payment_status, 'paid')
  assert.equal(db.rows.conference_reservations[conferenceReservationId].transaction_id, 'TX-CONF-1')
})

