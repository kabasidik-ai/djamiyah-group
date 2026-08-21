export const dynamic = 'force-dynamic'

import { AdminShell } from '../_components/AdminShell'
import { listRoomReservations } from '@/lib/adminRoomReservations'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    awaiting_confirmation: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

function paymentBadge(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

function formatDate(dateStr: string): string {
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

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString('fr-FR')} ${currency}`
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function RoomReservationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const { reservations, total, pageSize } = await listRoomReservations(page)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Réservations Chambres</h1>
          <span className="text-sm text-gray-500">{total} au total</span>
        </div>

        {reservations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
            Aucune réservation de chambre pour le moment.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Arrivée</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Départ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Voyageurs</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Prix</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Paiement</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Créée le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {r.first_name} {r.last_name}
                        </div>
                        <div className="text-gray-500 text-xs">{r.email}</div>
                        {r.phone && <div className="text-gray-400 text-xs">{r.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.room_type}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(r.check_in)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(r.check_out)}</td>
                      <td className="px-4 py-3 text-gray-700">{r.guests}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatPrice(r.total_price, r.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${paymentBadge(r.payment_status)}`}
                        >
                          {r.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {r.first_name} {r.last_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {r.room_type} · {r.guests} voyageur{r.guests > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(r.check_in)} → {formatDate(r.check_out)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{formatPrice(r.total_price, r.currency)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentBadge(r.payment_status)}`}
                    >
                      {r.payment_status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{r.email}</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {page > 1 && (
                  <a
                    href={`/admin/room-reservations?page=${page - 1}`}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    ← Précédent
                  </a>
                )}
                <span className="text-sm text-gray-600">
                  Page {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`/admin/room-reservations?page=${page + 1}`}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    Suivant →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}
