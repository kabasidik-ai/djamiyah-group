import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import path from 'node:path'
import ts from 'typescript'
import { createHmac } from 'node:crypto'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '../..')
const reservationId = 'def67890-1234-4abc-9012-abcdef123456'

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

  runInNewContext(outputText, {
    module: mod,
    exports: mod.exports,
    require: (name) => {
      if (mocks[name]) return mocks[name]
      if (name.startsWith('@/')) return compileTs(`src/${name.slice(2)}.ts`, env, mocks, cache)
      return require(name)
    },
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

function makeRoomDb() {
  const rows = {
    reservations: {
      [reservationId]: {
        id: reservationId,
        payment_status: 'pending',
        chapchap_transaction_id: null,
      },
    },
    conference_reservations: {
      [reservationId]: {
        id: reservationId,
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
        _patch: null,
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
          this._patch = patch
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

function loadChapchapRoute({ env, checks, p1Result, p2Result }) {
  const calls = { p1: 0, p2: 0, redirectPolicy: null, p1FetchImpl: null, p2FetchImpl: null }
  const mocks = {
    '@/lib/supabase': { createServiceRoleClient: () => ({}) },
    '@/lib/chapchap': {
      checkRateLimit: () => ({ allowed: true }),
      ensureSameOrigin: () => checks.originAllowed,
      fetchWithTimeout: async (_input, _init, _timeoutMs, options) => {
        calls.redirectPolicy = options?.redirectPolicy ?? null
        return Response.json({ payment_url: 'http://local/checkout' })
      },
      getClientIp: () => '127.0.0.1',
      sanitizeText: (v) => String(v),
      secureJson: (payload, _site, init) => Response.json(payload, init),
    },
    '@/lib/reservationClaim': {
      checkReservationClaim: (_headers, id) => {
        if (!checks.claimAllowed) return { allow: false, status: 401 }
        return id === reservationId ? { allow: true } : { allow: false, status: 401 }
      },
    },
    '@/lib/paymentEngineMode': {
      resolvePaymentEngineMode: () => checks.mode,
      assertLocalMockConfig: () => {
        if (!checks.localConfigOk) throw new Error('local config invalid')
        return { mode: 'local_mock' }
      },
    },
    '@/lib/initiateChapChapPayment': {
      initiateChapChapPayment: async (_input, deps) => {
        calls.p1++
        calls.p1FetchImpl = deps?.fetchImpl ?? null
        return p1Result
      },
    },
    '@/lib/paymentAttempts': {
      initiatePaymentWithAttempt: async (_input, deps) => {
        calls.p2++
        calls.p2FetchImpl = deps?.fetchImpl ?? null
        return p2Result
      },
    },
    '@/lib/supabaseAttemptStore': {
      createSupabaseAttemptStore: () => ({})
    },
  }

  const mod = compileTs('src/app/api/payment/chapchap/route.ts', env, mocks)
  return { route: mod, calls }
}

function loadWebhookRoute({ env, db, verifyOk = true, mode = 'off', applyOutcome = { outcome: 'already_processed', attemptId: 'a', current: 'paid' }, journalFail = false, journalCalls = [], applyThrows = false }) {
  const calls = { apply: 0 }
  const mocks = {
    '@/lib/supabase': { createServiceRoleClient: () => db },
    '@/lib/chapchap': {
      checkRateLimit: () => ({ allowed: true }),
      getClientIp: () => '127.0.0.1',
      secureJson: (payload, _site, init) => Response.json(payload, init),
      verifyChapchapHmac: () => verifyOk,
    },
    '@/lib/paymentEngineMode': {
      resolvePaymentEngineMode: () => mode,
      assertLocalMockConfig: () => ({ mode: 'local_mock' }),
    },
    '@/lib/supabaseAttemptStore': {
      createSupabaseAttemptStore: () => ({})
    },
    '@/lib/paymentAttemptWebhook': {
      applyAttemptEvent: async () => {
        calls.apply++
        if (applyThrows) throw new Error('processing crash')
        return applyOutcome
      },
    },
    '@/lib/paymentEventJournal': {
      createPaymentEventJournalStore: () => ({
        persistWebhookEvent: async () => {
          if (journalFail) throw new Error('storage down')
          journalCalls.push('persist')
          return { eventId: 'event-1', inserted: true }
        },
        markProcessing: async (_eventId, status) => {
          journalCalls.push(status)
        },
      }),
    },
  }

  const mod = compileTs('src/app/api/payment/webhook/route.ts', env, mocks)
  return { route: mod, calls }
}

function paymentRequest({ claim = true } = {}) {
  return new Request('http://localhost:3000/api/payment/chapchap', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      ...(claim ? { 'x-reservation-claim': 'token' } : {}),
    },
    body: JSON.stringify({
      reservationId,
      customerName: 'Aicha',
      customerEmail: 'aicha@example.com',
    }),
  })
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

test('P2 désactivé: route paiement reste P1', async () => {
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_API_KEY_TEST: 'k'.repeat(64), CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080' }
  const { route, calls } = loadChapchapRoute({
    env,
    checks: { mode: 'off', originAllowed: true, claimAllowed: true, localConfigOk: true },
    p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'http://local/checkout' },
    p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'http://local/checkout', attemptId: 'a' },
  })

  const res = await route.POST(paymentRequest())
  assert.equal(res.status, 200)
  assert.equal(calls.p1, 1)
  assert.equal(calls.p2, 0)
  assert.equal(typeof calls.p1FetchImpl, 'function', 'P1 fournit bien un transport')
  if (typeof calls.p1FetchImpl === 'function') {
    await calls.p1FetchImpl('http://127.0.0.1:18080/ecommerce/create', {
      method: 'POST',
      body: '{}',
    })
  }
  assert.equal(calls.redirectPolicy, null, 'P1 ne force pas la politique de redirection')
})

test('P2 activé local_mock: route paiement utilise P2', async () => {
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_API_KEY_TEST: 'k'.repeat(64), CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080' }
  const { route, calls } = loadChapchapRoute({
    env,
    checks: { mode: 'local_mock', originAllowed: true, claimAllowed: true, localConfigOk: true },
    p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'http://local/checkout' },
    p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'http://local/checkout', attemptId: 'a' },
  })

  const res = await route.POST(paymentRequest())
  assert.equal(res.status, 200)
  assert.equal(calls.p1, 0)
  assert.equal(calls.p2, 1)
  assert.equal(typeof calls.p2FetchImpl, 'function', 'P2 fournit bien un transport')
  if (typeof calls.p2FetchImpl === 'function') {
    await calls.p2FetchImpl('http://127.0.0.1:18080/ecommerce/create', {
      method: 'POST',
      body: '{}',
    })
  }
  assert.equal(calls.redirectPolicy, 'error', 'P2 local_mock doit bloquer les redirections HTTP')
})

test('Production force off (même si demandé)', async () => {
  const env = { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://djamiyahgroup.com', CHAPCHAP_API_KEY_PRODUCTION: 'k'.repeat(64), CHAPCHAP_BASE_URL: 'https://chapchappay.com/api' }
  const { route, calls } = loadChapchapRoute({
    env,
    checks: { mode: 'off', originAllowed: true, claimAllowed: true, localConfigOk: true },
    p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'https://pay' },
    p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'https://pay', attemptId: 'a' },
  })

  const res = await route.POST(paymentRequest())
  assert.equal(res.status, 200)
  assert.equal(calls.p1, 1)
  assert.equal(calls.p2, 0)
})

test('Réservation sans claim -> 401', async () => {
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_API_KEY_TEST: 'k'.repeat(64), CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080' }
  const { route } = loadChapchapRoute({
    env,
    checks: { mode: 'off', originAllowed: true, claimAllowed: false, localConfigOk: true },
    p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'http://local/checkout' },
    p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'http://local/checkout', attemptId: 'a' },
  })

  const res = await route.POST(paymentRequest({ claim: false }))
  assert.equal(res.status, 401)
})

test('Origine interdite -> 403', async () => {
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_API_KEY_TEST: 'k'.repeat(64), CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080' }
  const { route } = loadChapchapRoute({
    env,
    checks: { mode: 'off', originAllowed: false, claimAllowed: true, localConfigOk: true },
    p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'http://local/checkout' },
    p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'http://local/checkout', attemptId: 'a' },
  })

  const res = await route.POST(paymentRequest())
  assert.equal(res.status, 403)
})

test('P2 local_mock mal configuré (destination distante) -> refus fermé', async () => {
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_API_KEY_TEST: 'k'.repeat(64), CHAPCHAP_BASE_URL: 'https://chapchappay.com/api' }
  const { route, calls } = loadChapchapRoute({
    env,
    checks: { mode: 'local_mock', originAllowed: true, claimAllowed: true, localConfigOk: false },
    p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'http://local/checkout' },
    p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'http://local/checkout', attemptId: 'a' },
  })

  const res = await route.POST(paymentRequest())
  assert.equal(res.status, 500)
  assert.equal(calls.p1, 0)
  assert.equal(calls.p2, 0)
})

test('P2 local_mock mal configuré (loopback ambigu avec credentials/query/hash) -> refus fermé', async () => {
  const baseEnv = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_API_KEY_TEST: 'k'.repeat(64),
  }

  for (const badUrl of [
    'http://user:pass@127.0.0.1:18080',
    'http://127.0.0.1:18080?next=https://evil.invalid',
    'http://127.0.0.1:18080#remote',
  ]) {
    const { route, calls } = loadChapchapRoute({
      env: { ...baseEnv, CHAPCHAP_BASE_URL: badUrl },
      checks: { mode: 'local_mock', originAllowed: true, claimAllowed: true, localConfigOk: false },
      p1Result: { kind: 'ok', orderId: 'MB-1', paymentUrl: 'http://local/checkout' },
      p2Result: { kind: 'ok', orderId: 'MB-2', paymentUrl: 'http://local/checkout', attemptId: 'a' },
    })

    const res = await route.POST(paymentRequest())
    assert.equal(res.status, 500)
    assert.equal(calls.p1, 0)
    assert.equal(calls.p2, 0)
  }
})

test('Webhook HMAC invalide -> 401, aucune confirmation', async () => {
  const db = makeRoomDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const { route, calls } = loadWebhookRoute({ env, db, verifyOk: false })

  const req = webhookRequest({ status: 'success', reservation_id: reservationId, metadata: { reservation_type: 'room' } })
  const res = await route.POST(req)
  assert.equal(res.status, 401)
  assert.equal(calls.apply, 0)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
})

test('Webhook P2 local_mock: journalisation échoue -> 503 sans perte silencieuse', async () => {
  const db = makeRoomDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const { route, calls } = loadWebhookRoute({ env, db, verifyOk: true, mode: 'local_mock', journalFail: true })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', attempt_id: 'attempt-1' },
    operation_id: 'OP-A',
    request_id: 'REQ-A',
  })
  const res = await route.POST(req)
  assert.equal(res.status, 503)
  assert.equal(calls.apply, 0)
})

test('Webhook P2 local_mock: échec de traitement après journalisation -> 500 sans confirmation', async () => {
  const db = makeRoomDb()
  const marks = []
  const env = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_HMAC_SECRET: 'local-secret',
  }
  const { route, calls } = loadWebhookRoute({
    env,
    db,
    verifyOk: true,
    mode: 'local_mock',
    applyThrows: true,
    journalCalls: marks,
  })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', attempt_id: 'attempt-1' },
    operation_id: 'OP-A',
    request_id: 'REQ-A',
  })
  const res = await route.POST(req)
  assert.equal(res.status, 500)
  assert.equal(calls.apply, 1)
  assert.equal(db.rows.reservations[reservationId].payment_status, 'pending')
  assert.deepEqual(marks, ['persist', 'storage_failed'])
})

test('Webhook authentifié non vérifiable -> journal + reconciliation_required', async () => {
  const db = makeRoomDb()
  const marks = []
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const { route } = loadWebhookRoute({
    env,
    db,
    verifyOk: true,
    mode: 'local_mock',
    applyOutcome: { outcome: 'manual_reconciliation_required', reason: 'unverified_provider_identity', attemptId: 'attempt-1' },
    journalCalls: marks,
  })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', attempt_id: 'attempt-1' },
    operation_id: 'OP-B',
    request_id: 'REQ-B',
  })
  const res = await route.POST(req)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.note, 'reconciliation_required')
  assert.ok(marks.includes('persist'))
  assert.ok(marks.includes('reconciliation_required'))
})

test('Webhook replay identique -> idempotent (already_processed)', async () => {
  const db = makeRoomDb()
  const marks = []
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const { route } = loadWebhookRoute({
    env,
    db,
    verifyOk: true,
    mode: 'local_mock',
    applyOutcome: { outcome: 'already_processed', attemptId: 'attempt-1', current: 'paid' },
    journalCalls: marks,
  })

  const req = webhookRequest({
    status: 'success',
    reservation_id: reservationId,
    metadata: { reservation_type: 'room', attempt_id: 'attempt-1' },
    operation_id: 'OP-A',
    request_id: 'REQ-A',
  })
  const res = await route.POST(req)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.ok(marks.includes('processed'))
})

test('Webhook conference en local_mock: flow conférence préservé', async () => {
  const db = makeRoomDb()
  const env = { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', CHAPCHAP_HMAC_SECRET: 'local-secret' }
  const { route, calls } = loadWebhookRoute({ env, db, verifyOk: true, mode: 'local_mock' })

  const req = webhookRequest({
    status: 'success',
    conference_reservation_id: reservationId,
    metadata: { reservation_type: 'conference' },
    operation_id: 'OP-C',
  })

  const res = await route.POST(req)
  assert.equal(res.status, 200)
  assert.equal(calls.apply, 0, 'pas de moteur P2 room sur conférence')
})
