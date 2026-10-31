import { randomUUID } from 'node:crypto'
import {
  buildBookingReference,
  evaluateReservationPayment,
  mapPaymentMethod,
  resolveChapChapOrderId,
  type ChapChapPaymentMethod,
} from './roomPayment.ts'

/**
 * CORRECTION P1 — Initialisation du paiement ChapChap.
 *
 * Ce noyau est volontairement indépendant du framework (aucun import Next.js,
 * aucun alias "@/…" au moment de l'exécution) pour être testable unitairement
 * et en intégration simulée sans serveur.
 *
 * Point P1 : l'order_id envoyé à ChapChap est dérivé EXCLUSIVEMENT des données
 * serveur fiables (reservations.hotel_name + reservations.id). La valeur
 * `bookingReference` éventuellement fournie par le navigateur est ignorée.
 *
 * Point P2 (constat) : le contrôle de possession de la réservation (un demandeur
 * ne doit pas pouvoir initier le paiement d'une réservation d'autrui sur la seule
 * connaissance de son UUID) relève d'une évolution d'architecture — mise en place
 * d'un « claim code » dérivé d'un secret serveur (HMAC) ou stocké en base,
 * retourné au client à la création de la réservation. Ce mécanisme n'est PAS
 * implémenté ici par choix explicite : toute solution fragile bricolée à base de
 * données du navigateur (email, nom, …) serait un faux contrôle de sécurité.
 */

/** Index de colonnes réellement utilisées par le noyau (source de vérité serveur). */
type ReservationRow = {
  id: string
  hotel_name?: string | null
  total_price?: number | null
  payment_status?: string | null
  status?: string | null
  currency?: string | null
}

type SingleResponse<T> = { data: T | null; error: { message: string } | null }

/**
 * Supertype minimal du client Supabase utilisé par le noyau (seules les
 * chaînes from/select/eq/single et update/eq sont utilisées). La route
 * adapte le vrai client service-role vers ce type.
 */
export type SupabaseLike = {
  from(table: 'reservations'): {
    select(columns: string): {
      eq(
        column: string,
        value: string
      ): {
        single(): Promise<SingleResponse<ReservationRow>>
      }
    }
    update(payload: Record<string, unknown>): {
      eq(column: string, value: string): Promise<{ error: { message: string } | null }>
    }
  }
}

/** Corps validé par la route (déjà assaini pour les champs texte). */
export type PaymentInitiationInput = {
  reservationId: string
  customerName: string
  customerEmail: string
  roomName?: string | null
  paymentMethod?: ChapChapPaymentMethod | undefined
  /**
   * Conservé pour compatibilité avec les anciens clients, mais VOLONTAIREMENT
   * IGNORÉ : la référence canonique est toujours reconstruite par le serveur.
   */
  bookingReference?: string | null
}

export type PaymentInitiationUrls = {
  notifyUrl: string
  returnUrl: string
  cancelUrl: string
}

export type PaymentInitiationDeps = {
  supabase: SupabaseLike
  apiKey: string
  baseUrl: string
  urls: PaymentInitiationUrls
  /** Injecté par la route (fetchWithTimeout). Défaut : fetch global. */
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
}

export type PaymentInitiationResult =
  | { kind: 'ok'; orderId: string; paymentUrl: string }
  | { kind: 'reservation_not_found' }
  | { kind: 'eligibility_error'; message: string; code: number }
  | { kind: 'provider_error'; status: number; body: string; orderId: string }
  | { kind: 'missing_checkout_url'; orderId: string }
  | { kind: 'provider_timeout' }
  | { kind: 'internal_error' }

/**
 * Miroir de `sanitizeText` (src/lib/chapchap.ts) : aucun import framework côté
 * noyau, mais même normalisation NFKC / purge des contrôles / cap 120.
 */
function sanitizeChapChapDescription(value: string, maxLength = 120): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export async function initiateChapChapPayment(
  input: PaymentInitiationInput,
  deps: PaymentInitiationDeps
): Promise<PaymentInitiationResult> {
  const { supabase, urls } = deps

  // ── 1. Charger la réservation depuis Supabase (source de vérité) ───────────
  const reservationFetch = await supabase
    .from('reservations')
    .select('id, hotel_name, total_price, payment_status, status, currency')
    .eq('id', input.reservationId)
    .single()

  if (reservationFetch.error || !reservationFetch.data) {
    return { kind: 'reservation_not_found' }
  }
  const reservation = reservationFetch.data

  // ── 2. Éligibilité : montant serveur, pas de double paiement, pas d'annulation ──
  const eligibility = evaluateReservationPayment(reservation)
  if (!eligibility.ok) {
    return { kind: 'eligibility_error', message: eligibility.message, code: eligibility.code }
  }
  const amount = eligibility.amount

  // ── 3. Pré-écriture du statut (comportement historique conservé) ────────────
  const paymentMethod = mapPaymentMethod(input.paymentMethod)
  const updateData: Record<string, unknown> = {
    payment_status: 'pending',
    ...(paymentMethod ? { payment_method: paymentMethod } : {}),
  }

  const { error: updateError } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', input.reservationId)

  // Toléré par le flux historique : l'erreur est journalisée, on continue.
  if (updateError) {
    console.error('[chapchap] reservation update error', { reservationId: input.reservationId })
  }

  // ── 4. RÉFÉRENCE CANONIQUE — CORRECTION P1 ──────────────────────────────────
  // L'hôtel vient de reservations.hotel_name (écrit par la RPC reserve_room),
  // jamais d'une valeur fournie par le navigateur. Format préservé :
  // MB-XXXXXXXX / RA-XXXXXXXX (identique aux références déjà en circulation).
  const canonicalReference = buildBookingReference(reservation.hotel_name ?? '', reservation.id)
  // resolveChapChapOrderId applique l'assainissement (contrôles, trim, cap 120)
  // et garde le fallback RES- défensif si la chaîne canonique était vide.
  const orderId = resolveChapChapOrderId(canonicalReference, randomUUID())

  // ── 5. Payload ChapChap ─────────────────────────────────────────────────────
  const chapChapPayload = {
    amount,
    description: sanitizeChapChapDescription(
      `Reservation ${input.roomName || canonicalReference} - ${input.customerName}`,
      120
    ),
    order_id: orderId,
    notify_url: urls.notifyUrl,
    return_url: urls.returnUrl,
    cancel_url: urls.cancelUrl,
    metadata: { reservation_id: input.reservationId, reservation_type: 'room' },
  }

  // ── 6. Appel prestataire (HORS transaction SQL) ─────────────────────────────
  const fetchImpl =
    deps.fetchImpl ?? ((inputUrl: string, init?: RequestInit) => fetch(inputUrl, init))

  let chapChapResponse: Response
  try {
    chapChapResponse = await fetchImpl(`${deps.baseUrl}/ecommerce/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CCP-Api-Key': deps.apiKey,
      },
      body: JSON.stringify(chapChapPayload),
    })
  } catch (error) {
    if (isAbortError(error)) return { kind: 'provider_timeout' }
    return { kind: 'internal_error' }
  }

  const responseText = await chapChapResponse.text().catch(() => '{}')
  let result: Record<string, unknown> = {}
  try {
    result = JSON.parse(responseText) as Record<string, unknown>
  } catch {
    result = {}
  }

  if (!chapChapResponse.ok) {
    return { kind: 'provider_error', status: chapChapResponse.status, body: responseText, orderId }
  }

  const checkoutUrl =
    result?.payment_url || result?.paymentUrl || result?.checkout_url || result?.checkoutUrl

  if (!checkoutUrl || typeof checkoutUrl !== 'string') {
    return { kind: 'missing_checkout_url', orderId }
  }

  return { kind: 'ok', orderId, paymentUrl: checkoutUrl }
}
