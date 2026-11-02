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

function makeDb({ failJournalInsert = false, failNthReservationUpdate = null } = {}) {
  const rows = {
    reservations: {
      [reservationId]: {
        id: reservationId,
        total_price: 1_520_000,
        currency: 'GNF',
        payment_status: 'pending',
        chapchap_transaction_id: null,
        chapchap_order_id: null,
      },
    },
    conference_reservations: {
      [conferenceReservationId]: {
        id: conferenceReservationId,
        total_price: 2_400_000,
        currency: 'GNF',
        payment_status: 'pending',
        transaction_id: null,
        chapchap_order_id: null,
      },
    },
  }

  // Journal `p1_webhook_events` : clé d'événement → ligne (déduplication).
  const journal = { byKey: new Map(), byId: new Map(), seq: 0 }
  // Compteurs d'écritures pour simuler des échecs ciblés (tests).
  const counters = { reservationUpdates: 0 }

  function journalInsert(entry) {
    journal.seq += 1
    const row = {
      id: `jrn-${journal.seq}`,
      ...entry,
      received_status: 'received',
      outcome: null,
    }
    journal.byKey.set(entry.provider_event_key, row)
    journal.byId.set(row.id, row)
    return row
  }

  function selectRow(entryId) {
    return journal.byId.get(entryId)
  }

  return {
    rows,
    journal,
    getJournalRow(id) {
      return journal.byId.get(id)
    },
    journalByKey(key) {
      return journal.byKey.get(key)
    },
    from(table) {
      if (table === 'p1_webhook_events') {
        return {
          select() {
            return {
              eq: (column, value) => ({
                maybeSingle: async () => {
                  const row = value ? [...journal.byKey.values()].find((r) => r[column] === value) : null
                  return row ? { data: row, error: null } : { data: null, error: null }
                },
                single: async () => {
                  const row = value ? [...journal.byKey.values()].find((r) => r[column] === value) : null
                  return row ? { data: row, error: null } : { data: null, error: { message: 'not_found' } }
                },
              }),
            }
          },
          insert(entry) {
            return {
              select() {
                return {
                  single: async () => {
                    if (failJournalInsert) {
                      return { data: null, error: { message: 'forced_journal_failure' } }
                    }
                    // Déduplication par clé (comme l'index unique partiel).
                    const existing = journal.byKey.get(entry.provider_event_key)
                    if (existing) return { data: existing, error: null }
                    const row = journalInsert(entry)
                    return { data: row, error: null }
                  },
                }
              },
            }
          },
          update(patch) {
            return {
              eq: async (_column, id) => {
                const row = selectRow(id)
                if (!row) return { error: { message: 'not_found' } }
                Object.assign(row, patch)
                return { error: null }
              },
            }
          },
        }
      }

      return {
        _table: table,
        _id: null,
        _inValues: null,
        select() {
          return this
        },
        eq(_column, value) {
          this._id = value
          return this
        },
        in(_column, values) {
          this._inValues = values ?? null
          return this
        },
        async maybeSingle() {
          const row = rows[this._table]?.[this._id]
          return row ? { data: row, error: null } : { data: null, error: null }
        },
        async single() {
          const row = rows[this._table]?.[this._id]
          return row ? { data: row, error: null } : { data: null, error: { message: 'not_found' } }
        },
        update(patch) {
          // Retourne une « thenable » buildable : 
          //  - `await .eq(...)` → exécute (routes pay, pré-écriture),
          //  - `.eq(...).in(...).select(...)` → transition CAS atomique.
          return {
            eq: (_column, id) => {
              const runPlain = async () => {
                const row = rows[table]?.[id]
                if (!row) return { error: { message: 'not_found' } }
                if (table === 'reservations') {
                  counters.reservationUpdates += 1
                  if (
                    failNthReservationUpdate !== null &&
                    counters.reservationUpdates === failNthReservationUpdate
                  ) {
                    return { error: { message: 'forced_update_failure' } }
                  }
                }
                Object.assign(row, patch)
                return { error: null }
              }
              const builder = {
                in: (_inColumn, values) => ({
                  select: async () => {
                    const row = rows[table]?.[id]
                    if (!row) return { data: null, error: { message: 'not_found' } }
                    if (values && !values.includes(row.payment_status)) {
                      return { data: [], error: null }
                    }
                    Object.assign(row, patch)
                    return { data: [{ id: row.id }], error: null }
                  },
                }),
              }
              builder.then = (resolve, reject) => Promise.resolve(runPlain()).then(resolve, reject)
              return builder
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

test('webhook paid depuis un statut terminal: transaction différente verrouillée', async () => {
  const db = makeDb()
  // Réservation déjà CONFIRMÉE et verrouillée sur une transaction :
  // un webhook paid avec une AUTRE transaction ne doit jamais la remplacer.
  db.rows.reservations[reservationId].payment_status = 'paid'
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
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')
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


test('webhook paid avec order_id contradictoire: refus (corrélation) + journal anomaly', async () => {
  const db = makeDb()
  db.rows.reservations[reservationId].chapchap_order_id = 'MB-ABC123'

  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    operation_id: 'OP-42',
    order_id: 'MB-OTHER',
    reservation_id: reservationId,
    transaction_id: 'TX-CORR-BAD',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 202)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, null)
  const j = db.journalByKey('OP-42')
  assert.ok(j, 'événement journalisé')
  assert.equal(j.received_status, 'anomaly')
  assert.match(j.outcome, /reject:correlation_mismatch/)
})

test('webhook paid avec order_id cohérent: confirmé + corrélation matched', async () => {
  const db = makeDb()
  db.rows.reservations[reservationId].chapchap_order_id = 'MB-ABC123'

  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    operation_id: 'OP-7',
    order_id: 'MB-ABC123',
    reservation_id: reservationId,
    transaction_id: 'TX-CORR-OK',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-CORR-OK')
  const j = db.journalByKey('OP-7')
  assert.match(j.outcome, /correlation_matched/)
})

test('webhook paid sans montant échoé: non vérifiable (jamais paid) + journal unverifiable', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-NO-AMOUNT',
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 202)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  const j = db.journalByKey('TX-NO-AMOUNT')
  assert.equal(j.received_status, 'unverifiable')
  assert.match(j.outcome, /missing_amount/)
})



test('webhook paid sans devise échoée: non vérifiable + journal unverifiable', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-NO-CURRENCY',
    amount: 1_520_000,
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 202)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  const j = db.journalByKey('TX-NO-CURRENCY')
  assert.match(j.outcome, /missing_currency/)
})

test('course atomique refunded vs paid: le paid obsolète ne remplace jamais refunded', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  // 1er webhook (concurrent) : refunded depuis pending — autorisé (CAS).
  const refundReq = webhookRequest({
    status: 'refunded',
    reservation_id: reservationId,
    transaction_id: 'TX-REFUND',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })
  const resRefund = await route.POST(refundReq)
  assert.equal(resRefund.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'refunded')

  // 2e webhook (obsolète, lecture antérieure) : paid — refusé par la barrière CAS.
  const paidReq = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-STALE-PAID',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })
  const resPaid = await route.POST(paidReq)
  assert.equal(resPaid.status, 200)
  const body = await resPaid.json()
  assert.equal(body.note, 'already_processed')
  assert.equal(db.rows.reservations[reservationId].payment_status, 'refunded')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-REFUND')
})


test('multi-notifications même operation_id (failed puis success): les deux traitées', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const base = {
    operation_id: 'OP-99',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  }

  const res1 = await route.POST(
    webhookRequest({ ...base, status: 'failed', transaction_id: 'TX-F', amount: 1_520_000, currency: 'GNF' })
  )
  assert.equal(res1.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'failed')

  const res2 = await route.POST(
    webhookRequest({ ...base, status: 'success', transaction_id: 'TX-S', amount: 1_520_000, currency: 'GNF' })
  )
  assert.equal(res2.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-S')
})

test('déduplication par operation_id: double livraison → déjà traitée', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const payload = {
    status: 'success',
    operation_id: 'OP-1',
    reservation_id: reservationId,
    transaction_id: 'TX-DUP',
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
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-DUP')
})

test('journal indisponible à l’insertion → 500, JAMAIS de 200 (pas de perte masquée)', async () => {
  const db = makeDb({ failJournalInsert: true })
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-JRN-FAIL',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  })

  const res = await route.POST(req)
  assert.equal(res.status, 500)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, null)
})

test('webhooks simultanés identiques (concurrents) → une seule confirmation', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const payload = {
    status: 'success',
    operation_id: 'OP-111',
    reservation_id: reservationId,
    transaction_id: 'TX-CONCURRENT',
    amount: 1_520_000,
    currency: 'GNF',
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  }

  const [resA, resB] = await Promise.all([
    route.POST(webhookRequest(payload)),
    route.POST(webhookRequest(payload)),
  ])

  assert.ok([resA.status, resB.status].includes(200), 'les deux réponses terminent en 200')
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')
  assert.equal(db.rows.reservations[reservationId].chapchap_transaction_id, 'TX-CONCURRENT')
  // Une seule ligne de journal pour l'opération.
  assert.equal([...db.journal.byId.values()].filter((r) => r.provider_event_key === 'OP-111').length, 1)
})

test('ordre inversé (success puis failed du même opération) → paid conservé', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const base = {
    operation_id: 'OP-55',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  }

  const resSuccess = await route.POST(
    webhookRequest({ ...base, status: 'success', transaction_id: 'TX-S1', amount: 1_520_000, currency: 'GNF' })
  )
  assert.equal(resSuccess.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')

  const resFailed = await route.POST(
    webhookRequest({ ...base, status: 'failed', transaction_id: 'TX-F1', amount: 1_520_000, currency: 'GNF' })
  )
  assert.equal(resFailed.status, 200)
  const body = await resFailed.json()
  assert.ok(['already_processed', 'noop'].includes(body.note))
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid', 'failed ne rétrograde jamais paid')
})

test('cycle failed→success : une 3e livraison du success est dédupliquée (raw_status à jour)', async () => {
  const db = makeDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const route = loadWebhookRoute({ env, db })

  const base = {
    operation_id: 'OP-77',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', reservation_id: reservationId },
  }

  await route.POST(webhookRequest({ ...base, status: 'failed', transaction_id: 'TX-F7', amount: 1_520_000, currency: 'GNF' }))
  const res2 = await route.POST(webhookRequest({ ...base, status: 'success', transaction_id: 'TX-S7', amount: 1_520_000, currency: 'GNF' }))
  assert.equal(res2.status, 200)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'paid')

  const res3 = await route.POST(webhookRequest({ ...base, status: 'success', transaction_id: 'TX-S7', amount: 1_520_000, currency: 'GNF' }))
  assert.equal(res3.status, 200)
  const body3 = await res3.json()
  assert.equal(body3.note, 'already_processed')
})

test('persistance de corrélation en échec → 502, aucune URL de paiement exposée', async () => {
  // La 2e écriture de réservation (persistance chapchap_order_id) échoue.
  const db = makeDb({ failNthReservationUpdate: 2 })
  const env = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_API_KEY_TEST: 'k'.repeat(64),
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
  }
  const route = loadChapchapPayRoute({ env, db, providerStatus: 200, providerBody: { payment_url: 'http://local/checkout' } })

  const res = await route.POST(payRequest())
  assert.equal(res.status, 502)
  const body = await res.json()
  assert.equal(body.payment_url, undefined, 'URL non exposée si corrélation non persistée')
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
})


test('PRÉVIEW : clé TEST configurée + isolation OK → initiation autorisée', async () => {
  const db = makeDb()
  const env = {
    NODE_ENV: 'production',
    VERCEL_ENV: 'preview',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_API_KEY_TEST: 't'.repeat(64),
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
  }
  const route = loadChapchapPayRoute({ env, db, providerStatus: 200, providerBody: { payment_url: 'http://local/checkout' } })
  const res = await route.POST(payRequest())
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.payment_url, 'http://local/checkout')
})

test("PRÉVIEW : clé PRODUCTION résiduelle dans l'env → 403, passage prestataire bloqué", async () => {
  const db = makeDb()
  const env = {
    NODE_ENV: 'production',
    VERCEL_ENV: 'preview',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_API_KEY_TEST: 't'.repeat(64),
    CHAPCHAP_API_KEY_PRODUCTION: 'p'.repeat(64),
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
  }
  const route = loadChapchapPayRoute({ env, db, providerStatus: 200, providerBody: { payment_url: 'http://local/checkout' } })
  const res = await route.POST(payRequest())
  assert.equal(res.status, 403)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
})

test('PRÉVIEW sans clé TEST → 503, aucun fallback vers la clé PRODUCTION présente', async () => {
  const db = makeDb()
  const env = {
    NODE_ENV: 'production',
    VERCEL_ENV: 'preview',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_API_KEY_PRODUCTION: 'p'.repeat(64),
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
  }
  const route = loadChapchapPayRoute({ env, db, providerStatus: 200, providerBody: { payment_url: 'http://local/checkout' } })
  const res = await route.POST(payRequest())
  assert.equal(res.status, 503)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
})

