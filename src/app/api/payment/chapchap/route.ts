import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import {
  checkRateLimit,
  ensureSameOrigin,
  fetchWithTimeout,
  getClientIp,
  sanitizeText,
  secureJson,
} from '@/lib/chapchap'

export const runtime = 'nodejs'

type ChapChapPaymentMethod = 'orange_money' | 'mtn_momo' | 'wave' | 'card' | 'paycard' | 'cc'

const createOperationSchema = z.object({
  currency: z.literal('GNF').optional(),
  paymentMethod: z.enum(['orange_money', 'mtn_momo', 'wave', 'card', 'paycard', 'cc']),
  phoneNumber: z.string().trim().min(8).max(30).optional(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(190),
  bookingReference: z.string().trim().max(120).optional(),
  reservationId: z.string().trim().uuid(),
  roomName: z.string().trim().max(120).optional(),
})

function mapPaymentMethod(
  method: ChapChapPaymentMethod
): Database['public']['Enums']['payment_method_enum'] {
  if (method === 'orange_money') return 'orange_money'
  if (method === 'mtn_momo') return 'mtn_momo'
  return 'card'
}

/**
 * Sélection explicite de la clé API ChapChap selon l'environnement.
 * - Production → CHAPCHAP_API_KEY_PRODUCTION uniquement
 * - Développement → CHAPCHAP_API_KEY_TEST uniquement
 * Aucune bascule silencieuse.
 */
function getApiKey(): string | null {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    return process.env.CHAPCHAP_API_KEY_PRODUCTION || null
  }

  // En développement / test, utiliser la clé test
  const testKey = process.env.CHAPCHAP_API_KEY_TEST
  if (testKey) return testKey

  // Fallback explicite : si pas de clé test, on refuse (pas de bascule silencieuse vers prod)
  console.warn('[chapchap] CHAPCHAP_API_KEY_TEST manquante en environnement non-production')
  return null
}

function buildUrl(base: string | undefined, fallbackPath: string, siteUrl: string) {
  if (base && /^https?:\/\//i.test(base)) return base
  return `${siteUrl.replace(/\/$/, '')}${fallbackPath}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function OPTIONS() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'
  return secureJson({}, siteUrl, { status: 204 })
}

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit('chapchap-create', ip, 100, 60 * 60 * 1000)
    if (!rate.allowed) {
      return secureJson({ message: 'Trop de requêtes. Veuillez réessayer plus tard.' }, siteUrl, {
        status: 429,
      })
    }

    if (!ensureSameOrigin(request, siteUrl)) {
      return secureJson({ message: 'Requête non autorisée.' }, siteUrl, { status: 403 })
    }

    const apiKey = getApiKey()
    const baseUrl = process.env.CHAPCHAP_BASE_URL || 'https://chapchappay.com/api'

    if (!apiKey) {
      console.error("[chapchap] Clé API manquante pour l'environnement actuel")
      return secureJson({ message: 'Service de paiement indisponible.' }, siteUrl, { status: 500 })
    }

    const rawBody = await request.json()
    const parsed = createOperationSchema.safeParse(rawBody)
    if (!parsed.success) {
      return secureJson({ message: 'Données de paiement invalides.' }, siteUrl, { status: 400 })
    }

    const body = parsed.data

    const sanitizedName = sanitizeText(body.customerName, 120)
    const sanitizedPhone = body.phoneNumber ? sanitizeText(body.phoneNumber, 30) : undefined

    if (
      (body.paymentMethod === 'orange_money' ||
        body.paymentMethod === 'mtn_momo' ||
        body.paymentMethod === 'wave') &&
      !sanitizedPhone
    ) {
      return secureJson({ message: 'Le numéro Mobile Money est requis.' }, siteUrl, { status: 400 })
    }

    // ── VALIDATION SERVEUR : récupérer la réservation et son montant depuis Supabase ──
    const supabase = createServiceRoleClient()
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, total_price, payment_status, status, currency')
      .eq('id', body.reservationId)
      .single()

    if (fetchError || !reservation) {
      console.error('[chapchap] reservation not found', { reservationId: body.reservationId })
      return secureJson({ message: 'Réservation introuvable.' }, siteUrl, { status: 404 })
    }

    // ── PROTECTION DOUBLE PAIEMENT ──
    if (reservation.payment_status === 'paid') {
      return secureJson({ message: 'Cette réservation est déjà payée.' }, siteUrl, { status: 409 })
    }

    if (reservation.status === 'cancelled') {
      return secureJson({ message: 'Cette réservation a été annulée.' }, siteUrl, { status: 409 })
    }

    // ── MONTANT SERVEUR : ne jamais faire confiance au client ──
    const amount = reservation.total_price

    if (!amount || amount <= 0) {
      return secureJson({ message: 'Montant de réservation invalide.' }, siteUrl, { status: 400 })
    }

    const paymentMethod = mapPaymentMethod(body.paymentMethod)

    // Mettre à jour la méthode de paiement et le statut pending
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ payment_method: paymentMethod, payment_status: 'pending' })
      .eq('id', body.reservationId)

    if (updateError) {
      console.error('[chapchap] reservation update error', { reservationId: body.reservationId })
    }

    const orderId = sanitizeText(body.bookingReference || `MB-${crypto.randomUUID()}`, 120)
    const notifyUrl = buildUrl(process.env.CHAPCHAP_NOTIFY_URL, '/api/payment/webhook', siteUrl)
    const baseReturnUrl = buildUrl(process.env.CHAPCHAP_RETURN_URL, '/reservation/success', siteUrl)
    // Inclure reservation_id dans l'URL de retour pour que la success page puisse vérifier le statut
    const returnUrl = `${baseReturnUrl}${baseReturnUrl.includes('?') ? '&' : '?'}reservation_id=${encodeURIComponent(body.reservationId)}`
    const cancelUrl = buildUrl(process.env.CHAPCHAP_CANCEL_URL, '/reservation', siteUrl)

    const chapChapPayload = {
      amount,
      description: sanitizeText(
        `Reservation ${body.roomName || body.bookingReference || orderId} - ${sanitizedName}`,
        120
      ),
      order_id: orderId,
      notify_url: notifyUrl,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      metadata: { reservation_id: body.reservationId, reservation_type: 'room' },
    }

    const chapChapResponse = await fetchWithTimeout(
      `${baseUrl}/ecommerce/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CCP-Api-Key': apiKey,
        },
        body: JSON.stringify(chapChapPayload),
      },
      30_000
    )

    const responseText = await chapChapResponse.text().catch(() => '{}')
    let result: Record<string, unknown> = {}
    try {
      result = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      result = {}
    }

    if (!chapChapResponse.ok) {
      console.error('[chapchap] provider create operation failed', {
        status: chapChapResponse.status,
        body: responseText,
        orderId,
      })
      return secureJson(
        { message: 'Impossible de démarrer le paiement pour le moment.' },
        siteUrl,
        { status: 502 }
      )
    }

    const checkoutUrl =
      result?.payment_url || result?.paymentUrl || result?.checkout_url || result?.checkoutUrl

    if (!checkoutUrl) {
      console.error('[chapchap] provider missing checkout url', { orderId })
      return secureJson({ message: 'Paiement indisponible. Veuillez réessayer.' }, siteUrl, {
        status: 502,
      })
    }

    return secureJson(
      {
        success: true,
        order_id: orderId,
        payment_url: checkoutUrl,
      },
      siteUrl
    )
  } catch (error) {
    if (isAbortError(error)) {
      return secureJson(
        { message: 'Le service de paiement met trop de temps à répondre.' },
        siteUrl,
        { status: 504 }
      )
    }
    console.error('[chapchap] internal error during create operation')
    return secureJson(
      { message: "Erreur serveur lors de l'initialisation du paiement." },
      siteUrl,
      { status: 500 }
    )
  }
}
