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
import { sanitizeProviderUrl } from '@/lib/chapchapContract'
import { checkReservationClaim } from '@/lib/reservationClaim'
import { CHAPCHAP_BASE_URL_DEFAULT } from '@/lib/chapchapContract'
import { resolveChapchapApiKey } from '@/lib/chapchapKey'

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
 * Sélection de la clé API ChapChap SÉPARÉE par environnement (VERCEL_ENV).
 * - Déploiement de production → CHAPCHAP_API_KEY_PRODUCTION uniquement.
 * - Preview / Development / local → CHAPCHAP_API_KEY_TEST uniquement, AUCUN
 *   fallback vers Production ; 403 si la clé Production est encore présente
 *   dans l'environnement (isolation non garantie — fail-closed).
 * ✓ Correctif sécurité : `NODE_ENV` n'est PLUS utilisé seul (Vercel Preview
 *   tourne aussi en NODE_ENV=production).
 */
function getApiKey(): ReturnType<typeof resolveChapchapApiKey> {
  return resolveChapchapApiKey()
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

    const apiKeyDecision = getApiKey()
    const baseUrl = process.env.CHAPCHAP_BASE_URL || CHAPCHAP_BASE_URL_DEFAULT

    // Fail-closed : Preview / Dev ne touchent JAMAIS à la clé Production. Si la
    // clé Production est encore présente hors production (isolation non garantie)
    // → 403 ; si la clé TEST manque → 503. Aucune initiation de paiement.
    if (!apiKeyDecision.allow) {
      if (apiKeyDecision.reason === 'production_key_present_outside_production') {
        console.error(
          '[chapchap] Clé PRODUCTION présente hors déploiement production — isolation non garantie (403)'
        )
        return secureJson(
          { message: 'Environnement de paiement non isolé des clés de production.' },
          siteUrl,
          { status: 403 }
        )
      }
      console.error('[chapchap] Clé API manquante pour l’environnement actuel', {
        reason: apiKeyDecision.reason,
        vercelEnv: process.env.VERCEL_ENV ?? null,
      })
      return secureJson({ message: 'Service de paiement indisponible.' }, siteUrl, { status: 503 })
    }
    const apiKey = apiKeyDecision.key

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

    // ── PREUVE DE POSSESSION : la connaissance du seul UUID ne suffit plus ──────
    // Jeton HMAC délivré à la création (X-Reservation-Claim) — 401 si absent/
    // falsifié, 503 si le secret serveur n'est pas configuré (échec fermé).
    const claim = checkReservationClaim(request.headers, body.reservationId)
    if (!claim.allow) {
      const message =
        claim.status === 503
          ? 'Service de paiement indisponible.'
          : 'Accès non autorisé à cette réservation.'
      return secureJson({ message }, siteUrl, { status: claim.status })
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
        environment: apiKeyDecision.environment,
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
      case 'reservation_read_error':
        // Lecture impossible (config/clé/RLS/infra) — PAS une absence : 500.
        console.error('[chapchap] reservation read error (config/infra)', {
          reservationId: body.reservationId,
        })
        return secureJson({ message: 'Service de réservation indisponible.' }, siteUrl, {
          status: 500,
        })
      case 'eligibility_error':
        return secureJson({ message: result.message }, siteUrl, { status: result.code })
      case 'provider_error':
        console.error('[chapchap] provider create operation failed', {
          status: result.status,
          allow: result.allow,
        })
        return secureJson(
          { message: 'Impossible de démarrer le paiement pour le moment.' },
          siteUrl,
          { status: 502 }
        )
      case 'provider_redirect':
        console.error('[chapchap] provider redirected (POST→GET bloqué)', {
          status: result.status,
          location: sanitizeProviderUrl(result.location, siteUrl),
        })
        return secureJson(
          { message: 'Redirection prestataire non suivie — veuillez réessayer plus tard.' },
          siteUrl,
          { status: 502 }
        )
      case 'persistence_error':
        console.error(
          '[chapchap] CRITICAL provider created but correlation NOT persisted — URL non exposée',
          { orderId: result.orderId, providerOperationId: result.providerOperationId }
        )
        return secureJson(
          { message: 'Paiement indisponible pour le moment. Veuillez réessayer.' },
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
