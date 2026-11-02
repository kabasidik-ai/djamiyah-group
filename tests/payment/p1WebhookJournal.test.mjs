import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOWED_FROM,
  allowedCurrentStatuses,
  verifyPaidConfirmation,
  pickEventKey,
  pickOperationId,
  pickRequestId,
  pickOrderReference,
  pickTransactionId,
  buildJournalEntry,
  isDocumentedStatus,
} from '../../src/lib/webhookJournal.ts'

// ── Transitions atomiques (CAS) ────────────────────────────────────────────────
test('CAS : listes de statuts courants autorisés par statut entrant', () => {
  assert.deepEqual(allowedCurrentStatuses('pending'), [])
  assert.deepEqual(allowedCurrentStatuses('failed'), ['pending'])
  assert.deepEqual(allowedCurrentStatuses('paid'), ['pending', 'failed'])
  assert.deepEqual(allowedCurrentStatuses('refunded'), ['pending', 'failed', 'paid'])
})

test('CAS : la clé mapping est complète (aucune transition inattendue)', () => {
  for (const status of ['pending', 'failed', 'paid', 'refunded']) {
    assert.ok(Array.isArray(ALLOWED_FROM[status]), `ALLOWED_FROM[${status}] manquant`)
  }
})

// ── Extraction d’identifiants ──────────────────────────────────────────────────
test('extraction : operation_id / request_id / order_id / transaction_id (racine et data)', () => {
  const root = {
    operation_id: 'OP-1',
    request_id: 'REQ-1',
    order_id: 'MB-ABC',
    transaction_id: 'TX-1',
  }
  const envelope = { data: { operationId: 'OP-2', requestId: 'REQ-2', payment_reference: 'RA-XYZ', id: 'TX-2' } }

  assert.equal(pickOperationId(root), 'OP-1')
  assert.equal(pickRequestId(root), 'REQ-1')
  assert.equal(pickOrderReference(root), 'MB-ABC')
  assert.equal(pickTransactionId(root), 'TX-1')

  assert.equal(pickOperationId(envelope), 'OP-2')
  assert.equal(pickRequestId(envelope), 'REQ-2')
  assert.equal(pickOrderReference(envelope), 'RA-XYZ')
  assert.equal(pickTransactionId(envelope), 'TX-2')
})

test('clé d’événement : operation_id prioritaire, repli hash stable sinon', () => {
  assert.equal(pickEventKey({ operation_id: 'OP-1' }), 'OP-1')
  assert.equal(pickEventKey({ request_id: 'REQ-1' }), 'REQ-1')
  assert.equal(pickEventKey({ transaction_id: 'TX-1' }), 'TX-1')
  const a = pickEventKey({ status: 'success', amount: 1000 })
  const b = pickEventKey({ status: 'success', amount: 1000 })
  assert.equal(a, b)
  assert.equal(a.length, 32)
})

// ── Décision de confirmation « paid » ──────────────────────────────────────────
const base = {
  expectedAmount: 1_500_000,
  currentStatus: 'pending',
  storedOrderId: null,
  payloadOrderReference: null,
}

test('paid vérifiable : transaction + montant + devise + pas de conflit → confirm', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: 1_500_000,
    receivedCurrency: 'GNF',
    existingTransactionId: null,
  })
  assert.equal(d.decision, 'confirm')
  if (d.decision === 'confirm') assert.equal(d.correlation, 'legacy_unverified')
})

test('paid : montant absent → non vérifiable (bloque la confirmation)', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: null,
    receivedCurrency: 'GNF',
    existingTransactionId: null,
  })
  assert.deepEqual(d, { decision: 'unverifiable', reason: 'missing_amount' })
})

test('paid : devise absente → non vérifiable', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: 1_500_000,
    receivedCurrency: null,
    existingTransactionId: null,
  })
  assert.deepEqual(d, { decision: 'unverifiable', reason: 'missing_currency' })
})


test('paid : montant différent → rejet (aucune confirmation injustifiée)', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: 42,
    receivedCurrency: 'GNF',
    existingTransactionId: null,
  })
  assert.deepEqual(d, { decision: 'reject', reason: 'amount_mismatch' })
})

test('paid : devise non GNF → rejet', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: 1_500_000,
    receivedCurrency: 'USD',
    existingTransactionId: null,
  })
  assert.deepEqual(d, { decision: 'reject', reason: 'currency_mismatch' })
})

test('paid : sans transaction_id → rejet', () => {
  const d = verifyPaidConfirmation({ ...base, transactionId: null })
  assert.deepEqual(d, { decision: 'reject', reason: 'missing_transaction_id' })
})

test('paid : order_id contradictoire avec l’order persisté → rejet corrélation', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: 1_500_000,
    receivedCurrency: 'GNF',
    existingTransactionId: null,
    storedOrderId: 'MB-ABC',
    payloadOrderReference: 'MB-OTHER',
  })
  assert.deepEqual(d, { decision: 'reject', reason: 'correlation_mismatch' })
})

test('paid : order_id cohérent avec l’order persisté → confirm (matched)', () => {
  const d = verifyPaidConfirmation({
    ...base,
    transactionId: 'TX-1',
    receivedAmount: 1_500_000,
    receivedCurrency: 'GNF',
    existingTransactionId: null,
    storedOrderId: 'MB-ABC',
    payloadOrderReference: 'MB-ABC',
  })
  assert.equal(d.decision, 'confirm')
  if (d.decision === 'confirm') assert.equal(d.correlation, 'matched')
})

test('paid : statut terminal verrouillé sur une transaction différente → already_processed', () => {
  const d = verifyPaidConfirmation({
    ...base,
    currentStatus: 'paid',
    transactionId: 'TX-OTHER',
    receivedAmount: 1_500_000,
    receivedCurrency: 'GNF',
    existingTransactionId: 'TX-LOCKED',
  })
  assert.deepEqual(d, { decision: 'already_processed', reason: 'replay_transaction' })
})

test('paid depuis failed : nouvelle transaction du même opération acceptée (guide)', () => {
  const d = verifyPaidConfirmation({
    ...base,
    currentStatus: 'failed',
    transactionId: 'TX-SUCCESS',
    receivedAmount: 1_500_000,
    receivedCurrency: 'GNF',
    existingTransactionId: 'TX-FAILED',
  })
  assert.equal(d.decision, 'confirm')
})

test('buildJournalEntry : indexe operation_id, statut brut et montant', () => {
  const entry = buildJournalEntry({
    payload: {
      operation_id: 'OP-9',
      status: 'success',
      amount: 1_500_000,
      currency: 'GNF',
      metadata: {
        reservation_type: 'room',
        reservation_id: '11111111-1111-4111-8111-111111111111',
      },
    },
    signature: 'deadbeef',
    rawBody: '{"operation_id":"OP-9"}',
  })
  assert.equal(entry.provider_event_key, 'OP-9')
  assert.equal(entry.provider_operation_id, 'OP-9')
  assert.equal(entry.raw_status, 'success')
  assert.equal(entry.amount, 1_500_000)
  assert.equal(entry.currency, 'GNF')
  assert.equal(entry.reservation_type, 'room')
  assert.equal(entry.received_status, 'received')
})

test('statuts documentés par le guide : success/failed/canceled/expired/error', () => {
  assert.ok(isDocumentedStatus('success'))
  assert.ok(isDocumentedStatus('failed'))
  assert.ok(isDocumentedStatus('canceled'))
  assert.ok(isDocumentedStatus('expired'))
  assert.ok(isDocumentedStatus('error'))
  assert.equal(isDocumentedStatus('pending'), false)
  assert.equal(isDocumentedStatus('refunded'), false)
  assert.equal(isDocumentedStatus(null), false)
})

