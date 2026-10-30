import type { AttemptStatus, AttemptStore, PaymentAttemptRow } from './paymentAttempts.ts'

/**
 * P2 — Traitement IDEMPOTENT des événements webhook ChapChap.
 *
 * Ce module est VOLONTAIREMENT DÉCONNECTÉ du webhook de production : il pose
 * la sémantique d'application d'un événement sur la tentative (ordre de statut,
 * rejeu, hors-ordre). Le câblage dans `/api/payment/webhook` fera l'objet d'une
 * étape séparée, après validation de cette logique.
 *
 * Ne JAMAIS affaiblir la vérification HMAC existante : ce module reçoit
 * uniquement des événements DÉJÀ authentifiés par la route.
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

export function isAttemptAdvance(current: AttemptStatus, incoming: AttemptStatus): boolean {
  return ATTEMPT_STATUS_RANK[incoming] > ATTEMPT_STATUS_RANK[current]
}

export type AttemptEventInput = {
  reservationId: string
  /** Tentative connue (attempt_id renvoyé par metadata) — sinon réservation. */
  attemptId?: string | null
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
  | { outcome: 'not_found' }

export async function applyAttemptEvent(
  store: AttemptStore,
  event: AttemptEventInput
): Promise<AttemptEventResult> {
  let attempt: PaymentAttemptRow | null = null

  if (event.attemptId) {
    attempt = await store.selectById(event.attemptId)
  }
  if (!attempt) {
    attempt = await store.selectActive(event.reservationId)
  }
  if (!attempt) {
    // Tentative terminale (ex. paid) : l'historique reste déduplicable.
    attempt = await store.selectLatest(event.reservationId)
  }
  if (!attempt) return { outcome: 'not_found' }

  const incoming = mapChapChapEventStatus(event.incomingStatusRaw)
  if (incoming === null) {
    return { outcome: 'unknown_status_ignored', attemptId: attempt.id, current: attempt.status }
  }

  if (incoming === attempt.status) {
    // Rejeu strictement identique → déjà traité.
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

  const from = attempt.status
  const patch: Partial<PaymentAttemptRow> = { status: incoming }
  if (event.providerOperationId) patch.provider_operation_id = event.providerOperationId
  if (event.providerRequestId) patch.provider_request_id = event.providerRequestId

  await store.updateStatus(attempt.id, patch)
  return { outcome: 'updated', attemptId: attempt.id, from, to: incoming }
}
