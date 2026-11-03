/**
 * P1 — Cœur pur de décision des webhooks ChapChap + journalisation.
 *
 * Sépare la LOGIQUE (pure, unit-testable) du stockage (route) :
 *  - `verifyPaidConfirmation` : preuve de confirmation « paid » vérifiable.
 *  - `ALLOWED_FROM` : transitions atomiques (Compare-And-Swap SQL).
 *  - entrées de journal `p1_webhook_events` : aucune notification perdue
 *    silencieusement (suivi d'anomalies + reprise manuelle contrôlée).
 *
 * Principe P1 — JAMAIS « paid » sans preuve vérifiable :
 *  - HMAC Ok (vérifié par la route avant ce module),
 *  - cible réservation identifiée,
 *  - transaction_id présent ET unique,
 *  - montant échoé = montant serveur (sinon BLOCAGE),
 *  - devise échoée = GNF (sinon BLOCAGE),
 *  - corrélation order_id/payment_reference cohérente avec l'order persisté
 *    à l'initiation (si les champs sont fournis par le prestataire).
 *
 * Politique livraison ChapChapPay (guide officiel) : HTTP 200 attendu sous 20 s ;
 * les 4xx/5xx ne sont PAS retentés automatiquement. → La route doit toujours
 * répondre 200 APRÈS journalisation durable, et gérer la reprise manuelle via
 * le journal (bouton « Renvoyer le webhook » du tableau de bord côté prestataire
 * OU rejeu administrateur côté serveur).
 */
import { createHash } from 'node:crypto'
import {
  CHAPCHAP_OPERATION_ID_FIELDS,
  CHAPCHAP_ORDER_ID_FIELDS,
  CHAPCHAP_PAYMENT_REFERENCE_FIELDS,
  CHAPCHAP_REQUEST_ID_FIELDS,
  CHAPCHAP_TRANSACTION_ID_FIELDS,
} from './chapchapContract.ts'

export type WebhookJournalStatus =
  | 'received'
  | 'processed'
  | 'anomaly'
  | 'unverifiable'
  | 'rejected'
  | 'replay_requested'

export type WebhookJournalEntry = {
  provider_event_key: string
  provider_operation_id: string | null
  provider_request_id: string | null
  order_id: string | null
  transaction_id: string | null
  reservation_type: 'room' | 'conference' | 'unknown'
  reservation_id: string | null
  raw_status: string | null
  amount: number | null
  currency: string | null
  received_status: WebhookJournalStatus
  outcome: string | null
  note: string | null
  raw_body: unknown
  signature: string | null
}

export type ReservationPaymentStatus = 'pending' | 'failed' | 'paid' | 'refunded'

/**
 * Transitions ATOMIQUES : un webhook ne peut écrire le statut `incoming` que si
 * le statut courant figure dans la liste. `pending` n'est jamais écrit (rang le
 * plus bas, aucune transition n'y descend). `refunded` surclasse `paid`.
 * Utilisée en condition SQL (`.in('payment_status', allowed)`) : deux webhooks
 * simultanés → un seul passe, l'autre reçoit 0 ligne modifiée (retour déjà traité).
 */
export const ALLOWED_FROM: Record<ReservationPaymentStatus, ReservationPaymentStatus[]> = {
  pending: [],
  failed: ['pending'],
  paid: ['pending', 'failed'],
  refunded: ['pending', 'failed', 'paid'],
}

export function allowedCurrentStatuses(
  incoming: ReservationPaymentStatus
): ReservationPaymentStatus[] {
  return ALLOWED_FROM[incoming]
}

// ─── Extraction des identifiants (payload racine OU enveloppe `data`) ──────────

function pickFromPayload(
  payload: Record<string, unknown>,
  candidates: readonly string[]
): string | null {
  for (const key of candidates) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export function pickOperationId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    pickFromPayload(data ?? {}, CHAPCHAP_OPERATION_ID_FIELDS) ??
    pickFromPayload(payload, CHAPCHAP_OPERATION_ID_FIELDS)
  )
}

export function pickRequestId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    pickFromPayload(data ?? {}, CHAPCHAP_REQUEST_ID_FIELDS) ??
    pickFromPayload(payload, CHAPCHAP_REQUEST_ID_FIELDS)
  )
}

/** order_id / payment_reference du webhook — la référence d'ordre envoyée à la création. */
export function pickOrderReference(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    pickFromPayload(data ?? {}, CHAPCHAP_ORDER_ID_FIELDS) ??
    pickFromPayload(data ?? {}, CHAPCHAP_PAYMENT_REFERENCE_FIELDS) ??
    pickFromPayload(payload, CHAPCHAP_ORDER_ID_FIELDS) ??
    pickFromPayload(payload, CHAPCHAP_PAYMENT_REFERENCE_FIELDS)
  )
}

export function pickTransactionId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    pickFromPayload(data ?? {}, CHAPCHAP_TRANSACTION_ID_FIELDS) ??
    pickFromPayload(payload, CHAPCHAP_TRANSACTION_ID_FIELDS) ??
    pickFromPayload(payload, ['id']) ??
    pickFromPayload(data ?? {}, ['id'])
  )
}

/**
 * Clé d'événement pour la déduplication du journal (guide : identifier via
 * `operation_id` OU `request_id`). Repli : hash stable du payload.
 */
export function pickEventKey(payload: Record<string, unknown>): string {
  const operationId = pickOperationId(payload)
  const requestId = pickRequestId(payload)
  const transactionId = pickTransactionId(payload)
  const eventId = typeof payload.event_id === 'string' ? payload.event_id : null
  const key = operationId || requestId || transactionId || eventId
  if (key) return key
  const data = payload.data as Record<string, unknown> | undefined
  const hashInput = JSON.stringify({
    status: payload.status ?? data?.status,
    order: pickOrderReference(payload),
    amount: payload.amount ?? data?.amount,
  })
  return createHash('sha256').update(hashInput).digest('hex').slice(0, 32)
}

// ─── Vérification de la confirmation « paid » ──────────────────────────────────

export type PaidVerificationInput = {
  transactionId: string | null
  /** total_price serveur (source de vérité). */
  expectedAmount: number | null
  /** amount du webhook (null si non échoé). */
  receivedAmount: number | null
  /** currency du webhook (null si non échoée). */
  receivedCurrency: string | null
  /** chapchap_transaction_id déjà mémorisé sur la réservation. */
  existingTransactionId: string | null
  /** Statut de paiement courant de la réservation. */
  currentStatus: ReservationPaymentStatus | null
  /** chapchap_order_id persisté à l'initiation (null si réservation héritée). */
  storedOrderId: string | null
  /** order_id / payment_reference du webhook (null si non échoé). */
  payloadOrderReference: string | null
}

export type CorrelationKind = 'matched' | 'extrinsic' | 'legacy_unverified'

export type PaidVerificationDecision =
  | { decision: 'confirm'; correlation: CorrelationKind }
  | {
      decision: 'reject'
      reason:
        | 'missing_transaction_id'
        | 'invalid_expected_amount'
        | 'amount_mismatch'
        | 'currency_mismatch'
        | 'correlation_mismatch'
        | 'conflicting_transaction'
    }
  | { decision: 'unverifiable'; reason: 'missing_amount' | 'missing_currency' }
  | { decision: 'already_processed'; reason: 'replay_transaction' }

export function verifyPaidConfirmation(input: PaidVerificationInput): PaidVerificationDecision {
  if (!input.transactionId) {
    return { decision: 'reject', reason: 'missing_transaction_id' }
  }

  const expectedAmount = Number(input.expectedAmount)
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return { decision: 'reject', reason: 'invalid_expected_amount' }
  }

  // Corrélation avec l'order persisté à l'initiation (si les champs sont fournis).
  let correlation: CorrelationKind = 'extrinsic'
  if (input.payloadOrderReference && input.storedOrderId) {
    if (input.payloadOrderReference !== input.storedOrderId) {
      return { decision: 'reject', reason: 'correlation_mismatch' }
    }
    correlation = 'matched'
  } else if (input.payloadOrderReference) {
    // Webhook porte une référence mais AUCUN order persisté (réservation héritée
    // antérieure à la colonne chapchap_order_id) : rien à comparer.
    correlation = 'legacy_unverified'
  } else if (input.storedOrderId) {
    // Prestataire n'échoit pas order_id : corrélation extrinseque (metadata+montant).
    correlation = 'extrinsic'
  } else {
    correlation = 'legacy_unverified'
  }

  // Unicité de la transaction : seuls les statuts TERMINAUX (paid / refunded)
  // verrouillent la réservation sur une transaction donnée. Depuis pending ou
  // failed, un nouveau `paid` du même operation_id est légitime (guide : une
  // opération peut émettre « failed puis success ») — son nouveau
  // transaction_id remplace l'ancienne trace.
  if (
    input.existingTransactionId &&
    input.existingTransactionId !== input.transactionId &&
    (input.currentStatus === 'paid' || input.currentStatus === 'refunded')
  ) {
    return { decision: 'already_processed', reason: 'replay_transaction' }
  }

  // Montant : strict s'il est présent ; BLOQUE s'il est absent (preuve insuffisante).
  if (input.receivedAmount == null) {
    return { decision: 'unverifiable', reason: 'missing_amount' }
  }
  if (input.receivedAmount !== expectedAmount) {
    return { decision: 'reject', reason: 'amount_mismatch' }
  }

  // Devise : strict si présente ; BLOQUE si absente.
  if (!input.receivedCurrency) {
    return { decision: 'unverifiable', reason: 'missing_currency' }
  }
  if (input.receivedCurrency.toUpperCase() !== 'GNF') {
    return { decision: 'reject', reason: 'currency_mismatch' }
  }

  return { decision: 'confirm', correlation }
}

/**
 * Construit l'entrée de journal à partir d'un payload reçu.
 * Appelé APRÈS vérification HMAC, AVANT traitement (journal-first).
 */
export function buildJournalEntry(input: {
  payload: Record<string, unknown>
  signature: string | null
  rawBody: string
}): WebhookJournalEntry {
  const data = (input.payload.data ?? {}) as Record<string, unknown>
  const metadata = {
    ...(((data.metadata ?? {}) as Record<string, unknown>) ?? {}),
    ...(((input.payload.metadata ?? {}) as Record<string, unknown>) ?? {}),
  }
  const reservationType =
    metadata.reservation_type === 'conference'
      ? ('conference' as const)
      : metadata.reservation_type === 'room'
        ? ('room' as const)
        : ('unknown' as const)

  // La colonne `reservation_id` du journal est de type uuid : une valeur non
  // UUID ferait échouer l'INSERT (et un 500, impossible à rejouer). On n'y
  // mémorise qu'un UUID valide ; sinon null (l'événement reste tracé).
  const rawReservationId =
    typeof metadata.reservation_id === 'string'
      ? metadata.reservation_id
      : typeof metadata.conference_reservation_id === 'string'
        ? metadata.conference_reservation_id
        : null
  const reservationId = isUuid(rawReservationId) ? rawReservationId : null

  let amount: number | null = null
  const rawAmount = input.payload.amount ?? data.amount
  if (typeof rawAmount === 'number' && Number.isFinite(rawAmount)) amount = rawAmount
  const currency =
    typeof input.payload.currency === 'string'
      ? input.payload.currency
      : typeof data.currency === 'string'
        ? data.currency
        : null

  return {
    provider_event_key: pickEventKey(input.payload),
    provider_operation_id: pickOperationId(input.payload),
    provider_request_id: pickRequestId(input.payload),
    order_id: pickOrderReference(input.payload),
    transaction_id: pickTransactionId(input.payload),
    reservation_type: reservationType,
    reservation_id: reservationId,
    raw_status:
      pickFromPayload(input.payload, ['status']) ??
      (typeof data.status === 'string' ? data.status : null),
    amount,
    currency,
    received_status: 'received',
    outcome: null,
    note: null,
    raw_body: JSON.parse(input.rawBody),
    signature: input.signature,
  }
}

export function isDocumentedStatus(raw: string | null): boolean {
  if (!raw) return false
  return ['success', 'failed', 'canceled', 'expired', 'error'].includes(raw.toLowerCase())
}

/** Champs d'identité « uuid » exploités par le journal (colonne typée uuid). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value)
}
