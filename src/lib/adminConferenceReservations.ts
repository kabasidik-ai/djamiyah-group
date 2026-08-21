import { createServiceRoleClient } from '@/lib/supabase'
import type { TableRow } from '@/lib/supabase'

/**
 * Couche d'accès admin pour les réservations de salles de conférence.
 * Serveur uniquement : utilise le client service role (RLS service_role only).
 * Ne jamais importer ce module depuis un Client Component.
 */

export type ConferenceReservationRow = TableRow<'conference_reservations'>

export type ConferenceReservationWithRoom = ConferenceReservationRow & {
  conference_rooms: {
    name: string
    capacity: number
  } | null
}

/**
 * Transitions de statut autorisées pour le staff.
 * Toute autre transition est refusée côté serveur.
 */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  awaiting_confirmation: ['confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
}

export function isTransitionAllowed(currentStatus: string, nextStatus: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus]
  return Boolean(allowed?.includes(nextStatus))
}

export type ReservationAction = 'confirmed' | 'cancelled'

export type UpdateReservationStatusResult =
  | { ok: true; reservation: ConferenceReservationRow }
  | { ok: false; error: string }

/**
 * Applique une transition de statut (Confirmer / Refuser) sur une
 * réservation de conférence.
 *
 * Sécurité :
 * - Appelée uniquement depuis des Server Actions derrière requireAdmin()
 * - UPDATE conditionnel sur le statut courant (garde-fou concurrentiel)
 * - Ne touche JAMAIS payment_status : le paiement reste piloté
 *   exclusivement par les webhooks ChapChap.
 */
export async function updateConferenceReservationStatus(
  reservationId: string,
  action: ReservationAction
): Promise<UpdateReservationStatusResult> {
  const supabase = createServiceRoleClient()

  const { data: current, error: fetchError } = await supabase
    .from('conference_reservations')
    .select('id, status')
    .eq('id', reservationId)
    .maybeSingle()

  if (fetchError) {
    console.error('[admin] Erreur lecture réservation', fetchError)
    return { ok: false, error: 'Erreur serveur lors de la lecture de la réservation.' }
  }

  if (!current) {
    return { ok: false, error: 'Réservation introuvable.' }
  }

  if (!isTransitionAllowed(current.status, action)) {
    return {
      ok: false,
      error: `Transition non autorisée : « ${current.status} » → « ${action} ».`,
    }
  }

  // UPDATE conditionnel : si le statut a changé entre-temps, 0 ligne affectée.
  const { data: updated, error: updateError } = await supabase
    .from('conference_reservations')
    .update({ status: action })
    .eq('id', reservationId)
    .eq('status', current.status)
    .select('id, status, payment_status, updated_at')
    .single()

  if (updateError) {
    console.error('[admin] Erreur mise à jour réservation', updateError)
    return { ok: false, error: 'Erreur serveur lors de la mise à jour.' }
  }

  if (!updated) {
    return {
      ok: false,
      error: 'La réservation a été modifiée entre-temps. Rechargez la page.',
    }
  }

  return { ok: true, reservation: updated as ConferenceReservationRow }
}

/**
 * Liste paginée des réservations de conférence avec le nom de la salle.
 */
export async function listConferenceReservations(
  page: number,
  pageSize = 20
): Promise<{
  reservations: ConferenceReservationWithRoom[]
  total: number
  page: number
  pageSize: number
}> {
  const supabase = createServiceRoleClient()

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1

  const { count, error: countError } = await supabase
    .from('conference_reservations')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.error('[admin] Erreur comptage réservations', countError)
    throw new Error('Erreur serveur lors du comptage des réservations.')
  }

  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('conference_reservations')
    .select(
      `
      id,
      conference_room_id,
      first_name,
      last_name,
      email,
      phone,
      event_date,
      participants,
      event_type,
      special_requests,
      total_price,
      currency,
      status,
      payment_status,
      payment_method,
      transaction_id,
      created_at,
      updated_at,
      conference_rooms (
        name,
        capacity
      )
      `
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[admin] Erreur liste réservations', error)
    throw new Error('Erreur serveur lors de la lecture des réservations.')
  }

  return {
    reservations: (data ?? []) as unknown as ConferenceReservationWithRoom[],
    total: count ?? 0,
    page: safePage,
    pageSize,
  }
}

/**
 * Détail d'une réservation de conférence avec le nom de la salle.
 */
export async function getConferenceReservation(
  reservationId: string
): Promise<ConferenceReservationWithRoom | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('conference_reservations')
    .select(
      `
      id,
      conference_room_id,
      first_name,
      last_name,
      email,
      phone,
      event_date,
      participants,
      event_type,
      special_requests,
      total_price,
      currency,
      status,
      payment_status,
      payment_method,
      transaction_id,
      created_at,
      updated_at,
      conference_rooms (
        name,
        capacity
      )
      `
    )
    .eq('id', reservationId)
    .maybeSingle()

  if (error) {
    console.error('[admin] Erreur détail réservation', error)
    throw new Error('Erreur serveur lors de la lecture de la réservation.')
  }

  return (data as unknown as ConferenceReservationWithRoom) ?? null
}
