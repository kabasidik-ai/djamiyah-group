import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initiatePaymentWithAttempt } from '../../src/lib/paymentAttempts.ts'
import { applyAttemptEvent } from '../../src/lib/paymentAttemptWebhook.ts'
import {
  createMemoryAttemptStore,
  createMemoryReservationStore,
  makeReservation,
} from './memoryAttemptStore.mjs'

const RESERVATION_ID = 'def67890-1234-4abc-9012-abcdef123456'

async function startFakeChapChapProvider({
  operationId = 'OP-A',
  requestId = 'REQ-A',
  paymentUrl = 'https://pay.test.local/checkout/ok',
  statusCode = 200,
  delayMs = 0,
} = {}) {
  const calls = []

  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/ecommerce/create') {
      res.writeHead(404).end(JSON.stringify({ message: 'not_found' }))
      return
    }

    let body = ''
    for await (const chunk of req) body += chunk
    calls.push({ headers: req.headers, body: JSON.parse(body || '{}') })

    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))

    const payload =
      statusCode >= 200 && statusCode < 300
        ? { payment_url: paymentUrl, operation_id: operationId, request_id: requestId }
        : { message: 'provider_error' }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(payload))
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('fake provider address unavailable')

  return {
    calls,
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

function verifyWebhookHmac(rawBody, signature, secret) {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const normalized = String(signature).trim().toLowerCase().replace(/^sha256=/, '')
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(normalized, 'utf8'))
}

function makeDeps({ attemptStore, reservationStore, baseUrl, fetchImpl }) {
  return {
    reservationStore,
    attemptStore,
    apiKey: 'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef5600',
    baseUrl,
    notifyUrl: 'https://djamiyahgroup.test.local/api/payment/webhook',
    returnUrl: `https://djamiyahgroup.test.local/reservation/success?reservation_id=${RESERVATION_ID}`,
    cancelUrl: 'https://djamiyahgroup.test.local/reservation',
    fetchImpl,
  }
}

function makeInput() {
  return {
    reservationId: RESERVATION_ID,
    customerName: 'Aïcha Diallo',
    customerEmail: 'aicha@example.com',
    roomName: 'Suite Prestige',
  }
}

test('staging simulation: création réservation + tentative + dispatch unique + webhook signé + confirmation', async () => {
  const provider = await startFakeChapChapProvider({ operationId: 'OP-A', requestId: 'REQ-A' })
  try {
    const attemptStore = createMemoryAttemptStore()
    const reservationStore = createMemoryReservationStore({
      row: makeReservation({
        id: RESERVATION_ID,
        hotel_name: 'Hôtel Maison Blanche',
        payment_status: 'pending',
        status: 'confirmed',
        total_price: 1_500_000,
        currency: 'GNF',
      }),
    })

    const deps = makeDeps({
      attemptStore,
      reservationStore,
      baseUrl: provider.baseUrl,
      fetchImpl: (url, init) => fetch(url, init),
    })

    const [r1, r2] = await Promise.all([
      initiatePaymentWithAttempt(makeInput(), deps),
      initiatePaymentWithAttempt(makeInput(), deps),
    ])


    const ok = [r1, r2].find((r) => r.kind === 'ok')
    const busy = [r1, r2].find((r) => r.kind === 'busy')

    assert.ok(ok, 'un pilote doit créer la tentative')
    assert.ok(busy, 'une requête concurrente doit être occupée')
    assert.equal(provider.calls.length, 1, 'un seul dispatch prestataire')

    const attemptId = ok?.attemptId
    assert.ok(attemptId)

    const attempt = await attemptStore.selectById(attemptId)
    assert.equal(attempt?.status, 'awaiting_pay')
    assert.equal(attempt?.provider_operation_id, 'OP-A')
    assert.equal(attempt?.provider_request_id, 'REQ-A')

    const webhookPayload = {
      status: 'success',
      reservation_id: RESERVATION_ID,
      metadata: { attempt_id: attemptId, reservation_id: RESERVATION_ID },
      operation_id: 'OP-A',
      request_id: 'REQ-A',
    }
    const webhookSecret = 'local-fake-webhook-secret-123'
    const rawBody = JSON.stringify(webhookPayload)
    const signature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex')

    assert.equal(verifyWebhookHmac(rawBody, signature, webhookSecret), true)

    const applied = await applyAttemptEvent(attemptStore, {
      reservationId: RESERVATION_ID,
      attemptId,
      orderId: attempt?.order_id,
      incomingStatusRaw: webhookPayload.status,
      providerOperationId: webhookPayload.operation_id,
      providerRequestId: webhookPayload.request_id,
    })

    assert.equal(applied.outcome, 'updated')

    const after = await attemptStore.selectById(attemptId)
    assert.equal(after?.status, 'paid')
  } finally {
    await provider.close()
  }
})

test('staging simulation: un dispatch unique sous concurrence (pas de double création provider)', async () => {
  const provider = await startFakeChapChapProvider({ operationId: 'OP-REUSE', requestId: 'REQ-REUSE' })
  try {
    const attemptStore = createMemoryAttemptStore()
    const reservationStore = createMemoryReservationStore({ row: makeReservation({ id: RESERVATION_ID }) })

    const deps = makeDeps({
      attemptStore,
      reservationStore,
      baseUrl: provider.baseUrl,
      fetchImpl: (url, init) => fetch(url, init),
    })

    const [a, b] = await Promise.all([
      initiatePaymentWithAttempt(makeInput(), deps),
      initiatePaymentWithAttempt(makeInput(), deps),
    ])

    const kinds = new Set([a.kind, b.kind])
    assert.ok(kinds.has('ok'))
    assert.ok(kinds.has('busy') || kinds.has('reused'))
    assert.equal(provider.calls.length, 1)
  } finally {
    await provider.close()
  }
})

test('staging simulation: timeout prestataire local -> unknown + blocage', async () => {
  const provider = await startFakeChapChapProvider({ delayMs: 250 })
  try {
    const attemptStore = createMemoryAttemptStore()
    const reservationStore = createMemoryReservationStore({ row: makeReservation({ id: RESERVATION_ID }) })

    const deps = makeDeps({
      attemptStore,
      reservationStore,
      baseUrl: provider.baseUrl,
      fetchImpl: async () => {
        const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
        throw abortError
      },
    })

    const first = await initiatePaymentWithAttempt(makeInput(), deps)
    assert.equal(first.kind, 'provider_timeout')

    const firstAttempt = await attemptStore.selectById(first.attemptId)
    assert.equal(firstAttempt?.status, 'unknown')

    const second = await initiatePaymentWithAttempt(makeInput(), deps)
    assert.equal(second.kind, 'blocked_unknown')
  } finally {
    await provider.close()
  }
})

test('staging simulation: replays OP-A/OP-B et mismatch -> réconciliation/rejet strict', async () => {
  const provider = await startFakeChapChapProvider({ operationId: 'OP-A', requestId: 'REQ-A' })
  try {
    const attemptStore = createMemoryAttemptStore()
    const reservationStore = createMemoryReservationStore({ row: makeReservation({ id: RESERVATION_ID }) })

    const deps = makeDeps({
      attemptStore,
      reservationStore,
      baseUrl: provider.baseUrl,
      fetchImpl: (url, init) => fetch(url, init),
    })

    const first = await initiatePaymentWithAttempt(makeInput(), deps)
    assert.equal(first.kind, 'ok')
    if (first.kind !== 'ok') return

    const replayNoIdentity = await applyAttemptEvent(attemptStore, {
      reservationId: RESERVATION_ID,
      attemptId: first.attemptId,
      incomingStatusRaw: 'success',
    })
    assert.equal(replayNoIdentity.outcome, 'manual_reconciliation_required')

    const replayWrongIdentity = await applyAttemptEvent(attemptStore, {
      reservationId: RESERVATION_ID,
      attemptId: first.attemptId,
      incomingStatusRaw: 'success',
      providerOperationId: 'OP-B',
      providerRequestId: 'REQ-A',
    })
    assert.equal(replayWrongIdentity.outcome, 'identity_mismatch')
  } finally {
    await provider.close()
  }
})
