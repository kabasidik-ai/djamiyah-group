import type { AttemptStatus, AttemptStore, PaymentAttemptRow } from './paymentAttempts.ts'

/**
 * P2 — Traitement IDEMPOTENT et VÉRIFIÉ des événements webhook ChapChap.
 *
 * Ce module est VOLONTAIREMENT DÉCONNECTÉ du webhook de production : il pose
 * la sémantique d'application d'un événement (ordre de statut, rejeu,
 * hors-ordre) ET la vérification croisée des identifiants.
 *
 * Ne JAMAIS affaiblir la vérification HMAC existante : ce module reçoit
 * uniquement des événements DÉJÀ authentifiés par la route.
 *
 * Champs « réellement disponibles » (guide officiel ChapChapPay) :
 *  - statut (success/failed/canceled/expired/error) ;
 *  - operation_id / request_id pour identifier l'opération ;
 *  - metadata, amount, currency, order_id : NON PUBLIÉS comme échoés — la
 *    vérification n'est appliquée que SI le champ est présent (aucune
 *    garantie inventée). Le jour où ChapChap échoie le montant, activer
 *    `REQUIRE_AMOUNT_MATCH`.
 */

/** Ordre de statut côté tentative (paid terminal ; failed/expired terminaux). */
export const ATTEMPT_STATUS_RANK: Record<AttemptStatus, number> = {
  created: 0,
  awaiting_pay: 1,
  failed: 2,
  expired: 2,
  paid: 3,
  // `unknown` : à traiter par réconciliation ; aucun événement ne le surclasse.
  unknown: 0,
}

/**
 * Blocage documenté : ChapChapPay ne publie pas la liste des champs échoés.
 * Tant que le montant/la devise/l'order_id ne sont pas GARANTIS dans le
 * payload, la vérification reste « si fourni » (défaut), jamais refusante en
 * leur absence. Passer à `true` uniquement après confirmation ChapChap.
 */
export const REQUIRE_AMOUNT_MATCH = false
export const REQUIRE_CURRENCY_MATCH = false
export const REQUIRE_ORDER_ID_MATCH = false

/**
 * Statuts webhook documentés par ChapChapPay (guide officiel) :
 * success / failed / canceled / expired / error.
 * `pending`, `refunded` ne sont PAS documentés publiquement : ils sont ignorés
 * (aucune régression possible — voir tests hors-ordre).
 */
export function mapChapChapEventStatus(raw: string | null): AttemptStatus | null {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (['success', 'successful', 'succeeded', 'paid', 'completed'].includes(s)) return 'paid'
  if (['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(s)) return 'failed'
  if (s === 'expired') return 'expired'
  return null
}

export function isChapChapRefundStatus(raw: string | null): boolean {
  if (!raw) return false
  return ['refunded', 'refund', 'reimburse', 'reimbursed'].includes(raw.toLowerCase())
}

export function isAttemptAdvance(current: AttemptStatus, incoming: AttemptStatus): boolean {
  return ATTEMPT_STATUS_RANK[incoming] > ATTEMPT_STATUS_RANK[current]
}

export type AttemptEventInput = {
  reservationId: string
  /** Tentative connue (attempt_id renvoyé par metadata) — sinon réservation. */
  attemptId?: string | null
  /** order_id de l'opération (si échoé par ChapChap) — sinon non vérifié. */
  orderId?: string | null
  /** Montant payé (si échoé par ChapChap) — sinon non vérifié. */
  amount?: number | null
  /** Devise (si échoée par ChapChap) — sinon non vérifiée. */
  currency?: string | null
  incomingStatusRaw: string | null
  providerOperationId?: string | null
  providerRequestId?: string | null
}

export type AttemptEventResult =
  | { outcome: 'updated'; attemptId: string; from: AttemptStatus; to: AttemptStatus }
  | { outcome: 'already_processed'; attemptId: string; current: AttemptStatus }
  | {
      outcome: 'ignored_out_of_order'
      attemptId: string
      current: AttemptStatus
      incoming: AttemptStatus
    }
  | { outcome: 'unknown_status_ignored'; attemptId: string; current: AttemptStatus }
  | { outcome: 'refund_ignored_unverified'; attemptId: string; current: AttemptStatus }
  | { outcome: 'identity_mismatch'; reason: IdentityMismatchReason }
  | {
      outcome: 'manual_reconciliation_required'
      reason: ManualReconciliationReason
      attemptId?: string
    }
  | { outcome: 'not_found' }

export type IdentityMismatchReason =
  | 'reservation'
  | 'attempt'
  | 'order_id'
  | 'amount'
  | 'currency'
  | 'provider_operation_id'
  | 'provider_request_id'

export type ManualReconciliationReason =
  | 'missing_attempt_or_order_reference'
  | 'ambiguous_attempt_reference'
  | 'unverified_provider_identity'

/**
 * Vérifie l'identité de la tentative à partir des seuls champs fournis par le
 * prestataire : `attemptId`, `order_id`, `amount`, `currency` (strict s'ils
 * sont présents ; absents ⇒ non vérifiés — blocage documenté, aucune garantie
 * inventée). `reservationId` est corrélé à l'attempt via `attemptId`.
 */
export function verifyAttemptEventIdentity(
  attempt: PaymentAttemptRow,
  event: AttemptEventInput
): IdentityMismatchReason | null {
  if (event.attemptId && attempt.id !== event.attemptId) {
    return 'attempt'
  }
  if (attempt.reservation_id !== event.reservationId) {
    return 'reservation'
  }
  if (event.orderId && attempt.order_id !== event.orderId) {
    return 'order_id'
  }
  if (event.amount != null && attempt.amount !== event.amount) {
    return 'amount'
  }
  if (event.currency && attempt.currency !== event.currency) {
    return 'currency'
  }
  if (
    event.providerOperationId &&
    attempt.provider_operation_id &&
    attempt.provider_operation_id !== event.providerOperationId
  ) {
    return 'provider_operation_id'
  }
  if (
    event.providerRequestId &&
    attempt.provider_request_id &&
    attempt.provider_request_id !== event.providerRequestId
  ) {
    return 'provider_request_id'
  }
  return null
}

export async function applyAttemptEvent(
  store: AttemptStore,
  event: AttemptEventInput
): Promise<AttemptEventResult> {
  // Remboursement: refusé même sans ciblage fin (réconciliation manuelle).
  if (isChapChapRefundStatus(event.incomingStatusRaw)) {
    return {
      outcome: 'manual_reconciliation_required',
      reason: 'unverified_provider_identity',
    }
  }

  const incoming = mapChapChapEventStatus(event.incomingStatusRaw)
  if (incoming === null) {
    const fallbackAttempt = event.attemptId ? await store.selectById(event.attemptId) : null
    return {
      outcome: 'unknown_status_ignored',
      attemptId: fallbackAttempt?.id ?? event.attemptId ?? '',
      current: fallbackAttempt?.status ?? 'created',
    }
  }

  let attempt: PaymentAttemptRow | null = null
  if (event.attemptId) {
    attempt = await store.selectById(event.attemptId)
    if (!attempt) return { outcome: 'not_found' }
  }

  if (!attempt && event.orderId) {
    attempt = await store.selectByOrderId(event.orderId)
    if (!attempt) return { outcome: 'not_found' }
  }

  if (!attempt) {
    if (incoming === 'paid') {
      return {
        outcome: 'manual_reconciliation_required',
        reason: 'missing_attempt_or_order_reference',
      }
    }
    attempt = await store.selectActive(event.reservationId)
    if (!attempt) {
      attempt = await store.selectLatest(event.reservationId)
    }
  }

  if (!attempt) return { outcome: 'not_found' }

  const mismatch = verifyAttemptEventIdentity(attempt, event)
  if (mismatch) {
    return { outcome: 'identity_mismatch', reason: mismatch }
  }

  const from = attempt.status

  if (incoming === 'paid') {
    const hasProviderIdentity = Boolean(event.providerOperationId || event.providerRequestId)
    const hasBoundProviderIdentity = Boolean(
      attempt.provider_operation_id || attempt.provider_request_id
    )

    if (!hasProviderIdentity || !hasBoundProviderIdentity) {
      return {
        outcome: 'manual_reconciliation_required',
        reason: 'unverified_provider_identity',
        attemptId: attempt.id,
      }
    }

    if (incoming === attempt.status) {
      const repaired = await store.confirmPaid(attempt.id, {
        orderId: event.orderId ?? null,
        providerOperationId: event.providerOperationId ?? null,
        providerRequestId: event.providerRequestId ?? null,
        amount: event.amount ?? null,
        currency: event.currency ?? null,
      })
      if (repaired === 'updated') {
        return { outcome: 'updated', attemptId: attempt.id, from, to: incoming }
      }
      if (repaired === 'already_paid') {
        return { outcome: 'already_processed', attemptId: attempt.id, current: 'paid' }
      }
    }

    if (!isAttemptAdvance(attempt.status, incoming)) {
      return {
        outcome: 'ignored_out_of_order',
        attemptId: attempt.id,
        current: attempt.status,
        incoming,
      }
    }

    const confirmed = await store.confirmPaid(attempt.id, {
      orderId: event.orderId ?? null,
      providerOperationId: event.providerOperationId ?? null,
      providerRequestId: event.providerRequestId ?? null,
      amount: event.amount ?? null,
      currency: event.currency ?? null,
    })

    if (confirmed === 'updated') {
      return { outcome: 'updated', attemptId: attempt.id, from, to: incoming }
    }
    if (confirmed === 'already_paid') {
      return { outcome: 'already_processed', attemptId: attempt.id, current: 'paid' }
    }

    const latestAfterConfirm = await store.selectById(attempt.id)
    if (!latestAfterConfirm) return { outcome: 'not_found' }
    if (latestAfterConfirm.status === incoming) {
      return {
        outcome: 'already_processed',
        attemptId: attempt.id,
        current: latestAfterConfirm.status,
      }
    }
    return {
      outcome: 'ignored_out_of_order',
      attemptId: attempt.id,
      current: latestAfterConfirm.status,
      incoming,
    }
  }

  if (incoming === attempt.status) {
    return { outcome: 'already_processed', attemptId: attempt.id, current: attempt.status }
  }

  if (!isAttemptAdvance(attempt.status, incoming)) {
    return {
      outcome: 'ignored_out_of_order',
      attemptId: attempt.id,
      current: attempt.status,
      incoming,
    }
  }

  const patch: Partial<PaymentAttemptRow> = { status: incoming }
  if (event.providerOperationId) patch.provider_operation_id = event.providerOperationId
  if (event.providerRequestId) patch.provider_request_id = event.providerRequestId

  const allowedFrom: AttemptStatus[] = ['created', 'awaiting_pay', 'unknown']

  const switched = await store.updateStatus(attempt.id, patch, {
    expectedCurrentStatus: allowedFrom,
  })
  if (switched) return { outcome: 'updated', attemptId: attempt.id, from, to: incoming }

  const latest = await store.selectById(attempt.id)
  if (!latest) return { outcome: 'not_found' }
  if (latest.status === incoming) {
    return { outcome: 'already_processed', attemptId: attempt.id, current: latest.status }
  }
  if (!isAttemptAdvance(latest.status, incoming)) {
    return {
      outcome: 'ignored_out_of_order',
      attemptId: attempt.id,
      current: latest.status,
      incoming,
    }
  }

  const switchedAfterReload = await store.updateStatus(attempt.id, patch, {
    expectedCurrentStatus: latest.status,
  })
  if (switchedAfterReload) {
    return { outcome: 'updated', attemptId: attempt.id, from: latest.status, to: incoming }
  }

  const finalState = await store.selectById(attempt.id)
  if (!finalState) return { outcome: 'not_found' }
  if (finalState.status === incoming) {
    return { outcome: 'already_processed', attemptId: attempt.id, current: finalState.status }
  }
  return {
    outcome: 'ignored_out_of_order',
    attemptId: attempt.id,
    current: finalState.status,
    incoming,
  }
}
