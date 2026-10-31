import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import {
  readLocalTestConfig,
  assertOwnedBench,
  localOnlyFetch,
} from '../../scripts/local-tests/connection-policy.mjs'
import {
  CLAIM_EXPIRY_DELAY_MS,
  initiatePaymentWithAttempt,
} from '../../src/lib/paymentAttempts.ts'
import { applyAttemptEvent } from '../../src/lib/paymentAttemptWebhook.ts'
import { createSupabaseAttemptStore } from '../../src/lib/supabaseAttemptStore.ts'

const config = readLocalTestConfig()
const RUN = config !== null
const runOrSkip = RUN ? test : test.skip
if (!RUN) {
  console.log('Supabase payment-attempt integration skipped: run via local bench runner')
}

const client = RUN
  ? createClient(config.apiUrl, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: localOnlyFetch() },
    })
  : null
if (client) await assertOwnedBench(client, config.benchId)

const attemptStore = RUN ? createSupabaseAttemptStore(client) : null
const createdReservationIds = []

const ACTIVE_STATUSES = ['created', 'awaiting_pay', 'unknown']

async function insertFictiveReservation(hotelName = 'Hôtel Maison Blanche') {
  const row = {
    first_name: 'Adap',
    last_name: 'Concurrent',
    email: `attempt+${randomUUID().slice(0, 8)}@example.com`,
    phone: '+224600000099',
    hotel_name: hotelName,
    room_type: 'Suite Prestige',
    check_in: '2031-06-01',
    check_out: '2031-06-03',
    guests: 2,
    total_price: 2_400_000,
    currency: 'GNF',
    payment_status: 'pending',
    payment_method: null,
    status: 'confirmed',
  }
  const { data, error } = await client.from('reservations').insert(row).select('id').single()
  assert.equal(error, null, `insert réservation fictive: ${error?.message ?? ''}`)
  createdReservationIds.push(data.id)
  return data.id
}

function createDbReservationStore(dbClient) {
  return {
    async fetchReservation(id) {
      const { data, error } = await dbClient
        .from('reservations')
        .select('id,hotel_name,total_price,payment_status,status,currency')
        .eq('id', id)
        .single()
      return { data, error }
    },
  }
}

function makeDeps({ reservationId, fetchImpl }) {
  return {
    reservationStore: createDbReservationStore(client),
    attemptStore,
    apiKey: 'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef5600',
    baseUrl: 'https://chapchappay.test.local',
    notifyUrl: 'https://djamiyahgroup.test.local/api/payment/webhook',
    returnUrl: `https://djamiyahgroup.test.local/reservation/success?reservation_id=${reservationId}`,
    cancelUrl: 'https://djamiyahgroup.test.local/reservation',
    fetchImpl,
  }
}

function makeInput(reservationId) {
  return {
    reservationId,
    customerName: 'Aïcha Diallo',
    customerEmail: 'aicha@example.com',
    roomName: 'Suite Prestige',
  }
}

function createCountingProvider({ mode = 'ok' } = {}) {
  const calls = []
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    calls.push({ url, init, body })

    if (mode === 'timeout') {
      const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
      throw abortError
    }

    if (mode === 'missing_checkout_url') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    return new Response(JSON.stringify({ payment_url: 'https://pay.test/checkout-123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { calls, fetchImpl }
}

function createDeferredProvider() {
  const calls = []
  const pending = []
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    calls.push({ url, init, body })
    return await new Promise((resolve, reject) => pending.push({ resolve, reject }))
  }
  return {
    calls,
    fetchImpl,
    resolveFirstOk() {
      const first = pending.shift()
      if (!first) throw new Error('no pending provider call')
      first.resolve(
        new Response(JSON.stringify({ payment_url: 'https://pay.test/checkout-delayed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    },
  }
}

async function countActiveAttempts(reservationId) {
  const { data, error } = await client
    .from('payment_attempts')
    .select('id,status')
    .eq('reservation_id', reservationId)
    .in('status', ACTIVE_STATUSES)
  assert.equal(error, null, `count active attempts: ${error?.message ?? ''}`)
  return data.length
}

async function waitForProviderCalls(provider, expected, timeoutMs = 2000) {
  const started = Date.now()
  while (provider.calls.length < expected) {
    if (Date.now() - started > timeoutMs) throw new Error('timeout waiting provider calls')
    await new Promise((r) => setTimeout(r, 10))
  }
}

function summarizeResults(results) {
  const summary = {
    ok: 0,
    busy: 0,
    reused: 0,
    blocked_unknown: 0,
    provider_timeout: 0,
    internal_error: 0,
    other: 0,
    attemptIds: [],
  }
  for (const r of results) {
    if (Object.hasOwn(summary, r.kind)) summary[r.kind] += 1
    else summary.other += 1
    if (typeof r.attemptId === 'string') summary.attemptIds.push(r.attemptId)
  }
  return summary
}

function logConcurrencyProbe(label, { reservationId, providerCalls, results, provider }) {
  const summary = summarizeResults(results)
  const orderIds = provider.calls.map((c) => c.body?.order_id)
  const attemptIdsFromPayload = provider.calls.map((c) => c.body?.metadata?.attempt_id)
  console.info(
    JSON.stringify({
      probe: label,
      reservation_id: reservationId,
      provider_call_count: providerCalls,
      outcomes: summary,
      provider_order_ids: orderIds,
      provider_attempt_ids: attemptIdsFromPayload,
      raw_results: results,
    })
  )
}

runOrSkip('anti-double paiement: 2 demandes simultanées -> 1 appel prestataire max', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const results = await Promise.all([
    initiatePaymentWithAttempt(makeInput(reservationId), deps),
    initiatePaymentWithAttempt(makeInput(reservationId), deps),
  ])

  const okCount = results.filter((r) => r.kind === 'ok').length
  const busyCount = results.filter((r) => r.kind === 'busy').length
  const disallowed = results.filter((r) => ['internal_error', 'blocked_unknown'].includes(r.kind))
  logConcurrencyProbe('concurrent-2', {
    reservationId,
    providerCalls: provider.calls.length,
    results,
    provider,
  })
  assert.equal(okCount, 1, 'un seul succès attendu sur la fenêtre de concurrence')
  assert.equal(busyCount, 1)
  assert.equal(disallowed.length, 0, 'aucune erreur logique concurrente')
  assert.equal(provider.calls.length, 1, 'un seul appel ChapChap')
  assert.equal(new Set(provider.calls.map((c) => c.body?.metadata?.attempt_id)).size, 1)
  assert.equal(await countActiveAttempts(reservationId), 1, 'une seule tentative active')
})

runOrSkip('anti-double paiement: 10 demandes simultanées -> 1 appel prestataire max', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const results = await Promise.all(
    Array.from({ length: 10 }, () => initiatePaymentWithAttempt(makeInput(reservationId), deps))
  )

  const okCount = results.filter((r) => r.kind === 'ok').length
  const busyCount = results.filter((r) => r.kind === 'busy').length
  const disallowed = results.filter((r) => ['internal_error', 'blocked_unknown'].includes(r.kind))
  logConcurrencyProbe('concurrent-10', {
    reservationId,
    providerCalls: provider.calls.length,
    results,
    provider,
  })
  assert.equal(okCount + busyCount, 10, 'toutes les réponses concurrentes doivent être ok|busy')
  assert.equal(okCount >= 1, true, 'au moins un succès (lien)')
  assert.equal(busyCount >= 1, true, 'au moins une requête concurrente bloquée')
  assert.equal(disallowed.length, 0)
  assert.equal(provider.calls.length, 1, 'un seul appel ChapChap')
  assert.equal(new Set(provider.calls.map((c) => c.body?.metadata?.attempt_id)).size, 1)
  assert.equal(await countActiveAttempts(reservationId), 1)
})

runOrSkip('double clic avec réponse prestataire retardée -> pas de second appel', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createDeferredProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const first = initiatePaymentWithAttempt(makeInput(reservationId), deps)
  await waitForProviderCalls(provider, 1)
  const second = await initiatePaymentWithAttempt(makeInput(reservationId), deps)

  logConcurrencyProbe('double-click-slow-provider', {
    reservationId,
    providerCalls: provider.calls.length,
    results: [second],
    provider,
  })
  assert.equal(second.kind, 'busy')
  assert.equal(provider.calls.length, 1)

  provider.resolveFirstOk()
  const firstResult = await first
  assert.equal(firstResult.kind, 'ok')
})

runOrSkip('répétition même tentative (lien frais) -> réutilisation sans nouvel appel', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const first = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  const second = await initiatePaymentWithAttempt(makeInput(reservationId), deps)

  logConcurrencyProbe('same-attempt-repeat-fresh-link', {
    reservationId,
    providerCalls: provider.calls.length,
    results: [first, second],
    provider,
  })
  assert.equal(first.kind, 'ok')
  assert.equal(second.kind, 'ok')
  assert.equal(first.attemptId, second.attemptId)
  assert.equal(provider.calls.length, 1, 'aucun nouvel appel ChapChap')
})

runOrSkip('timeout prestataire -> unknown puis blocage sans nouvel appel', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider({ mode: 'timeout' })
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const first = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  assert.equal(first.kind, 'provider_timeout')

  const second = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  logConcurrencyProbe('provider-timeout-then-blocked', {
    reservationId,
    providerCalls: provider.calls.length,
    results: [first, second],
    provider,
  })
  assert.equal(second.kind, 'blocked_unknown')
  assert.equal(provider.calls.length, 1)
})

runOrSkip('tentative unknown existante -> blocage immédiat sans appel prestataire', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()

  const ins = await attemptStore.insert({
    reservation_id: reservationId,
    reference: 'MB-UNKNOWN',
    order_id: `MB-U-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 2_400_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return
  await attemptStore.updateStatus(ins.row.id, { status: 'unknown' })

  const result = await initiatePaymentWithAttempt(
    makeInput(reservationId),
    makeDeps({ reservationId, fetchImpl: provider.fetchImpl })
  )
  assert.equal(result.kind, 'blocked_unknown')
  assert.equal(provider.calls.length, 0)
})

runOrSkip('claim expiré repris -> requalifié unknown, aucun appel prestataire', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()

  const ins = await attemptStore.insert({
    reservation_id: reservationId,
    reference: 'MB-STALE',
    order_id: `MB-S-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 2_400_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return

  await attemptStore.updateStatus(ins.row.id, {
    claimed_at: new Date(Date.now() - CLAIM_EXPIRY_DELAY_MS - 60_000).toISOString(),
  })

  const result = await initiatePaymentWithAttempt(
    makeInput(reservationId),
    makeDeps({ reservationId, fetchImpl: provider.fetchImpl })
  )

  assert.equal(result.kind, 'blocked_unknown')
  assert.equal(provider.calls.length, 0)

  const row = await attemptStore.selectById(ins.row.id)
  assert.equal(row?.status, 'unknown')
})

runOrSkip('même jeton concurrent (2 requêtes) -> 1 seul dispatch provider', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const sharedInput = makeInput(reservationId)
  const [a, b] = await Promise.all([
    initiatePaymentWithAttempt(sharedInput, deps),
    initiatePaymentWithAttempt(sharedInput, deps),
  ])

  logConcurrencyProbe('same-token-concurrent-2', {
    reservationId,
    providerCalls: provider.calls.length,
    results: [a, b],
    provider,
  })
  assert.equal(provider.calls.length, 1)
  assert.equal(new Set(provider.calls.map((c) => c.body?.metadata?.attempt_id)).size, 1)
})

runOrSkip('crash après autorisation de dispatch (pas de settle) -> aucun second dispatch auto', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createDeferredProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const first = initiatePaymentWithAttempt(makeInput(reservationId), deps)
  await waitForProviderCalls(provider, 1)

  const second = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  logConcurrencyProbe('crash-after-dispatch-authorization', {
    reservationId,
    providerCalls: provider.calls.length,
    results: [second],
    provider,
  })

  assert.equal(provider.calls.length, 1, 'barrière persistante: pas de 2e dispatch')
  assert.notEqual(second.kind, 'ok', 'ne doit pas réémettre un lien via un 2e dispatch')

  provider.resolveFirstOk()
  await first
})

runOrSkip('webhook avant réponse prestataire: paid ne doit jamais régresser', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createDeferredProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const first = initiatePaymentWithAttempt(makeInput(reservationId), deps)
  await waitForProviderCalls(provider, 1)

  const payload = provider.calls[0].body
  const attemptId = payload?.metadata?.attempt_id
  assert.equal(typeof attemptId, 'string')

  const webhook = await applyAttemptEvent(attemptStore, {
    reservationId,
    attemptId,
    orderId: payload.order_id,
    amount: payload.amount,
    currency: 'GNF',
    incomingStatusRaw: 'success',
  })
  assert.equal(webhook.outcome, 'updated', 'webhook doit passer paid')

  provider.resolveFirstOk()
  const firstResult = await first
  assert.equal(firstResult.kind, 'ok')

  const final = await attemptStore.selectById(attemptId)
  assert.equal(final?.status, 'paid', 'un settlement tardif ne doit pas écraser paid')
})


runOrSkip('webhooks concurrents failed/success (ordre failed->success) -> paid final', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const created = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  assert.equal(created.kind, 'ok')
  if (created.kind !== 'ok') return

  const [a, b] = await Promise.all([
    applyAttemptEvent(attemptStore, {
      reservationId,
      attemptId: created.attemptId,
      orderId: created.orderId,
      amount: 2_400_000,
      currency: 'GNF',
      incomingStatusRaw: 'failed',
    }),
    applyAttemptEvent(attemptStore, {
      reservationId,
      attemptId: created.attemptId,
      orderId: created.orderId,
      amount: 2_400_000,
      currency: 'GNF',
      incomingStatusRaw: 'success',
    }),
  ])

  const final = await attemptStore.selectById(created.attemptId)
  assert.equal(final?.status, 'paid')

  const allowed = new Set(['updated', 'already_processed', 'ignored_out_of_order'])
  assert.ok(allowed.has(a.outcome), `outcome A inattendu: ${a.outcome}`)
  assert.ok(allowed.has(b.outcome), `outcome B inattendu: ${b.outcome}`)
})

runOrSkip('webhooks concurrents success/failed (ordre success->failed) -> paid final', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider()
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const created = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  assert.equal(created.kind, 'ok')
  if (created.kind !== 'ok') return

  const [a, b] = await Promise.all([
    applyAttemptEvent(attemptStore, {
      reservationId,
      attemptId: created.attemptId,
      orderId: created.orderId,
      amount: 2_400_000,
      currency: 'GNF',
      incomingStatusRaw: 'success',
    }),
    applyAttemptEvent(attemptStore, {
      reservationId,
      attemptId: created.attemptId,
      orderId: created.orderId,
      amount: 2_400_000,
      currency: 'GNF',
      incomingStatusRaw: 'failed',
    }),
  ])

  const final = await attemptStore.selectById(created.attemptId)
  assert.equal(final?.status, 'paid')

  const allowed = new Set(['updated', 'already_processed', 'ignored_out_of_order'])
  assert.ok(allowed.has(a.outcome), `outcome A inattendu: ${a.outcome}`)
  assert.ok(allowed.has(b.outcome), `outcome B inattendu: ${b.outcome}`)
})

runOrSkip('confirmation légitime: unknown -> paid via webhook authentifié (applyAttemptEvent)', async () => {
  const reservationId = await insertFictiveReservation()
  const provider = createCountingProvider({ mode: 'timeout' })
  const deps = makeDeps({ reservationId, fetchImpl: provider.fetchImpl })

  const first = await initiatePaymentWithAttempt(makeInput(reservationId), deps)
  assert.equal(first.kind, 'provider_timeout')
  if (first.kind !== 'provider_timeout') return

  const before = await attemptStore.selectById(first.attemptId)
  assert.equal(before?.status, 'unknown')

  const orderId = provider.calls[0]?.body?.order_id
  const amount = provider.calls[0]?.body?.amount
  const confirmed = await applyAttemptEvent(attemptStore, {
    reservationId,
    attemptId: first.attemptId,
    orderId,
    amount,
    currency: 'GNF',
    incomingStatusRaw: 'success',
  })

  assert.equal(confirmed.outcome, 'updated')
  const after = await attemptStore.selectById(first.attemptId)
  assert.equal(after?.status, 'paid')
})

test('nettoyage: suppression des tentatives/réservations fictives (paymentAttempts integration)', async () => {
  if (!RUN) return
  for (const rid of createdReservationIds) {
    await client.from('payment_attempts').delete().eq('reservation_id', rid)
    await client.from('reservations').delete().eq('id', rid)
  }
  createdReservationIds.length = 0
})
