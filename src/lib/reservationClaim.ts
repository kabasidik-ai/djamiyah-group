import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Preuve de possession d'une réservation (parcours sans compte).
 *
 * Jeton de réclamation HMAC-SHA256 DÉTERMINISTE, dérivé d'un secret serveur
 * (`RESERVATION_CLAIM_SECRET`). Jamais exposé au navigateur côté code, JAMAIS
 * journalisé, JAMAIS placé dans une URL : il ne circule que dans le corps JSON
 * de création de réservation puis par en-tête `X-Reservation-Claim`.
 *
 * Le jeton est une PREUVE DE POSSESSION, PAS une preuve de paiement : le
 * statut financier de la réservation reste défini exclusivement par le webhook
 * (HMAC ChapChap) et la base.
 *
 * Échec fermé : si le secret n'est pas configuré, toutes les opérations
 * protégées refusent (503) — aucune délivrance ni vérification ne dégrade.
 */

const CLAIM_PREFIX = 'djamiyah:reservation-claim:v1:'
// Longueur du HMAC-SHA256 hexadécimal (64) — validée avant comparaison.
const CLAIM_HEX_LENGTH = 64

export function getReservationClaimSecret(): string | null {
  const secret = process.env.RESERVATION_CLAIM_SECRET
  return typeof secret === 'string' && secret.length >= 16 ? secret : null
}

export function issueReservationClaim(reservationId: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(CLAIM_PREFIX + reservationId)
    .digest('hex')
}

/**
 * Comparaison en temps constant sur des tampons de longueur contrôlée :
 * le format du jeton est validé (hex 64) avant `timingSafeEqual`, ce qui évite
 * tout écart de longueur et toute fuite par canal auxiliaire.
 */
export function verifyReservationClaim(
  reservationId: string,
  token: string | null | undefined,
  secret: string
): boolean {
  const hexLength = CLAIM_HEX_LENGTH
  if (typeof token !== 'string' || !new RegExp(`^[a-f0-9]{${hexLength}}$`, 'i').test(token)) {
    return false
  }
  const expected = Buffer.from(issueReservationClaim(reservationId, secret), 'utf8')
  const provided = Buffer.from(token, 'utf8')
  return timingSafeEqual(expected, provided)
}

export type ReservationClaimCheck = { allow: true } | { allow: false; status: 401 | 503 }

/**
 * Garde réutilisable par les routes protégées (status de réservation, initiation
 * de paiement) : lit l'en-tête `X-Reservation-Claim` et le vérifie contre
 * l'UUID de réservation. 503 si le secret serveur est absent ; 401 sinon.
 */
export function checkReservationClaim(
  headers: Headers,
  reservationId: string
): ReservationClaimCheck {
  const secret = getReservationClaimSecret()
  if (!secret) {
    return { allow: false, status: 503 }
  }
  const token = headers.get('x-reservation-claim')
  if (!verifyReservationClaim(reservationId, token, secret)) {
    return { allow: false, status: 401 }
  }
  return { allow: true }
}
