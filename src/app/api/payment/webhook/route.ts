import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { checkRateLimit, getClientIp, secureJson, verifyChapchapHmac } from '@/lib/chapchap'

export const runtime = 'nodejs'

type ReservationPaymentStatus = Database['public']['Enums']['payment_status_enum']

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  return null
}

function mapWebhookStatus(statusRaw: string | null): ReservationPaymentStatus | null {
  if (!statusRaw) return null

  const status = statusRaw.toLowerCase()

  if (['paid', 'success', 'successful', 'completed', 'succeeded'].includes(status)) {
    return 'paid'
  }

  if (['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(status)) {
    return 'failed'
  }

  if (['refunded', 'refund'].includes(status)) {
    return 'refunded'
  }

  if (['pending', 'processing', 'initiated'].includes(status)) {
    return 'pending'
  }

  return null
}

function pickReservationId(payload: Record<string, unknown>): string | null {
  const metadata = (payload.metadata ?? payload.data) as Record<string, unknown> | undefined

  return (
    toStringOrNull(payload.reservation_id) ||
    toStringOrNull(metadata?.reservation_id) ||
    toStringOrNull((payload.data as Record<string, unknown> | undefined)?.reservation_id)
  )
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
    headers.get('ccp-hmac-signature') || // ChapChap officiel
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
    metadata: z
      .object({
        reservation_id: z.string().uuid().optional(),
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
        metadata: z
          .object({
            reservation_id: z.string().uuid().optional(),
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
      return secureJson({ message: 'Trop de requêtes. Veuillez réessayer plus tard.' }, siteUrl, {
        status: 429,
      })
    }

    const rawBody = await request.text()
    const rawPayload = JSON.parse(rawBody) as Record<string, unknown>
    const parsed = webhookSchema.safeParse(rawPayload)
    if (!parsed.success) {
      return secureJson({ message: 'Webhook invalide.' }, siteUrl, { status: 400 })
    }
    const payload = parsed.data as Record<string, unknown>

    const webhookSecret = process.env.CHAPCHAP_HMAC_SECRET
    const signature = pickSignature(request.headers)

    if (!webhookSecret) {
      console.error('[chapchap-webhook] missing HMAC secret configuration')
      return secureJson({ message: 'Service webhook indisponible.' }, siteUrl, { status: 500 })
    }

    if (!signature) {
      return secureJson({ message: 'Signature webhook manquante.' }, siteUrl, { status: 401 })
    }

    const isValid = verifyChapchapHmac(rawBody, signature, webhookSecret)
    if (!isValid) {
      return secureJson({ message: 'Signature webhook invalide.' }, siteUrl, { status: 401 })
    }

    const reservationId = pickReservationId(payload)
    if (!reservationId) {
      return secureJson({ message: 'Webhook reçu sans réservation valide.' }, siteUrl, {
        status: 400,
      })
    }

    const mappedStatus = mapWebhookStatus(pickStatus(payload)) || 'pending'
    const transactionId = pickTransactionId(payload)

    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from('reservations')
      .update({
        payment_status: mappedStatus,
        chapchap_transaction_id: transactionId,
      })
      .eq('id', reservationId)

    if (error) {
      console.error('[chapchap-webhook] reservation update error', { reservationId })
      return secureJson({ message: 'Impossible de traiter le webhook.' }, siteUrl, { status: 500 })
    }

    return secureJson({ success: true }, siteUrl)
  } catch {
    console.error('[chapchap-webhook] internal error')
    return secureJson({ message: 'Erreur serveur webhook.' }, siteUrl, { status: 500 })
  }
}
