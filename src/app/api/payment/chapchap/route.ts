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
import { initiateChapChapPayment, type SupabaseLike } from '@/lib/initiateChapChapPayment'

export const runtime = 'nodejs'

const createOperationSchema = z.object({
  currency: z.literal('GNF').optional(),
  paymentMethod: z.enum(['orange_money', 'mtn_momo', 'wave', 'card', 'paycard', 'cc']).optional(),
  phoneNumber: z.string().trim().min(8).max(30).optional(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(190),
  // bookingReference reste reçu (compatibilité clients existants) mais sa valeur
  // est VOLONTAIREMENT IGNORÉE : la référence canonique est dérivée côté serveur
  // depuis reservations.hotel_name (correction P1 — src/lib/initiateChapChapPayment.ts).
  bookingReference: z.string().trim().max(120).optional(),
  reservationId: z.string().trim().uuid(),
  roomName: z.string().trim().max(120).optional(),
})

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

    // ── URLS DE RETOUR / NOTIFICATION (construction serveur) ──
    const notifyUrl = buildUrl(process.env.CHAPCHAP_NOTIFY_URL, '/api/payment/webhook', siteUrl)
    const baseReturnUrl = buildUrl(process.env.CHAPCHAP_RETURN_URL, '/reservation/success', siteUrl)
    // Inclure reservation_id dans l'URL de retour pour que la success page puisse vérifier le statut
    const returnUrl = `${baseReturnUrl}${baseReturnUrl.includes('?') ? '&' : '?'}reservation_id=${encodeURIComponent(body.reservationId)}`
    const cancelUrl = buildUrl(process.env.CHAPCHAP_CANCEL_URL, '/reservation', siteUrl)

    // ── INITIALISATION (noyau testable) ──
    // Le noyau récupère la réservation depuis Supabase, calcule la référence
    // canonique MB/RA depuis reservations.hotel_name (correction P1), vérifie
    // l'éligibilité (montant serveur, pas de double paiement) puis appelle ChapChap.
    const result = await initiateChapChapPayment(
      {
        reservationId: body.reservationId,
        customerName: sanitizedName,
        customerEmail: body.customerEmail,
        roomName: body.roomName ? sanitizeText(body.roomName, 120) : undefined,
        paymentMethod: body.paymentMethod,
        // Fourni par l'ancien client, ignoré par le noyau (P1).
        bookingReference: body.bookingReference,
      },
      {
        supabase: createServiceRoleClient() as unknown as SupabaseLike,
        apiKey,
        baseUrl,
        urls: { notifyUrl, returnUrl, cancelUrl },
        fetchImpl: (input, init = {}) => fetchWithTimeout(input, init, 30_000),
      }
    )

    // ── MAPPING RÉSULTATS → RÉPONSES HTTP (comportements inchangés) ──
    switch (result.kind) {
      case 'ok':
        return secureJson(
          { success: true, order_id: result.orderId, payment_url: result.paymentUrl },
          siteUrl
        )
      case 'reservation_not_found':
        console.error('[chapchap] reservation not found', { reservationId: body.reservationId })
        return secureJson({ message: 'Réservation introuvable.' }, siteUrl, { status: 404 })
      case 'eligibility_error':
        return secureJson({ message: result.message }, siteUrl, { status: result.code })
      case 'provider_error':
        console.error('[chapchap] provider create operation failed', {
          status: result.status,
          body: result.body,
          orderId: result.orderId,
        })
        return secureJson(
          { message: 'Impossible de démarrer le paiement pour le moment.' },
          siteUrl,
          { status: 502 }
        )
      case 'missing_checkout_url':
        console.error('[chapchap] provider missing checkout url', { orderId: result.orderId })
        return secureJson({ message: 'Paiement indisponible. Veuillez réessayer.' }, siteUrl, {
          status: 502,
        })
      case 'provider_timeout':
        return secureJson(
          { message: 'Le service de paiement met trop de temps à répondre.' },
          siteUrl,
          { status: 504 }
        )
      case 'internal_error':
      default:
        console.error('[chapchap] internal error during create operation')
        return secureJson(
          { message: "Erreur serveur lors de l'initialisation du paiement." },
          siteUrl,
          { status: 500 }
        )
    }
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
