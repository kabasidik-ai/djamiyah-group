import { randomUUID } from 'node:crypto'
import { buildBookingReference, evaluateReservationPayment } from './roomPayment.ts'

/**
 * P2 — Anti double-paiement : tentatives de paiement.
 *
 * Un seul appel ChapChap par tentative, une seule tentative active par
 * réservation, aucune transaction SQL ouverte pendant l'appel HTTP externe.
 *
 * Atomicité (cf. migration 20261030_payment_attempts.sql) :
 *  - index partiel UNIQUE `uq_payment_attempts_single_active` : au plus une
 *    tentative `created / awaiting_pay / unknown` par réservation — une
 *    insertion concurrente échoue (23505), c'est la barrière atomique ;
 *  - `order_id` UNIQUE global (par tentative).
 *
 * Le client SQL n'ouvre jamais de transaction : chaque INSERT/UPDATE autonome
 * est atomique (autocommit) et l'appel HTTP ChapChap s'exécute entre deux
 * écritures.
 *
 * Sûreté : toute issue incertaine (timeout, 5xx, 2xx sans URL, lien périmé)
 * place la tentative en `unknown` et BLOQUE toute nouvelle tentative tant
 * qu'une réconciliation n'a pas requalifié l'état. Aucun lancement automatique
 * d'une nouvelle opération après un résultat incertain.
 */

export type AttemptStatus = 'created' | 'awaiting_pay' | 'paid' | 'failed' | 'expired' | 'unknown'

export type PaymentAttemptRow = {
  id: string
  reservation_id: string
  reference: string
  order_id: string
  amount: number
  currency: string
  status: AttemptStatus
  payment_url: string | null
  provider_operation_id: string | null
  provider_request_id: string | null
  claim_token: string | null
  claimed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type AttemptInsert = {
  reservation_id: string
  reference: string
  order_id: string
  amount: number
  currency: string
  claim_token: string
}

export type AttemptInsertResult =
  | { ok: true; row: PaymentAttemptRow }
  | { ok: false; conflict: 'active_attempt' | 'order_id' }

/**
 * Contrat minimal du stockage. Deux implémentations :
 *  - `supabaseAttemptStore` (production, single-statements supabase-js) ;
 *  - store mémoire dans les tests qui MIRORE les contraintes SQL.
 */
export type DispatchBeginOutcome =
  | 'authorized'
  | 'already_consumed'
  | 'not_dispatchable'
  | 'not_claim_owner'
  | 'reservation_paid'
  | 'reservation_missing'
  | 'not_found'

export type SettleOutcome = 'updated' | 'terminal_blocked' | 'not_found' | 'invalid_decision'

export type AttemptStore = {
  insert(attempt: AttemptInsert): Promise<AttemptInsertResult>
  selectActive(reservationId: string): Promise<PaymentAttemptRow | null>
  /** Dernière tentative (historique terminal inclus) pour déduplication webhook. */
  selectLatest(reservationId: string): Promise<PaymentAttemptRow | null>
  selectById(id: string): Promise<PaymentAttemptRow | null>
  /**
   * Réclamation conditionnelle (status 'created') : réussit si le jeton est
   * celui du propriétaire de la ligne OU si la réclamation a expiré.
   */
  claim(id: string, claimToken: string, claimedBeforeIso: string): Promise<boolean>
  beginProviderDispatch(
    id: string,
    claimToken: string,
    claimedBeforeIso: string
  ): Promise<DispatchBeginOutcome>
  settle(id: string, settlement: ProviderSettlement): Promise<SettleOutcome>
  /**
   * Mutation conditionnelle atomique (single UPDATE) ; false si transition bloquée.
   * Empêche notamment les régressions terminales en course concurrente.
   */
  updateStatus(
    id: string,
    patch: Partial<PaymentAttemptRow>,
    guard?: { expectedCurrentStatus?: AttemptStatus | AttemptStatus[] }
  ): Promise<boolean>
}

/** Expiration du droit de piloter l'appel prestataire après crash applicatif. */
export const CLAIM_EXPIRY_DELAY_MS = 3 * 60 * 1000

/** Fenêtre de validité « démontrée » d'un lien de caisse mémorisé. */
export const PAYMENT_LINK_VALID_WINDOW_MS = 30 * 60 * 1000

// ── Résultats ──────────────────────────────────────────────────────────────────

export type AcquireAttemptResult =
  | { kind: 'created'; attempt: PaymentAttemptRow; claimToken: string }
  | { kind: 'reused'; attempt: PaymentAttemptRow }
  | { kind: 'busy'; attempt: PaymentAttemptRow }
  | { kind: 'blocked_unknown'; attempt: PaymentAttemptRow }
  | { kind: 'reservation_paid'; attempt: PaymentAttemptRow }
  | { kind: 'order_conflict' }
  | { kind: 'retry' }

export type InitiateResult =
  | { kind: 'ok'; orderId: string; paymentUrl: string; attemptId: string }
  | { kind: 'reservation_not_found' }
  | { kind: 'eligibility_error'; message: string; code: number }
  | { kind: 'provider_error'; status: number; orderId: string; attemptId: string }
  | { kind: 'missing_checkout_url'; orderId: string; attemptId: string }
  | { kind: 'provider_timeout'; attemptId: string }
  | { kind: 'internal_error' }
  | { kind: 'busy'; attemptId: string }
  | { kind: 'blocked_unknown'; attemptId: string }

export type ReservationForPayment = {
  id: string
  hotel_name?: string | null
  total_price?: number | null
  payment_status?: string | null
  status?: string | null
  currency?: string | null
}

export type ReservationStore = {
  fetchReservation(id: string): Promise<{ data: ReservationForPayment | null; error: unknown }>
}

export type InitiateDeps = {
  reservationStore: ReservationStore
  attemptStore: AttemptStore
  apiKey: string
  baseUrl: string
  notifyUrl: string
  returnUrl: string
  cancelUrl: string
  fetchImpl: (input: string, init?: RequestInit) => Promise<Response>
}

export type InitiateInput = {
  reservationId: string
  customerName: string
  customerEmail: string
  roomName?: string | null
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function claimedBeforeNowIso(): string {
  return new Date(Date.now() - CLAIM_EXPIRY_DELAY_MS).toISOString()
}

function isLinkFresh(createdAtIso: string | null): boolean {
  if (!createdAtIso) return false
  const created = Date.parse(createdAtIso)
  if (Number.isNaN(created)) return false
  return Date.now() - created <= PAYMENT_LINK_VALID_WINDOW_MS
}

// ── Acquisition atomique ─────────────────────────────────────────────────────────

async function routeActiveAttempt(
  store: AttemptStore,
  active: PaymentAttemptRow
): Promise<AcquireAttemptResult> {
  switch (active.status) {
    case 'unknown':
      // Résultat incertain → réconciliation obligatoire, aucune nouvelle opération.
      return { kind: 'blocked_unknown', attempt: active }

    case 'awaiting_pay':
      if (active.payment_url) {
        if (isLinkFresh(active.created_at)) {
          // Lien réutilisé UNIQUEMENT si sa fenêtre de validité est démontrée.
          return { kind: 'reused', attempt: active }
        }
        // Lien périmé : validité non démontrée → réconciliation requise.
        const switched = await store.updateStatus(
          active.id,
          { status: 'unknown' },
          { expectedCurrentStatus: 'awaiting_pay' }
        )
        if (switched) return { kind: 'blocked_unknown', attempt: { ...active, status: 'unknown' } }

        // Une course a eu lieu (webhook paid/failed/expired/unknown) : on relit.
        const latest = await store.selectById(active.id)
        if (!latest) return { kind: 'retry' }
        if (latest.status === 'paid') return { kind: 'reservation_paid', attempt: latest }
        if (latest.status === 'unknown') return { kind: 'blocked_unknown', attempt: latest }
        return { kind: 'busy', attempt: latest }
      }
      return { kind: 'busy', attempt: active }

    case 'created': {
      // Orpheline (jamais réclamée) ou pilote perdu (réclamation expirée) :
      // sans moyen de prouver qu'AUCUN appel prestataire n'a eu lieu pour cet
      // order_id, on interdit tout appel automatique et on exige la
      // réconciliation (status → unknown, index partiel maintenu).
      const reclaimed = await store.claim(active.id, randomUUID(), claimedBeforeNowIso())
      if (reclaimed) {
        const switched = await store.updateStatus(
          active.id,
          { status: 'unknown' },
          { expectedCurrentStatus: 'created' }
        )
        if (switched) return { kind: 'blocked_unknown', attempt: { ...active, status: 'unknown' } }

        const latest = await store.selectById(active.id)
        if (!latest) return { kind: 'retry' }
        if (latest.status === 'paid') return { kind: 'reservation_paid', attempt: latest }
        if (latest.status === 'unknown') return { kind: 'blocked_unknown', attempt: latest }
        return { kind: 'busy', attempt: latest }
      }
      // Réclamation vivante : un autre pilote est en cours.
      return { kind: 'busy', attempt: active }
    }

    default:
      // paid / failed / expired ne sont jamais dans l'index des actives.
      return { kind: 'busy', attempt: active }
  }
}

/**
 * Réserve une tentative active pour une réservation, atomiquement :
 *  1. INSERT — la barrière = index partiel unique — puis réclamation immédiate
 *     de sa propre ligne (un seul pilote possible) ;
 *  2. tentative active existante → réutilisation (lien valide) ou blocage
 *     (unknown / busy / lien périmé).
 * `order_conflict` → l'appelant régénère l'order_id.
 * `retry` → course perdue et tentative disparue : recommencer (borne appelant).
 */
export async function acquireAttempt(
  store: AttemptStore,
  attempt: AttemptInsert
): Promise<AcquireAttemptResult> {
  const insertResult = await store.insert(attempt)

  if (insertResult.ok) {
    const claimed = await store.claim(
      insertResult.row.id,
      attempt.claim_token,
      claimedBeforeNowIso()
    )
    if (!claimed) return { kind: 'busy', attempt: insertResult.row }
    return { kind: 'created', attempt: insertResult.row, claimToken: attempt.claim_token }
  }

  if (insertResult.conflict === 'order_id') {
    return { kind: 'order_conflict' }
  }

  const active = await store.selectActive(attempt.reservation_id)
  if (!active) {
    return { kind: 'retry' }
  }
  return routeActiveAttempt(store, active)
}

// ── Règlement de la tentative selon l'issue prestataire ─────────────────────────

export type ProviderSettlement =
  | {
      decision: 'ok'
      paymentUrl: string
      providerOperationId?: string | null
      providerRequestId?: string | null
    }
  | { decision: 'failed'; httpStatus: number }
  | { decision: 'unknown' }

export async function settleAttempt(
  store: AttemptStore,
  attemptId: string,
  settlement: ProviderSettlement
): Promise<SettleOutcome> {
  return store.settle(attemptId, settlement)
}

function snapProviderResult(result: Record<string, unknown>) {
  const fetchUrl = (keys: string[]) => {
    for (const key of keys) {
      if (typeof result[key] === 'string') return result[key]
    }
    return null
  }
  return {
    paymentUrl: fetchUrl(['payment_url', 'paymentUrl', 'checkout_url', 'checkoutUrl']),
    operationId: fetchUrl(['operation_id', 'id']),
    requestId: fetchUrl(['request_id']),
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function sanitizeDescription(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 120)
}

/**
 * Orchestration complète d'une tentative (sans toucher à reservations) :
 * éligibilité → acquisition atomique → appel ChapChap (hors transaction) →
 * règlement.
 *
 * Garanties :
 *  - au plus UNE tentative active par réservation (index partiel) ;
 *  - au plus UN pilote par tentative (claim) ;
 *  - aucune transaction SQL ouverte pendant l'HTTP ;
 *  - issue incertaine → `unknown`, aucune nouvelle opération automatique.
 */
export async function initiatePaymentWithAttempt(
  input: InitiateInput,
  deps: InitiateDeps
): Promise<InitiateResult> {
  const reservationFetch = await deps.reservationStore.fetchReservation(input.reservationId)
  if (reservationFetch.error || !reservationFetch.data) {
    return { kind: 'reservation_not_found' }
  }
  const reservation = reservationFetch.data

  const eligibility = evaluateReservationPayment(reservation)
  if (!eligibility.ok) {
    return { kind: 'eligibility_error', message: eligibility.message, code: eligibility.code }
  }
  const amount = eligibility.amount

  // Référence commerciale canonique (P1) : serveur uniquement.
  const reference = buildBookingReference(reservation.hotel_name ?? '', reservation.id)

  // ── Acquisition atomique (réessaie borné sur order_conflict / retry) ──
  let acquired: AcquireAttemptResult | null = null
  for (let i = 0; i < 3; i++) {
    const orderId = `${reference}-${randomUUID().slice(0, 8).toUpperCase()}`
    const res = await acquireAttempt(deps.attemptStore, {
      reservation_id: reservation.id,
      reference,
      order_id: orderId,
      amount,
      currency: reservation.currency ?? 'GNF',
      claim_token: randomUUID(),
    })
    if (res.kind !== 'order_conflict' && res.kind !== 'retry') {
      acquired = res
      break
    }
  }
  if (!acquired) return { kind: 'internal_error' }

  switch (acquired.kind) {
    case 'reused':
      return {
        kind: 'ok',
        orderId: acquired.attempt.order_id,
        paymentUrl: acquired.attempt.payment_url ?? '',
        attemptId: acquired.attempt.id,
      }
    case 'busy':
      return { kind: 'busy', attemptId: acquired.attempt.id }
    case 'blocked_unknown':
      return { kind: 'blocked_unknown', attemptId: acquired.attempt.id }
    case 'created':
      break
    case 'reservation_paid':
      return {
        kind: 'eligibility_error',
        code: 409,
        message: 'Cette réservation est déjà payée.',
      }
    default:
      return { kind: 'internal_error' }
  }

  const attempt = acquired.attempt
  const dispatchClaimToken = acquired.claimToken

  const dispatch = await deps.attemptStore.beginProviderDispatch(
    attempt.id,
    dispatchClaimToken,
    claimedBeforeNowIso()
  )
  if (dispatch !== 'authorized') {
    if (dispatch === 'reservation_paid') {
      return {
        kind: 'eligibility_error',
        code: 409,
        message: 'Cette réservation est déjà payée.',
      }
    }
    if (dispatch === 'already_consumed' || dispatch === 'not_dispatchable') {
      return { kind: 'blocked_unknown', attemptId: attempt.id }
    }
    return { kind: 'busy', attemptId: attempt.id }
  }

  // ── Appel prestataire (HORS transaction SQL) ─────────────────────────────────
  const chapChapPayload = {
    amount,
    description: sanitizeDescription(
      `Reservation ${input.roomName || attempt.reference} - ${input.customerName}`
    ),
    order_id: attempt.order_id,
    notify_url: deps.notifyUrl,
    return_url: deps.returnUrl,
    cancel_url: deps.cancelUrl,
    metadata: {
      reservation_id: input.reservationId,
      reservation_type: 'room',
      attempt_id: attempt.id,
      reference: attempt.reference,
    },
  }

  let response: Response
  try {
    response = await deps.fetchImpl(`${deps.baseUrl}/ecommerce/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CCP-Api-Key': deps.apiKey,
      },
      body: JSON.stringify(chapChapPayload),
    })
  } catch (error) {
    // Timeout ou erreur réseau : PATRON INCONNU → unknown, pas de nouvelle opération.
    await settleAttempt(deps.attemptStore, attempt.id, { decision: 'unknown' })
    if (isAbortError(error)) return { kind: 'provider_timeout', attemptId: attempt.id }
    return { kind: 'internal_error' }
  }

  const responseText = await response.text().catch(() => '{}')
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(responseText) as Record<string, unknown>
  } catch {
    parsed = {}
  }

  if (!response.ok) {
    // 4xx = refus net (failed) ; ≥500 = incertain (unknown) → jamais de retry auto.
    const decision: ProviderSettlement =
      response.status < 500
        ? { decision: 'failed', httpStatus: response.status }
        : { decision: 'unknown' }
    await settleAttempt(deps.attemptStore, attempt.id, decision)
    return {
      kind: 'provider_error',
      status: response.status,
      orderId: attempt.order_id,
      attemptId: attempt.id,
    }
  }

  const snapped = snapProviderResult(parsed)
  if (!snapped.paymentUrl) {
    // Réponse 2xx sans URL de caisse : résultat ambigu → unknown.
    await settleAttempt(deps.attemptStore, attempt.id, { decision: 'unknown' })
    return {
      kind: 'missing_checkout_url',
      orderId: attempt.order_id,
      attemptId: attempt.id,
    }
  }

  await settleAttempt(deps.attemptStore, attempt.id, {
    decision: 'ok',
    paymentUrl: snapped.paymentUrl,
    providerOperationId: snapped.operationId,
    providerRequestId: snapped.requestId,
  })

  return {
    kind: 'ok',
    orderId: attempt.order_id,
    paymentUrl: snapped.paymentUrl,
    attemptId: attempt.id,
  }
}
