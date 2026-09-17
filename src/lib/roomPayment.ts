import type { Database } from '@/types/database'

export type ChapChapPaymentMethod = 'orange_money' | 'mtn_momo' | 'wave' | 'card' | 'paycard' | 'cc'

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
