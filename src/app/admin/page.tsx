export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AdminShell } from './_components/AdminShell'
import { countRoomReservations } from '@/lib/adminRoomReservations'
import { createServiceRoleClient } from '@/lib/supabase'

async function countConferenceReservations(): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count, error } = await supabase
    .from('conference_reservations')
    .select('id', { count: 'exact', head: true })

  if (error) {
    console.error('[admin] Erreur comptage réservations conférences', error)
    return 0
  }
  return count ?? 0
}

export default async function AdminDashboardPage() {
  const [roomCount, conferenceCount] = await Promise.all([
    countRoomReservations(),
    countConferenceReservations(),
  ])

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Bloc Chambres */}
          <Link
            href="/admin/room-reservations"
            className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Réservations Chambres</h2>
              <span className="text-3xl">🏨</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{roomCount}</p>
            <p className="text-sm text-gray-500 mt-1">réservation{roomCount !== 1 ? 's' : ''}</p>
            <span className="inline-block mt-4 text-sm font-medium text-amber-700">
              Voir la liste →
            </span>
          </Link>

          {/* Bloc Salles de conférence */}
          <Link
            href="/admin/conference-reservations"
            className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Réservations Salles</h2>
              <span className="text-3xl">🏛️</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{conferenceCount}</p>
            <p className="text-sm text-gray-500 mt-1">
              réservation{conferenceCount !== 1 ? 's' : ''}
            </p>
            <span className="inline-block mt-4 text-sm font-medium text-amber-700">
              Voir la liste →
            </span>
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}
