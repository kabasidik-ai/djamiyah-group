import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { checkRateLimit, getClientIp, secureJson, verifyChapchapHmac } from '@/lib/chapchap'

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
    const supabase = createServiceRoleClient()

    // ── Traitement selon le type ──
    if (target.type === 'conference') {
      return await processConferenceWebhook(
        supabase,
        target.id,
        incomingStatus,
        transactionId,
        siteUrl
      )
    }

    // Default : chambre
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
