import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  initiatePaymentWithAttempt,
  CLAIM_EXPIRY_DELAY_MS,
} from '../../src/lib/paymentAttempts.ts'
import {
  createMemoryAttemptStore,
  createMemoryReservationStore,
  mockChapChapFetch,
} from './memoryAttemptStore.mjs'

/**
 * Tests P2 — concurrence et états des tentatives de paiement.
 * Aucun appel réseau réel ni base réelle : le store mémoire reproduit l'index
 * partiel SQL ; ses mutations sont atomiques entre vérification et application
 * (équivalent autocommit pour la simulation).
 */

const RESERVATION_ID = 'def67890-1234-4abc-9012-abcdef123456'

function makeDeps({ attemptStore, reservationStore, fetchImpl }) {
  return {
    reservationStore,
    attemptStore,
    apiKey: 'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef5600',
    baseUrl: 'https://chapchappay.com/api',
    notifyUrl: 'https://djamiyahgroup.com/api/payment/webhook',
    returnUrl:
      'https://djamiyahgroup.com/reservation/success?reservation_id=' + RESERVATION_ID,
    cancelUrl: 'https://djamiyahgroup.com/reservation',
    fetchImpl,
  }
}

function makeInput(overrides = {}) {
  return {
    reservationId: RESERVATION_ID,
    customerName: 'Aïcha Diallo',
    customerEmail: 'aicha@example.com',
    roomName: 'Suite Prestige',
    ...overrides,
  }
}

function activeRows(store) {
  return store._rows().filter((r) => ['created', 'awaiting_pay', 'unknown'].includes(r.status))
}

// ── Concurrence ─────────────────────────────────────────────────────────────────

test('2 demandes simultanées → 1 seul appel ChapChap et 1 tentative active', async () => {
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const results = await Promise.all([
    initiatePaymentWithAttempt(makeInput(), deps),
    initiatePaymentWithAttempt(makeInput(), deps),
  ])

  // Vrai parallélisme : le gagnant pilote ('ok'), les concurrents reçoivent
  // 'busy' (même tentative) — jamais un second appel prestataire.
  const okResults = results.filter((r) => r.kind === 'ok')
  const busyResults = results.filter((r) => r.kind === 'busy')
  assert.equal(okResults.length, 1, 'un seul pilote')
  assert.equal(busyResults.length, 1, 'un seul concurrent en attente (poll statut)')
  assert.equal(calls.length, 1, 'un seul appel prestataire')
  assert.equal(new Set(results.map((r) => r.attemptId)).size, 1, 'une seule tentative')
  assert.equal(activeRows(store).length, 1)

  const okResult = okResults[0]
  if (okResult.kind !== 'ok') return
  const body = calls[0].body
  assert.match(body.order_id, /^MB-DEF67890-[0-9A-F]{8}$/)
  assert.equal(body.metadata.reservation_id, RESERVATION_ID)
  assert.equal(body.metadata.reservation_type, 'room')
  assert.ok(body.metadata.attempt_id)
  assert.equal(body.metadata.reference, 'MB-DEF67890')
  assert.equal(okResult.attemptId, body.metadata.attempt_id)
})

test('10 demandes simultanées → 1 seul appel ChapChap, même tentative', async () => {
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const results = await Promise.all(
    Array.from({ length: 10 }, () => initiatePaymentWithAttempt(makeInput(), deps))
  )

  assert.equal(calls.length, 1, 'un seul appel prestataire pour 10 demandes')
  assert.equal(activeRows(store).length, 1, 'une seule tentative active')
  const okResults = results.filter((r) => r.kind === 'ok')
  const busyResults = results.filter((r) => r.kind === 'busy')
  assert.equal(okResults.length, 1, 'un seul pilote sur 10 demandes')
  assert.equal(busyResults.length, 9, '9 concurrents mis en attente (poll statut)')
  const ids = new Set(results.map((r) => r.attemptId))
  assert.equal(ids.size, 1, 'toutes les demandes référencent la même tentative')
  assert.equal(new Set(okResults.map((r) => r.paymentUrl)).size, 1)
})

test('double-clic consécutif → réutilisation du lien, aucun nouveau paiement', async () => {
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const r1 = await initiatePaymentWithAttempt(makeInput(), deps)
  const r2 = await initiatePaymentWithAttempt(makeInput(), deps)

  assert.equal(r1.kind, 'ok')
  assert.equal(r2.kind, 'ok')
  if (r1.kind !== 'ok' || r2.kind !== 'ok') return
  assert.equal(calls.length, 1)
  assert.equal(r1.attemptId, r2.attemptId)
  assert.equal(r1.orderId, r2.orderId)
  assert.equal(r1.paymentUrl, r2.paymentUrl)
})// ── Timeouts, issues incertaines et récupération ─────────────────────────────────

test('timeout prestataire → attempt unknown puis blocage (aucun nouvel appel)', async () => {
  const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch({ respond: () => Promise.reject(abortError) })
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const r1 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r1.kind, 'provider_timeout')
  if (r1.kind !== 'provider_timeout') return
  assert.equal(store._rows().find((r) => r.id === r1.attemptId).status, 'unknown')

  const r2 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r2.kind, 'blocked_unknown', 'toute nouvelle tentative est bloquée')
  assert.equal(calls.length, 1, "l'état inconnu n'a pas créé de nouvelle opération")
})

test('réponse prestataire perdue (2xx sans URL) → unknown puis blocage', async () => {
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch({
    respond: () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  })
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const r1 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r1.kind, 'missing_checkout_url')
  if (r1.kind !== 'missing_checkout_url') return
  assert.equal(store._rows().find((r) => r.id === r1.attemptId).status, 'unknown')

  const r2 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r2.kind, 'blocked_unknown')
  assert.equal(calls.length, 1)
})

test('refus net 4xx → tentative failed puis nouvelle tentative possible (nouvel order_id)', async () => {
  const store = createMemoryAttemptStore()
  let fail = true
  const { calls, fetchImpl } = mockChapChapFetch({
    respond: () =>
      fail
        ? new Response(JSON.stringify({ error: 'validation' }), { status: 400 })
        : new Response(JSON.stringify({ payment_url: 'https://pay.test/retry-ok' }), {
            status: 200,
          }),
  })
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const r1 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r1.kind, 'provider_error')
  if (r1.kind !== 'provider_error') return
  assert.equal(store._rows().find((r) => r.id === r1.attemptId).status, 'failed')

  fail = false
  const r2 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r2.kind, 'ok')
  if (r2.kind !== 'ok') return
  assert.notEqual(r2.attemptId, r1.attemptId, 'nouvelle tentative (order_id neuf)')
  assert.notEqual(r2.orderId, r1.orderId)
  assert.equal(calls.length, 2)
})

test('tentative orpheline au claim expiré → bloquée en unknown (pas de ré-appel)', async () => {
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch()
  // Simule un crash avant tout appel : ligne 'created' jamais prise en charge.
  await store.insert({
    reservation_id: RESERVATION_ID,
    reference: 'MB-DEF67890',
    order_id: 'MB-DEF67890-ABABABAB',
    amount: 1_500_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  store._rows()[0].claimed_at = new Date(
    Date.now() - CLAIM_EXPIRY_DELAY_MS - 60_000
  ).toISOString()

  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })
  const result = await initiatePaymentWithAttempt(makeInput(), deps)

  assert.equal(result.kind, 'blocked_unknown')
  assert.equal(store._rows()[0].status, 'unknown', 'requalifiée en unknown (réconciliation)')
  assert.equal(calls.length, 0, 'aucun appel automatique sur une tentative orpheline')
})

test('lien de caisse périmé → révoqué en unknown, aucune réutilisation', async () => {
  const store = createMemoryAttemptStore()
  const { calls, fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const r1 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r1.kind, 'ok')
  if (r1.kind !== 'ok') return

  // Fait vieillir le lien au-delà de la fenêtre de validité démontrée.
  store._rows()[0].created_at = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()

  const r2 = await initiatePaymentWithAttempt(makeInput(), deps)
  assert.equal(r2.kind, 'blocked_unknown', 'lien périmé : jamais réutilisé')
  assert.equal(store._rows()[0].status, 'unknown')
  assert.equal(calls.length, 1, 'aucun nouvel appel')
})

// ── Éligibilité + diagnostic d'autorisation ─────────────────────────────────────

test('réservation déjà payée → refusée (409), aucune tentative créée', async () => {
  const store = createMemoryAttemptStore()
  const { fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore({ row: { payment_status: 'paid' } }),
    fetchImpl,
  })

  const result = await initiatePaymentWithAttempt(makeInput(), deps)

  assert.equal(result.kind, 'eligibility_error')
  if (result.kind !== 'eligibility_error') return
  assert.equal(result.code, 409)
  assert.equal(store._rows().length, 0, 'aucune tentative pour une réservation payée')
})

test('réservation annulée → refusée (409)', async () => {
  const store = createMemoryAttemptStore()
  const { fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore({ row: { status: 'cancelled' } }),
    fetchImpl,
  })

  const result = await initiatePaymentWithAttempt(makeInput(), deps)

  assert.equal(result.kind, 'eligibility_error')
  if (result.kind !== 'eligibility_error') return
  assert.equal(result.code, 409)
  assert.equal(store._rows().length, 0)
})

test('montant invalide → refusé (400)', async () => {
  const store = createMemoryAttemptStore()
  const { fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore({ row: { total_price: 0 } }),
    fetchImpl,
  })

  const result = await initiatePaymentWithAttempt(makeInput(), deps)

  assert.equal(result.kind, 'eligibility_error')
  if (result.kind !== 'eligibility_error') return
  assert.equal(result.code, 400)
  assert.equal(store._rows().length, 0)
})

test('diagnostic : la connaissance du seul UUID reste acceptée (possession absente)', async () => {
  // CONTRAT ACTUEL, PAS UNE GARANTIE DE SÉCURITÉ — voir rapport P2 : le contrôle
  // de possession (claim code) fera échouer ce test une fois en place.
  const store = createMemoryAttemptStore()
  const { fetchImpl } = mockChapChapFetch()
  const deps = makeDeps({
    attemptStore: store,
    reservationStore: createMemoryReservationStore(),
    fetchImpl,
  })

  const result = await initiatePaymentWithAttempt(makeInput(), deps)

  assert.equal(result.kind, 'ok', 'comportement actuel : initié sans preuve de possession')
})