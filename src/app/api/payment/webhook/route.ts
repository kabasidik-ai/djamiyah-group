import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase'
import { secureJson, verifyChapchapHmac } from '@/lib/chapchap'
import {
  buildJournalEntry,
  pickOrderReference,
  pickTransactionId,
  verifyPaidConfirmation,
  type ReservationPaymentStatus,
  type WebhookJournalEntry,
  type WebhookJournalStatus,
  allowedCurrentStatuses,
} from '@/lib/webhookJournal'

export const runtime = 'nodejs'

/**
 * P1 — Webhook de confirmation ChapChapPay.
 *
 * Politique livraison prestataire (guide officiel) :
 *  - HTTP 200 attendu sous 20 s ; les réponses 4xx/5xx NE sont PAS retentées.
 *  - Retry automatique uniquement sur erreurs réseau/timeouts (E-Commerce) ;
 *    bouton manuel « Renvoyer le webhook » dans le tableau de bord.
 *
 * Conséquences :
 *  1. JOURNAL-FIRST : chaque webhook HMAC-valide est persisté dans
 *     `p1_webhook_events` AVANT tout traitement → aucune notification perdue
 *     silencieusement. Si la journalisation échoue, on ne peut PAS garantir la
 *     reprise → 500 (limite documentée, pas de meilleure option).
 *  2. Après journalisation, la route répond 200 quoi qu'il arrive (confirmation
 *     valide, refus justifié, preuve insuffisante, erreur interne). Les cas non
 *     confirmés sont marqués `anomaly`/`unverifiable` dans le journal : ils sont
 *     consultables et rejouables (reprise manuelle contrôlée).
 *  3. JAMAIS de statut `paid` sans preuve vérifiable :
 *     HMAC + cible + transaction_id + montant serveur + devise GNF
 *     + corrélation de l'order (si fourni).
 *  4. PAS de rate-limit sur ce endpoint : la clé HMAC est le garde-fou ; un 429
 *     ferait perdre une notification (prestataire sans retry sur 4xx/5xx).
 */

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  return null
}

function mapWebhookStatus(statusRaw: string | null): ReservationPaymentStatus | null {
  if (!statusRaw) return null
  const status = statusRaw.toLowerCase()

  if (['paid', 'success', 'successful', 'completed', 'succeeded'].includes(status)) return 'paid'
  if (['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(status)) return 'failed'
  if (['refunded', 'refund'].includes(status)) return 'refunded'
  if (['pending', 'processing', 'initiated'].includes(status)) return 'pending'
  return null
}

type ReservationType = 'room' | 'conference' | null

type ReservationTarget = {
  type: ReservationType
  id: string
}

/** Identifiants financiers extraits du payload (aussi dans l'enveloppe `data`). */
type WebhookIds = {
  transactionId: string | null
  amount: number | null
  currency: string | null
  payloadOrderReference: string | null
  operationId: string | null
  requestId: string | null
  /** Statut brut journalisé (pour la déduplication après re-traitement). */
  rawStatus: string | null
}

/**
 * Extraire le type et l'ID de réservation depuis le payload webhook.
 * Stratégie :
 * 1. Chercher reservation_type dans metadata → route explicitement
 * 2. Si conference_reservation_id présent → conférence
 * 3. Si reservation_id présent → chambre (backward compatible)
 * 4. Sinon → null (on ne devine pas)
 */
function pickReservationTarget(payload: Record<string, unknown>): ReservationTarget | null {
  const metadata = (payload.metadata ?? {}) as Record<string, unknown>
  const data = (payload.data ?? {}) as Record<string, unknown>
  const dataMetadata = (data.metadata ?? {}) as Record<string, unknown>

  // Fusionner les sources possibles de metadata
  const allMeta = { ...dataMetadata, ...metadata }

  const reservationType = toStringOrNull(allMeta.reservation_type)

  // Cas explicite : reservation_type = "conference"
  if (reservationType === 'conference') {
    const confId =
      toStringOrNull(allMeta.conference_reservation_id) ||
      toStringOrNull(payload.conference_reservation_id) ||
      toStringOrNull(data.conference_reservation_id)
    if (confId) return { type: 'conference', id: confId }
    // Type dit conference mais pas d'ID → log et refuse
    return null
  }

  // Cas explicite : reservation_type = "room"
  if (reservationType === 'room') {
    const roomId =
      toStringOrNull(allMeta.reservation_id) ||
      toStringOrNull(payload.reservation_id) ||
      toStringOrNull(data.reservation_id)
    if (roomId) return { type: 'room', id: roomId }
    return null
  }

  // Backward compatible : pas de reservation_type
  // Chercher conference_reservation_id d'abord (plus spécifique)
  const confId =
    toStringOrNull(allMeta.conference_reservation_id) ||
    toStringOrNull(payload.conference_reservation_id) ||
    toStringOrNull(data.conference_reservation_id)
  if (confId) return { type: 'conference', id: confId }

  // Sinon chercher reservation_id (chambre)
  const roomId =
    toStringOrNull(allMeta.reservation_id) ||
    toStringOrNull(payload.reservation_id) ||
    toStringOrNull(data.reservation_id)
  if (roomId) return { type: 'room', id: roomId }

  return null
}

function pickAmount(payload: Record<string, unknown>): number | null {
  const data = payload.data as Record<string, unknown> | undefined
  const raw = payload.amount ?? data?.amount
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function pickCurrency(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  const value = toStringOrNull(payload.currency) || toStringOrNull(data?.currency)
  return value ? value.toUpperCase() : null
}

function pickStatus(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    toStringOrNull(payload.status) ||
    toStringOrNull(payload.payment_status) ||
    toStringOrNull(data?.status) ||
    toStringOrNull(data?.payment_status)
  )
}

function pickSignature(headers: Headers): string | null {
  return (
    headers.get('ccp-hmac-signature') ||
    headers.get('x-ccp-signature') ||
    headers.get('ccp-signature') ||
    headers.get('x-signature') ||
    null
  )
}

const webhookSchema = z
  .object({
    status: z.string().optional(),
    payment_status: z.string().optional(),
    transaction_id: z.string().optional(),
    id: z.string().optional(),
    operation_id: z.string().optional(),
    request_id: z.string().optional(),
    order_id: z.string().optional(),
    payment_reference: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
    reservation_id: z.string().uuid().optional(),
    conference_reservation_id: z.string().uuid().optional(),
    metadata: z
      .object({
        reservation_id: z.string().uuid().optional(),
        conference_reservation_id: z.string().uuid().optional(),
        reservation_type: z.string().optional(),
      })
      .passthrough()
      .optional(),
    data: z
      .object({
        status: z.string().optional(),
        payment_status: z.string().optional(),
        transaction_id: z.string().optional(),
        id: z.string().optional(),
        operation_id: z.string().optional(),
        request_id: z.string().optional(),
        order_id: z.string().optional(),
        payment_reference: z.string().optional(),
        amount: z.union([z.number(), z.string()]).optional(),
        currency: z.string().optional(),
        reservation_id: z.string().uuid().optional(),
        conference_reservation_id: z.string().uuid().optional(),
        metadata: z
          .object({
            reservation_id: z.string().uuid().optional(),
            conference_reservation_id: z.string().uuid().optional(),
            reservation_type: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export function OPTIONS() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'
  return secureJson({}, siteUrl, { status: 204 })
}

// ─── Journal `p1_webhook_events` (couche de stockage, testable) ─────────────────

type JournalRow = {
  id: string
  received_status: string
  outcome: string | null
  raw_status: string | null
}

/**
 * Accès typé minimal à https://p1_webhook_events` (la table n'existe pas encore
 * dans les types générés : migration 20261101_p1_webhook_correlation.sql).
 * Cast contrôlé — les noms de colonnes sont vérifiés par la migration.
 */
function journalTable(supabase: ReturnType<typeof createServiceRoleClient>) {
  return supabase.from('p1_webhook_events' as never) as unknown as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        maybeSingle: () => Promise<{
          data: JournalRow | null
          error: { message: string } | null
        }>
      }
    }
    insert: (entry: WebhookJournalEntry) => {
      select: (columns: string) => {
        single: () => Promise<{ data: JournalRow; error: { message: string } | null }>
      }
    }
    update: (patch: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

async function journalLookup(
  supabase: ReturnType<typeof createServiceRoleClient>,
  eventKey: string
): Promise<JournalRow | null> {
  const { data, error } = await journalTable(supabase)
    .select('id, received_status, outcome, raw_status')
    .eq('provider_event_key', eventKey)
    .maybeSingle()
  // Une erreur de lecture (ex. table absente avant migration) ne doit JAMAIS
  // être interprétée comme « pas encore reçu » : on propage → 500.
  if (error) throw error
  return data ?? null
}

async function journalSetState(
  supabase: ReturnType<typeof createServiceRoleClient>,
  id: string,
  patch: {
    received_status: WebhookJournalStatus
    outcome: string | null
    note: string | null
    /** Dernier statut brut traité — mise à jour pour la déduplication. */
    raw_status?: string | null
  }
): Promise<void> {
  const { error } = await journalTable(supabase)
    .update({ ...patch, processed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[chapchap-webhook] journal update error', { journalId: id, error })
  }
}

/**
 * Journal-first : retourne la ligne existante (déduplication) ou insère une
 * nouvelle. `{ duplicate: true }` signale une livraison strictement identique
 * déjà traitée (même statut, résultat terminal) → réponse 200 already_processed.
 * Un webhook de statut DIFFÉRENT sur la même operation_id est TOUJOURS re-traité
 * (guide : « failed puis success ») — la ligne existante est réutilisée.
 */
async function journalResolve(
  supabase: ReturnType<typeof createServiceRoleClient>,
  entry: WebhookJournalEntry
): Promise<{ row: JournalRow; duplicate: boolean }> {
  const existing = await journalLookup(supabase, entry.provider_event_key)
  if (existing) {
    const duplicate =
      existing.received_status === 'processed' &&
      existing.outcome !== null &&
      existing.outcome !== 'anomaly' &&
      existing.outcome !== 'unverifiable' &&
      existing.raw_status === entry.raw_status
    return { row: existing, duplicate }
  }

  try {
    const { data, error } = await journalTable(supabase)
      .insert(entry)
      .select('id, received_status, outcome, raw_status')
      .single()
    if (error) throw error
    return { row: data, duplicate: false }
  } catch (insertError) {
    // Course : deux livraisons simultanées — l'index unique laisse passer une
    // seule insertion ; on relit l'existante (traitement idempotent plus bas).
    const raced = await journalLookup(supabase, entry.provider_event_key)
    if (raced) return { row: raced, duplicate: false }
    throw insertError
  }
}

// ─── Transition atomique Compare-And-Swap ──────────────────────────────────────
// Le statut n'évolue que si le statut courant figure dans la liste autorisée
// pour le statut entrant (ALLOWED_FROM). Deux webhooks simultanés : un seul
// passe, l'autre reçoit 0 ligne → « already_processed ».
async function casTransition(
  supabase: ReturnType<typeof createServiceRoleClient>,
  table: 'reservations' | 'conference_reservations',
  id: string,
  patch: Record<string, unknown>,
  incoming: ReservationPaymentStatus
): Promise<'updated' | 'already' | 'noop'> {
  const allowed = allowedCurrentStatuses(incoming)
  if (allowed.length === 0) return 'noop'

  const { data, error } = await (
    supabase.from(table) as unknown as {
      update: (patch: Record<string, unknown>) => {
        eq: (
          column: string,
          value: string
        ) => {
          in: (
            column: string,
            values: string[]
          ) => {
            select: (
              columns: string
            ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
          }
        }
      }
    }
  )
    .update(patch)
    .eq('id', id)
    .in('payment_status', allowed)
    .select('id')

  if (error) throw error
  return data && data.length > 0 ? 'updated' : 'already'
}

function pickOperationId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    toStringOrNull(data?.operation_id) ||
    toStringOrNull(data?.operationId) ||
    toStringOrNull(payload.operation_id) ||
    toStringOrNull(payload.operationId)
  )
}

function pickRequestId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    toStringOrNull(data?.request_id) ||
    toStringOrNull(data?.requestId) ||
    toStringOrNull(payload.request_id) ||
    toStringOrNull(payload.requestId)
  )
}

// ─── Traitement cible (chambre / conférence) ───────────────────────────────────

type ReservationRowLike = {
  payment_status?: string | null
  total_price?: number | null
  currency?: string | null
  chapchap_transaction_id?: string | null
  transaction_id?: string | null
  chapchap_order_id?: string | null
}

/**
 * Vérifie et applique un statut « paid »/« refunded » (statuts financiers).
 * JAMAIS de transition sans preuve : décision non confirmative → journal +
 * réponse 202 ; décision positive → transition atomique CAS → 200.
 */
async function applyFinancialStatus(
  supabase: ReturnType<typeof createServiceRoleClient>,
  table: 'reservations' | 'conference_reservations',
  reservation: ReservationRowLike,
  reservationId: string,
  incomingStatus: ReservationPaymentStatus,
  ids: WebhookIds,
  journalId: string,
  siteUrl: string
): Promise<Response> {
  const decision = verifyPaidConfirmation({
    transactionId: ids.transactionId,
    expectedAmount: Number(reservation.total_price ?? NaN),
    receivedAmount: ids.amount,
    receivedCurrency: ids.currency,
    existingTransactionId:
      table === 'reservations'
        ? toStringOrNull(reservation.chapchap_transaction_id)
        : toStringOrNull(reservation.transaction_id),
    currentStatus: (reservation.payment_status as ReservationPaymentStatus) ?? null,
    storedOrderId: toStringOrNull(reservation.chapchap_order_id),
    payloadOrderReference: ids.payloadOrderReference,
  })

  if (decision.decision === 'reject') {
    await journalSetState(supabase, journalId, {
      received_status: 'anomaly',
      outcome: `reject:${decision.reason}`,
      note: `Confirmation ${incomingStatus} refusée : ${decision.reason}.`,
      raw_status: ids.rawStatus,
    })
    console.warn(`[chapchap-webhook] ${table} ${incomingStatus} rejected`, {
      reservationId,
      reason: decision.reason,
    })
    return secureJson({ success: true, note: `reject:${decision.reason}` }, siteUrl, {
      status: 202,
    })
  }

  if (decision.decision === 'unverifiable') {
    await journalSetState(supabase, journalId, {
      received_status: 'unverifiable',
      outcome: `unverifiable:${decision.reason}`,
      note: `Preuve insuffisante (${decision.reason}) : vérification manuelle obligatoire.`,
      raw_status: ids.rawStatus,
    })
    console.warn(`[chapchap-webhook] ${table} ${incomingStatus} unverifiable`, {
      reservationId,
      reason: decision.reason,
    })
    return secureJson({ success: true, note: `unverifiable:${decision.reason}` }, siteUrl, {
      status: 202,
    })
  }

  if (decision.decision === 'already_processed') {
    await journalSetState(supabase, journalId, {
      received_status: 'processed',
      outcome: 'already_processed',
      note: 'Transaction conflictuelle — événement déjà traité.',
      raw_status: ids.rawStatus,
    })
    return secureJson({ success: true, note: 'already_processed' }, siteUrl)
  }

  // decision.decision === 'confirm'
  const transactionPatch =
    table === 'reservations'
      ? ids.transactionId
        ? { chapchap_transaction_id: ids.transactionId }
        : {}
      : ids.transactionId
        ? { transaction_id: ids.transactionId }
        : {}

  const transition = await casTransition(
    supabase,
    table,
    reservationId,
    { payment_status: incomingStatus, ...transactionPatch },
    incomingStatus
  )

  if (transition === 'already' || transition === 'noop') {
    await journalSetState(supabase, journalId, {
      received_status: 'processed',
      outcome: 'already_processed',
      note: `Transition déjà appliquée (CAS ${transition}).`,
      raw_status: ids.rawStatus,
    })
    return secureJson({ success: true, note: 'already_processed' }, siteUrl)
  }

  await journalSetState(supabase, journalId, {
    received_status: 'processed',
    outcome: `updated:${incomingStatus}:correlation_${decision.correlation}`,
    note: null,
    raw_status: ids.rawStatus,
  })
  console.info(`[chapchap-webhook] ${table} status updated`, {
    reservationId,
    from: reservation.payment_status ?? '?',
    to: incomingStatus,
    correlation: decision.correlation,
  })

  return secureJson({ success: true }, siteUrl)
}

async function processRoomWebhook(
  supabase: ReturnType<typeof createServiceRoleClient>,
  reservationId: string,
  incomingStatus: ReservationPaymentStatus,
  ids: WebhookIds,
  journalId: string,
  siteUrl: string
): Promise<Response> {
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('payment_status, total_price, currency, chapchap_transaction_id, chapchap_order_id')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    console.error('[chapchap-webhook] room reservation not found', { reservationId })
    await journalSetState(supabase, journalId, {
      received_status: 'anomaly',
      outcome: 'reservation_not_found',
      note: `Réservation introuvable : ${reservationId}.`,
    })
    return secureJson({ success: true, note: 'reservation_not_found' }, siteUrl, { status: 202 })
  }

  // Statuts financiers : vérification stricte avant toute confirmation.
  if (incomingStatus === 'paid' || incomingStatus === 'refunded') {
    return await applyFinancialStatus(
      supabase,
      'reservations',
      reservation,
      reservationId,
      incomingStatus,
      ids,
      journalId,
      siteUrl
    )
  }

  // Statuts non financiers (failed / cancelé / expiré…) : transition CAS.
  const transactionPatch = ids.transactionId ? { chapchap_transaction_id: ids.transactionId } : {}
  const transition = await casTransition(
    supabase,
    'reservations',
    reservationId,
    { payment_status: incomingStatus, ...transactionPatch },
    incomingStatus
  )

  if (transition === 'updated') {
    await journalSetState(supabase, journalId, {
      received_status: 'processed',
      outcome: `updated:${incomingStatus}`,
      note: null,
      raw_status: ids.rawStatus,
    })
    return secureJson({ success: true }, siteUrl)
  }
  if (transition === 'already') {
    await journalSetState(supabase, journalId, {
      received_status: 'processed',
      outcome: 'already_processed',
      note: null,
      raw_status: ids.rawStatus,
    })
    return secureJson({ success: true, note: 'already_processed' }, siteUrl)
  }
  await journalSetState(supabase, journalId, {
    received_status: 'processed',
    outcome: 'noop',
    note: 'Statut sans transition possible.',
    raw_status: ids.rawStatus,
  })
  return secureJson({ success: true, note: 'noop' }, siteUrl)
}

async function processConferenceWebhook(
  supabase: ReturnType<typeof createServiceRoleClient>,
  reservationId: string,
  incomingStatus: ReservationPaymentStatus,
  ids: WebhookIds,
  journalId: string,
  siteUrl: string
): Promise<Response> {
  const { data: reservation, error: fetchError } = await supabase
    .from('conference_reservations')
    .select('payment_status, total_price, currency, transaction_id, chapchap_order_id')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    console.error('[chapchap-webhook] conference reservation not found', { reservationId })
    await journalSetState(supabase, journalId, {
      received_status: 'anomaly',
      outcome: 'reservation_not_found',
      note: `Réservation conférence introuvable : ${reservationId}.`,
    })
    return secureJson({ success: true, note: 'reservation_not_found' }, siteUrl, { status: 202 })
  }

  if (incomingStatus === 'paid' || incomingStatus === 'refunded') {
    return await applyFinancialStatus(
      supabase,
      'conference_reservations',
      reservation,
      reservationId,
      incomingStatus,
      ids,
      journalId,
      siteUrl
    )
  }

  const transactionPatch = ids.transactionId ? { transaction_id: ids.transactionId } : {}
  const transition = await casTransition(
    supabase,
    'conference_reservations',
    reservationId,
    { payment_status: incomingStatus, ...transactionPatch },
    incomingStatus
  )

  if (transition === 'updated') {
    await journalSetState(supabase, journalId, {
      received_status: 'processed',
      outcome: `updated:${incomingStatus}`,
      note: null,
      raw_status: ids.rawStatus,
    })
    return secureJson({ success: true }, siteUrl)
  }
  if (transition === 'already') {
    await journalSetState(supabase, journalId, {
      received_status: 'processed',
      outcome: 'already_processed',
      note: null,
      raw_status: ids.rawStatus,
    })
    return secureJson({ success: true, note: 'already_processed' }, siteUrl)
  }
  await journalSetState(supabase, journalId, {
    received_status: 'processed',
    outcome: 'noop',
    note: 'Statut sans transition possible.',
    raw_status: ids.rawStatus,
  })
  return secureJson({ success: true, note: 'noop' }, siteUrl)
}

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'
  const supabase = createServiceRoleClient()
  let journalId: string | null = null

  try {
    const rawBody = await request.text()

    // ── Auth : HMAC (le garde-fou du endpoint — pas de rate-limit) ──
    const webhookSecret = process.env.CHAPCHAP_HMAC_SECRET
    if (!webhookSecret) {
      console.error('[chapchap-webhook] missing HMAC secret')
      return secureJson({ message: 'Service webhook indisponible.' }, siteUrl, { status: 500 })
    }

    const signature = pickSignature(request.headers)
    if (!signature) {
      return secureJson({ message: 'Signature webhook manquante.' }, siteUrl, { status: 401 })
    }

    if (!verifyChapchapHmac(rawBody, signature, webhookSecret)) {
      console.warn('[chapchap-webhook] invalid HMAC signature')
      return secureJson({ message: 'Signature webhook invalide.' }, siteUrl, { status: 401 })
    }

    // ── Parse + schéma ──
    let rawPayload: unknown
    try {
      rawPayload = JSON.parse(rawBody)
    } catch {
      return secureJson({ message: 'Webhook invalide.' }, siteUrl, { status: 400 })
    }
    if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
      return secureJson({ message: 'Webhook invalide.' }, siteUrl, { status: 400 })
    }

    const parsed = webhookSchema.safeParse(rawPayload)
    if (!parsed.success) {
      return secureJson({ message: 'Webhook invalide.' }, siteUrl, { status: 400 })
    }
    const payload = parsed.data as unknown as Record<string, unknown>

    // ── JOURNAL-FIRST — aucune perte silencieuse ──
    const entry = buildJournalEntry({ payload, signature, rawBody })
    let resolved: { row: { id: string }; duplicate: boolean }
    try {
      resolved = await journalResolve(supabase, entry)
    } catch (journalError) {
      console.error('[chapchap-webhook] journal insert failed — notification non garantie', {
        eventKey: entry.provider_event_key,
        error: journalError,
      })
      return secureJson({ message: 'Impossible de journaliser le webhook.' }, siteUrl, {
        status: 500,
      })
    }
    journalId = resolved.row.id

    if (resolved.duplicate) {
      return secureJson({ success: true, note: 'already_processed' }, siteUrl)
    }

    // ── Identifier la cible : chambre ou conférence ──
    const target = pickReservationTarget(payload)
    if (!target) {
      await journalSetState(supabase, journalId, {
        received_status: 'anomaly',
        outcome: 'no_target',
        note: 'Webhook reçu sans réservation identifiable.',
        raw_status: entry.raw_status,
      })
      console.warn('[chapchap-webhook] unable to identify reservation target', {
        hasMetadata: !!payload.metadata,
      })
      return secureJson({ success: true, note: 'no_target' }, siteUrl, { status: 202 })
    }

    const ids: WebhookIds = {
      transactionId: pickTransactionId(payload),
      amount: pickAmount(payload),
      currency: pickCurrency(payload),
      payloadOrderReference: pickOrderReference(payload),
      operationId: pickOperationId(payload),
      requestId: pickRequestId(payload),
      rawStatus: entry.raw_status,
    }

    const incomingStatus = mapWebhookStatus(pickStatus(payload)) || 'pending'

    return target.type === 'conference'
      ? await processConferenceWebhook(supabase, target.id, incomingStatus, ids, journalId, siteUrl)
      : await processRoomWebhook(supabase, target.id, incomingStatus, ids, journalId, siteUrl)
  } catch (error) {
    // Aucune journalisation réussie ? On ne PEUT PAS répondre 200 : le 200
    // ferait croire au prestataire que l'événement est traité alors qu'il est
    // perdu irrécupérablement (pas de retry sur 4xx/5xx). → 500 + alerte.
    if (!journalId) {
      console.error(
        '[chapchap-webhook] critical: erreur AVANT journalisation — notification non garantie',
        { error }
      )
      return secureJson(
        { message: 'Webhook non journalisé — réessayez manuellement depuis le tableau de bord.' },
        siteUrl,
        { status: 500 }
      )
    }
    // Erreur interne APRÈS journalisation : l'événement est persisté — on peut
    // répondre 200 et marquer l'anomalie pour reprise manuelle contrôlée
    // (admin / bouton « Renvoyer le webhook » du tableau de bord prestataire).
    console.error('[chapchap-webhook] processing error (journaled)', { journalId, error })
    try {
      await journalSetState(supabase, journalId, {
        received_status: 'anomaly',
        outcome: 'process_error',
        note: 'Erreur interne pendant le traitement — reprise manuelle requise.',
      })
    } catch {
      // Ignoré : le journal ne doit pas masquer l'erreur d'origine.
    }
    return secureJson({ success: true, note: 'process_error' }, siteUrl)
  }
}
