/**
 * Labels et badges centralisés pour System Djamiyah.
 * Terminologie gérant hôtelier — aucun terme technique.
 */

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  awaiting_confirmation: 'À confirmer',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
}

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  awaiting_confirmation: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
}

export function reservationStatusLabel(status: string): string {
  return RESERVATION_STATUS_LABELS[status] ?? status
}

export function reservationStatusColor(status: string): string {
  return RESERVATION_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échec',
  refunded: 'Remboursé',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status
}

export function paymentStatusColor(status: string): string {
  return PAYMENT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

export function formatDateFR(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatPriceFR(price: number, currency: string): string {
  return `${price.toLocaleString('fr-FR')} ${currency}`
}

export function shortRef(id: string): string {
  return id.slice(0, 8).toUpperCase()
}
