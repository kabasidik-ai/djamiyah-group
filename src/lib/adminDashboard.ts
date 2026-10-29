import { createServiceRoleClient } from '@/lib/supabase'

/**
 * Données du tableau de bord System Djamiyah.
 * Supabase uniquement — aucune dépendance GHL.
 * Serveur only — ne jamais importer depuis un Client Component.
 */

export interface DashboardStats {
  roomsToConfirm: number
  arrivalsToday: number
  departuresToday: number
  conferencesToProcess: number
  paymentsPending: number
}

export interface RecentActivity {
  id: string
  type: 'chambre' | 'conférence'
  firstName: string
  lastName: string
  label: string
  hotelName: string | null
  date: string
  totalPrice: number
  currency: string
  status: string
  paymentStatus: string
  createdAt: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Charge tous les indicateurs du dashboard en une seule fonction.
 * 5 requêtes count parallèles (head: true = très léger).
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServiceRoleClient()
  const today = todayISO()

  const [roomsToConfirm, arrivalsToday, departuresToday, conferencesToProcess, paymentsPending] =
    await Promise.all([
      // Chambres à confirmer
      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'awaiting_confirmation'])
        .then(({ count }) => count ?? 0),

      // Arrivées aujourd'hui
      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('check_in', today)
        .eq('status', 'confirmed')
        .then(({ count }) => count ?? 0),

      // Départs aujourd'hui
      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('check_out', today)
        .eq('status', 'confirmed')
        .then(({ count }) => count ?? 0),

      // Conférences à traiter
      supabase
        .from('conference_reservations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'awaiting_confirmation'])
        .then(({ count }) => count ?? 0),

      // Paiements en attente (chambres + conférences)
      Promise.all([
        supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'pending')
          .then(({ count }) => count ?? 0),
        supabase
          .from('conference_reservations')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'pending')
          .then(({ count }) => count ?? 0),
      ]).then(([a, b]) => a + b),
    ])

  return {
    roomsToConfirm,
    arrivalsToday,
    departuresToday,
    conferencesToProcess,
    paymentsPending,
  }
}

/**
 * Activité récente : dernières réservations (chambres + conférences) fusionnées.
 * Maximum 8 éléments, triés par date de création décroissante.
 * 2 requêtes seulement (1 par table), fusionnées côté serveur.
 */
export async function getRecentActivity(limit = 8): Promise<RecentActivity[]> {
  const supabase = createServiceRoleClient()

  const [roomsRes, confRes] = await Promise.all([
    supabase
      .from('reservations')
      .select(
        'id, first_name, last_name, room_type, hotel_name, check_in, total_price, currency, status, payment_status, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit),

    supabase
      .from('conference_reservations')
      .select(
        'id, first_name, last_name, event_type, event_date, total_price, currency, status, payment_status, created_at, conference_rooms (name)'
      )
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  const rooms: RecentActivity[] = (roomsRes.data ?? []).map((r) => ({
    id: r.id,
    type: 'chambre' as const,
    firstName: r.first_name,
    lastName: r.last_name,
    label: r.room_type ?? 'Chambre',
    hotelName: r.hotel_name ?? null,
    date: r.check_in,
    totalPrice: r.total_price,
    currency: r.currency,
    status: r.status,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  }))

  const conferences: RecentActivity[] = (confRes.data ?? []).map((r) => {
    const roomData = r.conference_rooms as { name: string } | null
    return {
      id: r.id,
      type: 'conférence' as const,
      firstName: r.first_name,
      lastName: r.last_name,
      label: roomData?.name ?? r.event_type ?? 'Conférence',
      hotelName: null,
      date: r.event_date,
      totalPrice: r.total_price,
      currency: r.currency,
      status: r.status,
      paymentStatus: r.payment_status,
      createdAt: r.created_at,
    }
  })

  return [...rooms, ...conferences]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}
