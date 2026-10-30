import type { Database } from '@/types/database'

export type ChapChapPaymentMethod = 'orange_money' | 'mtn_momo' | 'wave' | 'card' | 'paycard' | 'cc'

function sanitizePaymentReference(value: string, maxLength = 120): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function buildBookingReference(hotelName: string, reservationId: string): string {
  const prefix = hotelName === 'Hôtel Rama' ? 'RA' : 'MB'
  return prefix + '-' + reservationId.slice(0, 8).toUpperCase()
}

export function resolveChapChapOrderId(
  bookingReference: string | undefined,
  fallbackId: string
): string {
  const sanitizedReference = sanitizePaymentReference(bookingReference ?? '')
  return sanitizedReference || sanitizePaymentReference('RES-' + fallbackId)
}

/**
 * Évaluation pure de l'éligibilité d'une réservation chambre au paiement.
 * - paid → refusé (pas de double paiement)
 * - cancelled → refusé
 * - montant invalide ou nul → refusé
 * Retourne l'amount serveur en cas de succès (source de vérité).
 */
export function evaluateReservationPayment(reservation: {
  payment_status?: string | null
  status?: string | null
  total_price?: number | null
}): { ok: true; amount: number } | { ok: false; message: string; code: number } {
  if (!reservation) {
    return { ok: false, message: 'Réservation introuvable.', code: 404 }
  }
  if (reservation.payment_status === 'paid') {
    return { ok: false, message: 'Cette réservation est déjà payée.', code: 409 }
  }
  if (reservation.status === 'cancelled') {
    return { ok: false, message: 'Cette réservation a été annulée.', code: 409 }
  }
  const amount = reservation.total_price
  if (!amount || amount <= 0) {
    return { ok: false, message: 'Montant de réservation invalide.', code: 400 }
  }
  return { ok: true, amount }
}

export function mapPaymentMethod(
  method: ChapChapPaymentMethod | undefined
): Database['public']['Enums']['payment_method_enum'] | null {
  if (!method) return null
  if (method === 'orange_money') return 'orange_money'
  if (method === 'mtn_momo') return 'mtn_momo'
  return 'card'
}
