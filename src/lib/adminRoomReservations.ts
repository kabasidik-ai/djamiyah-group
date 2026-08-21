import { createServiceRoleClient } from '@/lib/supabase'
import type { TableRow } from '@/lib/supabase'

/**
 * Couche d'accès admin pour les réservations de chambres.
 * Serveur uniquement : utilise le client service role.
 * Ne jamais importer ce module depuis un Client Component.
 */

export type RoomReservationRow = TableRow<'reservations'>

/**
 * Liste paginée des réservations de chambres.
 */
export async function listRoomReservations(
  page: number,
  pageSize = 20
): Promise<{
  reservations: RoomReservationRow[]
  total: number
  page: number
  pageSize: number
}> {
  const supabase = createServiceRoleClient()

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1

  const { count, error: countError } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.error('[admin] Erreur comptage réservations chambres', countError)
    throw new Error('Erreur serveur lors du comptage des réservations.')
  }

  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('reservations')
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      phone,
      hotel_name,
      room_type,
      check_in,
      check_out,
      guests,
      total_price,
      currency,
      status,
      payment_status,
      payment_method,
      created_at,
      updated_at
      `
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[admin] Erreur liste réservations chambres', error)
    throw new Error('Erreur serveur lors de la lecture des réservations.')
  }

  return {
    reservations: (data ?? []) as RoomReservationRow[],
    total: count ?? 0,
    page: safePage,
    pageSize,
  }
}

/**
 * Compte total des réservations de chambres.
 */
export async function countRoomReservations(): Promise<number> {
  const supabase = createServiceRoleClient()

  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })

  if (error) {
    console.error('[admin] Erreur comptage réservations chambres', error)
    return 0
  }

  return count ?? 0
}
