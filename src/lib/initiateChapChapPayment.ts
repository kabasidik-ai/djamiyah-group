import { randomUUID } from 'node:crypto'
import {
  buildBookingReference,
  evaluateReservationPayment,
  mapPaymentMethod,
  resolveChapChapOrderId,
  type ChapChapPaymentMethod,
} from './roomPayment.ts'
import {
  resolveChapchapContract,
  safeAllowHeader,
  sanitizeProviderUrl,
} from './chapchapContract.ts'

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

type SingleResponse<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

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
  environment?: 'production' | 'preview' | 'development'
  /** Injecté par la route (fetchWithTimeout). Défaut : fetch global. */
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
}

export type PaymentInitiationResult =
  | { kind: 'ok'; orderId: string; paymentUrl: string }
  | { kind: 'reservation_not_found' }
  | { kind: 'reservation_read_error' }
  | { kind: 'eligibility_error'; message: string; code: number }
  | { kind: 'provider_error'; status: number; allow: string | null; orderId: string }
  | {
      kind: 'provider_redirect'
      status: number
      location: string | null
      allow: string | null
      orderId: string
    }
  | { kind: 'missing_checkout_url'; orderId: string }
  | {
      kind: 'persistence_error'
      orderId: string
      providerOperationId: string | null
    }
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
  // Distinction stricte : `.single()` rend le code PostgREST `PGRST116` pour
  // « zéro ligne » (réservation réellement absente) ; TOUTE AUTRE erreur
  // (401 JWT/clé incohérente, 403 RLS, 500/infra…) est une défaillance de
  // lecture et ne doit PAS être confondue avec une réservation absente.
  const reservationFetch = await supabase
    .from('reservations')
    .select('id, hotel_name, total_price, payment_status, status, currency')
    .eq('id', input.reservationId)
    .single()

  if (reservationFetch.error) {
    const errorCode = reservationFetch.error.code
    if (errorCode === 'PGRST116') {
      // « Zéro ligne » : réservation réellement absente. Journalisée avec son
      // code (réservationId = identifiant interne, pas de donnée personnelle).
      console.info('[chapchap] reservation not found (PGRST116)', {
        reservationId: input.reservationId,
      })
      return { kind: 'reservation_not_found' }
    }
    // Journalisation SERVEUR sécurisée : code + message PostgREST uniquement
    // (aucune clé, aucun secret, aucun en-tête, aucune URL).
    console.error('[chapchap] reservation read failed', {
      reservationId: input.reservationId,
      code: errorCode ?? null,
      message: reservationFetch.error.message,
    })
    return { kind: 'reservation_read_error' }
  }
  if (!reservationFetch.data) {
    return { kind: 'reservation_not_found' }
  }
  const reservation = reservationFetch.data

  // ── 2. Éligibilité : montant serveur, pas de double paiement, pas d'annulation ──
  const eligibility = evaluateReservationPayment(reservation)
  if (!eligibility.ok) {
    return { kind: 'eligibility_error', message: eligibility.message, code: eligibility.code }
  }
  const amount = eligibility.amount
  if (deps.environment === 'preview' && reservation.currency !== 'GNF') {
    return { kind: 'eligibility_error', message: 'Devise de réservation invalide.', code: 400 }
  }
  const contract = resolveChapchapContract(deps.environment ?? 'development')

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
    [contract.callbackField]: urls.notifyUrl,
    return_url: urls.returnUrl,
    cancel_url: urls.cancelUrl,
    metadata: { reservation_id: input.reservationId, reservation_type: 'room' },
  }

  // ── 6. Appel prestataire (HORS transaction SQL) ─────────────────────────────
  const fetchImpl =
    deps.fetchImpl ?? ((inputUrl: string, init?: RequestInit) => fetch(inputUrl, init))

  let chapChapResponse: Response
  try {
    chapChapResponse = await fetchImpl(`${deps.baseUrl}/${contract.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CCP-Api-Key': deps.apiKey,
      },
      body: JSON.stringify(chapChapPayload),
      // Ne pas suivre de redirection ni convertir POST en GET.
      // La redirection éventuelle est restituée et analysée ci-dessous.
      redirect: 'manual' as const,
    })
  } catch (error) {
    if (isAbortError(error)) return { kind: 'provider_timeout' }
    return { kind: 'internal_error' }
  }

  // ── Redirection prestataire (301/302/307/308) — exposer SANS suivre ──────
  // `response.redirected=false` attendue en mode manuel ; `Location`/`Allow`
  // et l'URL finale permettent d'identifier la cible sans créer d'opération.
  if (chapChapResponse.status >= 300 && chapChapResponse.status < 400) {
    // Journalisation sécurisée : statut, domaine et chemin uniquement.
    // Aucune query/session/token, aucun secret, aucune donnée personnelle.
    console.error('[chapchap] provider redirect (POST→GET évité)', {
      status: chapChapResponse.status,
      redirected: chapChapResponse.redirected,
      location: sanitizeProviderUrl(
        chapChapResponse.headers?.get?.('location') ?? null,
        deps.baseUrl
      ),
      url: sanitizeProviderUrl(chapChapResponse.url, deps.baseUrl),
    })
    return {
      kind: 'provider_redirect',
      status: chapChapResponse.status,
      location: chapChapResponse.headers.get('location'),
      allow: chapChapResponse.headers.get('allow'),
      orderId,
    }
  }

  if (!chapChapResponse.ok) {
    return {
      kind: 'provider_error',
      status: chapChapResponse.status,
      allow: safeAllowHeader(chapChapResponse.headers.get('allow')),
      orderId,
    }
  }

  const responseText = await chapChapResponse.text().catch(() => '{}')
  let result: Record<string, unknown> = {}
  try {
    result = JSON.parse(responseText) as Record<string, unknown>
  } catch {
    result = {}
  }

  // ── 7. PERSISTANCE DE LA CORRÉLATION (ordre serveur → prestataire) ────────
  // L'order_id SERVEUR est mémorisé (`chapchap_order_id`) ainsi que
  // l'identifiant d'opération prestataire S'IL EST ÉCHOÉ par le create
  // (champ à confirmer auprès du marchand — best effort, null sinon).
  // La confirmation webhook pourra corréler le paiement à CETTE commande,
  // et rejeter une opération étrangère (correlation_mismatch).
  const providerOperationId =
    typeof result.operation_id === 'string'
      ? result.operation_id
      : typeof result.operationId === 'string'
        ? result.operationId
        : typeof result.request_id === 'string'
          ? result.request_id
          : typeof result.requestId === 'string'
            ? result.requestId
            : null

  const persistence: Record<string, unknown> = { chapchap_order_id: orderId }
  if (providerOperationId) {
    persistence.chapchap_operation_id = providerOperationId
  }
  const { error: persistError } = await supabase
    .from('reservations')
    .update(persistence)
    .eq('id', input.reservationId)

  if (persistError) {
    // CORRECTION P1 (contrôle final) : si la corrélation n'est PAS persistée,
    // on refuse d'exposer une URL de paiement non traçable. L'opération
    // prestataire existe (elle expirera) ; le client doit réessayer — la
    // prochaine initiation créera une nouvelle commande proprement liée.
    // ⚠️ Alerte : perte de corrélation sur une opération réelle.
    console.error('[chapchap] CRITICAL order correlation persist failed — paiement non traçable', {
      reservationId: input.reservationId,
      orderId,
      providerOperationId,
    })
    return { kind: 'persistence_error', orderId, providerOperationId }
  }

  const checkoutUrl =
    result?.payment_url || result?.paymentUrl || result?.checkout_url || result?.checkoutUrl

  if (deps.environment === 'preview') {
    console.info('[chapchap] test provider response', {
      status: chapChapResponse.status,
      paymentUrlReceived: typeof checkoutUrl === 'string' && checkoutUrl.length > 0,
      operationIdReceived: Boolean(providerOperationId),
      correlationPersisted: true,
    })
  }

  if (!checkoutUrl || typeof checkoutUrl !== 'string') {
    return { kind: 'missing_checkout_url', orderId }
  }

  return { kind: 'ok', orderId, paymentUrl: checkoutUrl }
}
