import { createHash } from 'node:crypto'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { checkRateLimit, getClientIp, secureJson, verifyChapchapHmac } from '@/lib/chapchap'
import { createSupabaseAttemptStore } from '@/lib/supabaseAttemptStore'
import { applyAttemptEvent } from '@/lib/paymentAttemptWebhook'
import { createPaymentEventJournalStore } from '@/lib/paymentEventJournal'
import { assertLocalMockConfig, resolvePaymentEngineMode } from '@/lib/paymentEngineMode'

export const runtime = 'nodejs'

type ReservationPaymentStatus = Database['public']['Enums']['payment_status_enum']

/**
 * Ordre de priorité des statuts de paiement.
 * paid est terminal : on ne revient jamais à pending ou failed depuis paid.
 * refunded est le seul statut qui peut surclasser paid.
 */
const STATUS_RANK: Record<ReservationPaymentStatus, number> = {
  pending: 0,
  failed: 1,
  paid: 2,
  refunded: 3,
}

function isStatusAdvance(
  current: ReservationPaymentStatus,
  incoming: ReservationPaymentStatus
): boolean {
  if (incoming === 'refunded' && current === 'paid') return true
  return STATUS_RANK[incoming] > STATUS_RANK[current]
}

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

function pickTransactionId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined
  return (
    toStringOrNull(payload.transaction_id) ||
    toStringOrNull(payload.id) ||
    toStringOrNull(data?.transaction_id) ||
    toStringOrNull(data?.id)
  )
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

function safeTruncate(value: string | null, max = 190): string | null {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length <= max ? normalized : normalized.slice(0, max)
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function pickAttemptId(payload: Record<string, unknown>): string | null {
  const metadata = toObject(payload.metadata)
  const data = toObject(payload.data)
  const dataMetadata = toObject(data.metadata)
  return (
    toStringOrNull(metadata.attempt_id) ||
    toStringOrNull(dataMetadata.attempt_id) ||
    toStringOrNull(payload.attempt_id) ||
    toStringOrNull(data.attempt_id)
  )
}

function pickOrderId(payload: Record<string, unknown>): string | null {
  const data = toObject(payload.data)
  return toStringOrNull(payload.order_id) || toStringOrNull(data.order_id)
}

function pickProviderOperationId(payload: Record<string, unknown>): string | null {
  const data = toObject(payload.data)
  return (
    toStringOrNull(payload.operation_id) ||
    toStringOrNull(data.operation_id) ||
    pickTransactionId(payload)
  )
}

function pickProviderRequestId(payload: Record<string, unknown>): string | null {
  const data = toObject(payload.data)
  return toStringOrNull(payload.request_id) || toStringOrNull(data.request_id)
}

function pickAmount(payload: Record<string, unknown>): number | null {
  const data = toObject(payload.data)
  const amount = payload.amount ?? data.amount
  if (typeof amount === 'number' && Number.isFinite(amount)) return Math.trunc(amount)
  if (typeof amount === 'string' && /^\d+$/.test(amount.trim())) return Number(amount.trim())
  return null
}

function pickCurrency(payload: Record<string, unknown>): string | null {
  const data = toObject(payload.data)
  const currency = toStringOrNull(payload.currency) || toStringOrNull(data.currency)
  return currency ? currency.toUpperCase() : null
}

function redactPayloadForJournal(payload: Record<string, unknown>): Record<string, unknown> {
  const metadata = toObject(payload.metadata)
  const data = toObject(payload.data)
  const dataMetadata = toObject(data.metadata)

  return {
    status: pickStatus(payload),
    reservation_id: toStringOrNull(payload.reservation_id) || toStringOrNull(data.reservation_id),
    conference_reservation_id:
      toStringOrNull(payload.conference_reservation_id) ||
      toStringOrNull(data.conference_reservation_id),
    order_id: pickOrderId(payload),
    operation_id: pickProviderOperationId(payload),
    request_id: pickProviderRequestId(payload),
    amount: pickAmount(payload),
    currency: pickCurrency(payload),
    metadata: {
      reservation_id:
        toStringOrNull(metadata.reservation_id) || toStringOrNull(dataMetadata.reservation_id),
      conference_reservation_id:
        toStringOrNull(metadata.conference_reservation_id) ||
        toStringOrNull(dataMetadata.conference_reservation_id),
      reservation_type:
        toStringOrNull(metadata.reservation_type) || toStringOrNull(dataMetadata.reservation_type),
      attempt_id: pickAttemptId(payload),
      reference: toStringOrNull(metadata.reference) || toStringOrNull(dataMetadata.reference),
    },
  }
}

function computePayloadSha256(rawBody: string): string {
  return createHash('sha256').update(rawBody).digest('hex')
}

function buildDedupKey(input: {
  payloadSha256: string
  providerOperationId: string | null
  providerRequestId: string | null
  orderId: string | null
  statusRaw: string | null
}): string {
  const parts = [
    input.providerOperationId ?? '_',
    input.providerRequestId ?? '_',
    input.orderId ?? '_',
    input.statusRaw ?? '_',
    input.payloadSha256,
  ]
  return parts.join('|')
}

const webhookSchema = z
  .object({
    status: z.string().optional(),
    payment_status: z.string().optional(),
    transaction_id: z.string().optional(),
    id: z.string().optional(),
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

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit('chapchap-webhook', ip, 100, 60 * 60 * 1000)
    if (!rate.allowed) {
      return secureJson({ message: 'Trop de requêtes.' }, siteUrl, { status: 429 })
    }

    const rawBody = await request.text()
    const rawPayload = JSON.parse(rawBody) as Record<string, unknown>
    const parsed = webhookSchema.safeParse(rawPayload)
    if (!parsed.success) {
      return secureJson({ message: 'Webhook invalide.' }, siteUrl, { status: 400 })
    }
    const payload = parsed.data as Record<string, unknown>

    // ── Vérification HMAC ──
    const webhookSecret = process.env.CHAPCHAP_HMAC_SECRET
    const signature = pickSignature(request.headers)

    if (!webhookSecret) {
      console.error('[chapchap-webhook] missing HMAC secret')
      return secureJson({ message: 'Service webhook indisponible.' }, siteUrl, { status: 500 })
    }

    if (!signature) {
      return secureJson({ message: 'Signature webhook manquante.' }, siteUrl, { status: 401 })
    }

    if (!verifyChapchapHmac(rawBody, signature, webhookSecret)) {
      return secureJson({ message: 'Signature webhook invalide.' }, siteUrl, { status: 401 })
    }

    // ── Identifier la cible : chambre ou conférence ──
    const target = pickReservationTarget(payload)
    if (!target) {
      console.warn('[chapchap-webhook] unable to identify reservation target', {
        hasMetadata: !!payload.metadata,
      })
      return secureJson({ message: 'Webhook reçu sans réservation identifiable.' }, siteUrl, {
        status: 400,
      })
    }

    const incomingStatus = mapWebhookStatus(pickStatus(payload)) || 'pending'
    const transactionId = pickTransactionId(payload)
    const p2Mode = resolvePaymentEngineMode()
    const supabase = createServiceRoleClient()

    // P2 local_mock : journal durable AVANT acquittement HTTP,
    // puis application idempotente via le moteur d'événements.
    if (p2Mode === 'local_mock' && target.type === 'room') {
      assertLocalMockConfig()

      const payloadSha256 = computePayloadSha256(rawBody)
      const statusRaw = pickStatus(payload)
      const attemptId = pickAttemptId(payload)
      const orderId = pickOrderId(payload)
      const providerOperationId = pickProviderOperationId(payload)
      const providerRequestId = pickProviderRequestId(payload)
      const amount = pickAmount(payload)
      const currency = pickCurrency(payload)
      const payloadRedacted = redactPayloadForJournal(payload)

      const journal = createPaymentEventJournalStore(supabase)
      let eventId: string
      try {
        const persisted = await journal.persistWebhookEvent({
          source: 'chapchap_webhook',
          receivedAtIso: new Date().toISOString(),
          signatureValid: true,
          payloadRedacted,
          payloadSha256,
          dedupKey: buildDedupKey({
            payloadSha256,
            providerOperationId,
            providerRequestId,
            orderId,
            statusRaw,
          }),
          reservationId: target.id,
          attemptId,
          orderId,
          providerOperationId,
          providerRequestId,
          statusRaw,
        })
        eventId = persisted.eventId
      } catch (error) {
        console.error('[chapchap-webhook] durable journal persistence failed', {
          reservationId: target.id,
          statusRaw,
          error: error instanceof Error ? safeTruncate(error.message) : 'unknown_error',
        })
        // Échec de journalisation: pas de perte silencieuse.
        // 503 pour forcer investigation + relance manuelle si nécessaire.
        return secureJson(
          {
            message:
              'Webhook reçu mais journalisation indisponible. Réessai manuel requis depuis le dashboard marchand.',
          },
          siteUrl,
          { status: 503 }
        )
      }

      const attemptStore = createSupabaseAttemptStore(supabase as never)
      try {
        const applied = await applyAttemptEvent(attemptStore, {
          reservationId: target.id,
          attemptId,
          orderId,
          amount,
          currency,
          incomingStatusRaw: statusRaw,
          providerOperationId,
          providerRequestId,
        })

        if (applied.outcome === 'updated' || applied.outcome === 'already_processed') {
          await journal.markProcessing(eventId, 'processed')
          return secureJson({ success: true }, siteUrl)
        }

        if (
          applied.outcome === 'manual_reconciliation_required' ||
          applied.outcome === 'identity_mismatch' ||
          applied.outcome === 'unknown_status_ignored' ||
          applied.outcome === 'ignored_out_of_order' ||
          applied.outcome === 'refund_ignored_unverified' ||
          applied.outcome === 'not_found'
        ) {
          await journal.markProcessing(eventId, 'reconciliation_required', {
            reconciliationRequired: true,
            lastError:
              applied.outcome === 'manual_reconciliation_required'
                ? safeTruncate(applied.reason)
                : safeTruncate(applied.outcome),
          })
          return secureJson({ success: true, note: 'reconciliation_required' }, siteUrl)
        }

        await journal.markProcessing(eventId, 'ignored')
        return secureJson({ success: true, note: 'already_processed' }, siteUrl)
      } catch (error) {
        await journal.markProcessing(eventId, 'storage_failed', {
          reconciliationRequired: true,
          lastError: error instanceof Error ? safeTruncate(error.message) : 'unknown_error',
        })
        console.error('[chapchap-webhook] p2 local_mock processing failed', {
          reservationId: target.id,
          eventId,
        })
        return secureJson({ message: 'Webhook journalisé, traitement en erreur.' }, siteUrl, {
          status: 500,
        })
      }
    }

    // ── Traitement selon le type (P1 / conférences préservés) ──
    if (target.type === 'conference') {
      return await processConferenceWebhook(
        supabase,
        target.id,
        incomingStatus,
        transactionId,
        siteUrl
      )
    }

    // Default : chambre (P1 historique)
    return await processRoomWebhook(supabase, target.id, incomingStatus, transactionId, siteUrl)
  } catch {
    console.error('[chapchap-webhook] internal error')
    return secureJson({ message: 'Erreur serveur webhook.' }, siteUrl, { status: 500 })
  }
}

// ── CHAMBRE ──
async function processRoomWebhook(
  supabase: ReturnType<typeof createServiceRoleClient>,
  reservationId: string,
  incomingStatus: ReservationPaymentStatus,
  transactionId: string | null,
  siteUrl: string
) {
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('payment_status')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    console.error('[chapchap-webhook] room reservation not found', { reservationId })
    return secureJson({ message: 'Réservation introuvable.' }, siteUrl, { status: 404 })
  }

  const currentStatus = reservation.payment_status as ReservationPaymentStatus

  if (!isStatusAdvance(currentStatus, incomingStatus)) {
    console.info('[chapchap-webhook] room status transition ignored', {
      reservationId,
      currentStatus,
      incomingStatus,
    })
    return secureJson({ success: true, note: 'already_processed' }, siteUrl)
  }

  const updateData: Database['public']['Tables']['reservations']['Update'] = {
    payment_status: incomingStatus,
    ...(transactionId ? { chapchap_transaction_id: transactionId } : {}),
  }

  const { error: updateError } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', reservationId)

  if (updateError) {
    console.error('[chapchap-webhook] room reservation update error', { reservationId })
    return secureJson({ message: 'Impossible de traiter le webhook.' }, siteUrl, { status: 500 })
  }

  console.info('[chapchap-webhook] room status updated', {
    reservationId,
    from: currentStatus,
    to: incomingStatus,
  })

  return secureJson({ success: true }, siteUrl)
}

// ── CONFÉRENCE ──
async function processConferenceWebhook(
  supabase: ReturnType<typeof createServiceRoleClient>,
  reservationId: string,
  incomingStatus: ReservationPaymentStatus,
  transactionId: string | null,
  siteUrl: string
) {
  const { data: reservation, error: fetchError } = await supabase
    .from('conference_reservations')
    .select('payment_status')
    .eq('id', reservationId)
    .single()

  if (fetchError || !reservation) {
    console.error('[chapchap-webhook] conference reservation not found', { reservationId })
    return secureJson({ message: 'Réservation conférence introuvable.' }, siteUrl, { status: 404 })
  }

  const currentStatus = reservation.payment_status as ReservationPaymentStatus

  if (!isStatusAdvance(currentStatus, incomingStatus)) {
    console.info('[chapchap-webhook] conference status transition ignored', {
      reservationId,
      currentStatus,
      incomingStatus,
    })
    return secureJson({ success: true, note: 'already_processed' }, siteUrl)
  }

  // Ne met à jour que payment_status et transaction_id.
  // Ne touche JAMAIS conference_reservations.status automatiquement.
  const updateData: Database['public']['Tables']['conference_reservations']['Update'] = {
    payment_status: incomingStatus,
    ...(transactionId ? { transaction_id: transactionId } : {}),
  }

  const { error: updateError } = await supabase
    .from('conference_reservations')
    .update(updateData)
    .eq('id', reservationId)

  if (updateError) {
    console.error('[chapchap-webhook] conference reservation update error', { reservationId })
    return secureJson({ message: 'Impossible de traiter le webhook.' }, siteUrl, { status: 500 })
  }

  console.info('[chapchap-webhook] conference status updated', {
    reservationId,
    from: currentStatus,
    to: incomingStatus,
  })

  return secureJson({ success: true }, siteUrl)
}
