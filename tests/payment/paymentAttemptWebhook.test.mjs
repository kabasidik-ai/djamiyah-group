import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyAttemptEvent,
  mapChapChapEventStatus,
} from '../../src/lib/paymentAttemptWebhook.ts'
import { createMemoryAttemptStore } from './memoryAttemptStore.mjs'

/**
 * Tests P2 — traitement idempotent des événements webhook (module NON branché
 * au webhook réel : la vérification HMAC reste faite par la route existante).
 */

const RESERVATION_ID = 'def67890-1234-4abc-9012-abcdef123456'

async function seedAttempt(store, { status = 'awaiting_pay', paymentUrl = 'https://pay.test/x' } = {}) {
  const inserted = await store.insert({
    reservation_id: RESERVATION_ID,
    reference: 'MB-DEF67890',
    order_id: 'MB-DEF67890-ABCDEF01',
    amount: 1_500_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(inserted.ok, true)
  if (inserted.ok) {
    await store.updateStatus(inserted.row.id, {
      status,
      payment_url: paymentUrl,
      provider_operation_id: 'op-1',
      provider_request_id: 'req-1',
    })
  }
  return inserted.row
}

test('webhook répété (success puis success) → un seul passage à paid', async () => {
  const store = createMemoryAttemptStore()
  const attempt = await seedAttempt(store)

  const first = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'success',
    providerOperationId: 'op-1',
    providerRequestId: 'req-1',
  })
  const second = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'success',
    providerOperationId: 'op-1',
    providerRequestId: 'req-1',
  })

  assert.equal(first.outcome, 'updated')
  if (first.outcome !== 'updated') return
  assert.equal(first.from, 'awaiting_pay')
  assert.equal(first.to, 'paid')
  assert.equal(second.outcome, 'already_processed')
  assert.equal(attempt.id, store._rows()[0].id)
  assert.equal(store._rows()[0].status, 'paid')
})

test('webhook hors ordre (failed APRÈS paid) → ignoré, paid conservé', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  await applyAttemptEvent(store, { reservationId: RESERVATION_ID, incomingStatusRaw: 'success' })
  const lateFailed = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'failed',
  })

  assert.equal(lateFailed.outcome, 'ignored_out_of_order')
  assert.equal(store._rows()[0].status, 'paid')
})

test('failed puis success (retry prévu par la doc) → paid appliqué', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  await applyAttemptEvent(store, { reservationId: RESERVATION_ID, incomingStatusRaw: 'failed' })
  assert.equal(store._rows()[0].status, 'failed')

  const success = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'success',
  })
  assert.equal(success.outcome, 'updated')
  if (success.outcome !== 'updated') return
  assert.equal(success.from, 'failed')
  assert.equal(success.to, 'paid')
})

test('expired → appliqué ; paid après expired → appliqué (rank supérieur)', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const expired = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'expired',
  })
  assert.equal(expired.outcome, 'updated')
  if (expired.outcome !== 'updated') return
  assert.equal(expired.to, 'expired')

  const paid = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'success',
  })
  assert.equal(paid.outcome, 'updated')
  if (paid.outcome !== 'updated') return
  assert.equal(paid.to, 'paid')
})

test('statut webhook non documenté (pending) → ignoré sans régression', async () => {
  const store = createMemoryAttemptStore()
  const attempt = await seedAttempt(store, { status: 'paid' })

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'pending',
  })

  assert.equal(result.outcome, 'unknown_status_ignored')
  assert.equal(store._rows()[0].status, 'paid')
  assert.equal(attempt.id, store._rows()[0].id)
})

test('autre réservation / tentative introuvable → not_found', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: '11111111-2222-4333-8444-555555555555',
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'not_found')
})

test('identifiants prestataire enregistrés lors du passage à paid', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store, { status: 'created' })

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'succeeded',
    providerOperationId: 'op-final',
    providerRequestId: 'req-final',
  })

  assert.equal(result.outcome, 'updated')
  if (result.outcome !== 'updated') return
  const row = store._rows()[0]
  assert.equal(row.status, 'paid')
  assert.equal(row.provider_operation_id, 'op-final')
  assert.equal(row.provider_request_id, 'req-final')
})

test('mapping des statuts documentés ChapChapPay', () => {
  assert.equal(mapChapChapEventStatus('success'), 'paid')
  assert.equal(mapChapChapEventStatus('succeeded'), 'paid')
  assert.equal(mapChapChapEventStatus('failed'), 'failed')
  assert.equal(mapChapChapEventStatus('error'), 'failed')
  assert.equal(mapChapChapEventStatus('canceled'), 'failed')
  assert.equal(mapChapChapEventStatus('expired'), 'expired')
  assert.equal(mapChapChapEventStatus('pending'), null)
  assert.equal(mapChapChapEventStatus(null), null)
})// ══ SÉCURISATION — Vérification d'identité & remboursements ═════════════════════

test('montant reçu DIFFÉRENT de la tentative → identity_mismatch (amount), aucun changement', async () => {
  const store = createMemoryAttemptStore()
  const attempt = await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    amount: 500,
    currency: 'GNF',
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'identity_mismatch')
  if (result.outcome !== 'identity_mismatch') return
  assert.equal(result.reason, 'amount')
  assert.equal(store._rows().find((r) => r.id === attempt.id).status, 'awaiting_pay')
})

test('montant identique reçu → vérifié et appliqué (pas de fausse alerte)', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    amount: 1_500_000,
    currency: 'GNF',
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'updated')
  if (result.outcome !== 'updated') return
  assert.equal(result.to, 'paid')
})

test('devise reçue différente → identity_mismatch (currency)', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    currency: 'EUR',
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'identity_mismatch')
  if (result.outcome !== 'identity_mismatch') return
  assert.equal(result.reason, 'currency')
})

test('order_id reçu différent → identity_mismatch (order_id)', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    orderId: 'MB-AUTRE-RESERVATION-XX',
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'identity_mismatch')
  if (result.outcome !== 'identity_mismatch') return
  assert.equal(result.reason, 'order_id')
})

test('attempt_id falsifié (autre tentative) → identity_mismatch (attempt)', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    attemptId: '99999999-9999-4999-8999-999999999999',
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'identity_mismatch')
  if (result.outcome !== 'identity_mismatch') return
  assert.equal(result.reason, 'attempt')
})

test('attempt_id + reservation_id incohérents → identity_mismatch (reservation)', async () => {
  const store = createMemoryAttemptStore()
  const attempt = await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: '11111111-2222-4333-8444-555555555555',
    attemptId: attempt.id,
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'identity_mismatch')
  if (result.outcome !== 'identity_mismatch') return
  assert.equal(result.reason, 'reservation')
})

test('champs absents (ChapChap ne les échoit pas) → application normale, aucune garantie inventée', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const result = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    incomingStatusRaw: 'success',
  })

  assert.equal(result.outcome, 'updated', 'sans amount/order_id fournis, pas de refus')
})

test('remboursement (statut non documenté) → refund_ignored_unverified, paid jamais régressé', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const paid = await applyAttemptEvent(store, { reservationId: RESERVATION_ID, incomingStatusRaw: 'success' })
  assert.equal(paid.outcome, 'updated')
  if (paid.outcome !== 'updated') return

  const refund = await applyAttemptEvent(store, { reservationId: RESERVATION_ID, incomingStatusRaw: 'refunded' })

  assert.equal(refund.outcome, 'refund_ignored_unverified')
  assert.equal(store._rows()[0].status, 'paid', 'un remboursement non vérifié ne répresse JAMAIS')
})

test('doublons identiques → already_processed (idempotence préservée avec vérification)', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  const first = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    amount: 1_500_000,
    incomingStatusRaw: 'success',
  })
  const second = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    amount: 1_500_000,
    incomingStatusRaw: 'success',
  })

  assert.equal(first.outcome, 'updated')
  assert.equal(second.outcome, 'already_processed')
})

test('hors-ordre APRÈS paid (avec champs cohérents) → ignoré', async () => {
  const store = createMemoryAttemptStore()
  await seedAttempt(store)

  await applyAttemptEvent(store, { reservationId: RESERVATION_ID, incomingStatusRaw: 'success' })
  const late = await applyAttemptEvent(store, {
    reservationId: RESERVATION_ID,
    amount: 1_500_000,
    incomingStatusRaw: 'failed',
  })

  assert.equal(late.outcome, 'ignored_out_of_order')
  assert.equal(store._rows()[0].status, 'paid')
})


test('concurrence réelle: failed et success simultanés (failed puis success) -> paid final', async () => {
  const store = createMemoryAttemptStore()
  const attempt = await seedAttempt(store)

  const [a, b] = await Promise.all([
    applyAttemptEvent(store, {
      reservationId: RESERVATION_ID,
      attemptId: attempt.id,
      incomingStatusRaw: 'failed',
      providerOperationId: 'op-failed',
    }),
    applyAttemptEvent(store, {
      reservationId: RESERVATION_ID,
      attemptId: attempt.id,
      incomingStatusRaw: 'success',
      providerOperationId: 'op-success',
    }),
  ])

  const final = await store.selectById(attempt.id)
  assert.equal(final?.status, 'paid')

  // Selon l'interleaving: failed peut être updated puis success updated,
  // ou failed ignoré directement si success est déjà appliqué.
  const outcomes = new Set([a.outcome, b.outcome])
  assert.ok(
    outcomes.has('updated') || outcomes.has('already_processed') || outcomes.has('ignored_out_of_order')
  )
})

test('concurrence réelle: success et failed simultanés (success puis failed) -> paid final', async () => {
  const store = createMemoryAttemptStore()
  const attempt = await seedAttempt(store)

  const [a, b] = await Promise.all([
    applyAttemptEvent(store, {
      reservationId: RESERVATION_ID,
      attemptId: attempt.id,
      incomingStatusRaw: 'success',
      providerOperationId: 'op-success',
    }),
    applyAttemptEvent(store, {
      reservationId: RESERVATION_ID,
      attemptId: attempt.id,
      incomingStatusRaw: 'failed',
      providerOperationId: 'op-failed',
    }),
  ])

  const final = await store.selectById(attempt.id)
  assert.equal(final?.status, 'paid')

  const outcomes = new Set([a.outcome, b.outcome])
  assert.ok(
    outcomes.has('updated') || outcomes.has('already_processed') || outcomes.has('ignored_out_of_order')
  )
})
