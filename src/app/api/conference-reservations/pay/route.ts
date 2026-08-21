import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase'
import {
  checkRateLimit,
  ensureSameOrigin,
  fetchWithTimeout,
  getClientIp,
  sanitizeText,
  secureJson,
} from '@/lib/chapchap'

export const runtime = 'nodejs'

const paySchema = z.object({
  conferenceReservationId: z.string().trim().uuid(),
})

function getApiKey(): string | null {
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    return process.env.CHAPCHAP_API_KEY_PRODUCTION || null
  }
  const testKey = process.env.CHAPCHAP_API_KEY_TEST
  if (testKey) return testKey
  console.warn(
    '[chapchap-conference] CHAPCHAP_API_KEY_TEST manquante en environnement non-production'
  )
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
    const rate = checkRateLimit('chapchap-conference-pay', ip, 100, 60 * 60 * 1000)
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
      console.error('[chapchap-conference] Clé API manquante')
      return secureJson({ message: 'Service de paiement indisponible.' }, siteUrl, { status: 500 })
    }

    const rawBody = await request.json()
    const parsed = paySchema.safeParse(rawBody)
    if (!parsed.success) {
      return secureJson({ message: 'Données de paiement invalides.' }, siteUrl, { status: 400 })
    }

    const body = parsed.data

    // ── VALIDATION SERVEUR : charger la réservation conférence et son prix ──
    const supabase = createServiceRoleClient()
    const { data: reservation, error: fetchError } = await supabase
      .from('conference_reservations')
      .select(
        'id, total_price, payment_status, status, currency, conference_room_id, first_name, last_name'
      )
      .eq('id', body.conferenceReservationId)
      .single()

    if (fetchError || !reservation) {
      console.error('[chapchap-conference] reservation not found', {
        id: body.conferenceReservationId,
      })
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

    // Le moyen de paiement sera déterminé par ChapChap — on ne le pré-écrit plus.
    // Le webhook mettra à jour payment_method après confirmation effective.

    // Charger le nom de la salle pour la description
    const { data: room } = await supabase
      .from('conference_rooms')
      .select('name')
      .eq('id', reservation.conference_room_id)
      .single()

    const roomName = room?.name || 'Salle de conférence'

    const orderId = sanitizeText(`CONF-${crypto.randomUUID()}`, 120)
    const notifyUrl = buildUrl(process.env.CHAPCHAP_NOTIFY_URL, '/api/payment/webhook', siteUrl)
    const baseReturnUrl = buildUrl(process.env.CHAPCHAP_RETURN_URL, '/reservation/success', siteUrl)
    const returnUrl = `${baseReturnUrl}${baseReturnUrl.includes('?') ? '&' : '?'}reservation_id=${encodeURIComponent(body.conferenceReservationId)}&reservation_type=conference`
    const cancelUrl = buildUrl(process.env.CHAPCHAP_CANCEL_URL, '/reservation', siteUrl)

    const chapChapPayload = {
      amount,
      description: sanitizeText(
        `Conférence ${roomName} - ${reservation.first_name} ${reservation.last_name}`,
        120
      ),
      order_id: orderId,
      notify_url: notifyUrl,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      metadata: {
        conference_reservation_id: body.conferenceReservationId,
        reservation_type: 'conference',
      },
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
      console.error('[chapchap-conference] provider create failed', {
        status: chapChapResponse.status,
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
      console.error('[chapchap-conference] missing checkout url', { orderId })
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
    console.error('[chapchap-conference] internal error')
    return secureJson(
      { message: "Erreur serveur lors de l'initialisation du paiement." },
      siteUrl,
      { status: 500 }
    )
  }
}
