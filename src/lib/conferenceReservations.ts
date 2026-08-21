import type { TypedSupabaseClient } from '@/lib/supabase'
import type { TableInsert } from '@/lib/supabase'
import {
  ACTIVE_CONFERENCE_RESERVATION_STATUSES,
  isDateTodayOrLater,
  type ConferenceAvailabilityInput,
  type ConferenceReservationInput,
} from '@/lib/schemas/conferenceReservation'

type ConferenceReservationInsert = TableInsert<'conference_reservations'>

export type ConferenceRoomSummary = {
  id: string
  name: string
  capacity: number
  pricePerDay: number
  description: string | null
  features: string[]
  images: string[]
  isAvailable: boolean
}

export type ConferenceAvailabilityResult = {
  available: boolean
  reason: 'available' | 'past_date' | 'room_unavailable' | 'capacity_exceeded' | 'already_booked'
  room: ConferenceRoomSummary
  totalPrice: number
}

export class ConferenceReservationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_DATE'
      | 'ROOM_NOT_FOUND'
      | 'ROOM_UNAVAILABLE'
      | 'CAPACITY_EXCEEDED'
      | 'ALREADY_BOOKED'
      | 'DATABASE_ERROR',
    public readonly status: number
  ) {
    super(message)
    this.name = 'ConferenceReservationError'
  }
}

function toRoomSummary(room: {
  id: string
  name: string
  capacity: number
  price_per_day: number
  description: string | null
  features: string[]
  images: string[]
  is_available: boolean
}): ConferenceRoomSummary {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    pricePerDay: room.price_per_day,
    description: room.description,
    features: room.features,
    images: room.images,
    isAvailable: room.is_available,
  }
}

export async function checkConferenceAvailability(
  supabase: TypedSupabaseClient,
  input: ConferenceAvailabilityInput
): Promise<ConferenceAvailabilityResult> {
  if (!isDateTodayOrLater(input.eventDate)) {
    throw new ConferenceReservationError(
      "La date de l'événement doit être aujourd'hui ou dans le futur.",
      'INVALID_DATE',
      400
    )
  }

  const { data: room, error: roomError } = await supabase
    .from('conference_rooms')
    .select('id, name, capacity, price_per_day, description, features, images, is_available')
    .eq('id', input.conferenceRoomId)
    .maybeSingle()

  if (roomError) {
    throw new ConferenceReservationError(
      'Impossible de vérifier la salle pour le moment.',
      'DATABASE_ERROR',
      500
    )
  }

  if (!room) {
    throw new ConferenceReservationError('Salle de conférence introuvable.', 'ROOM_NOT_FOUND', 404)
  }

  const roomSummary = toRoomSummary(room)

  if (!room.is_available) {
    return {
      available: false,
      reason: 'room_unavailable',
      room: roomSummary,
      totalPrice: room.price_per_day,
    }
  }

  if (input.participants !== undefined && input.participants > room.capacity) {
    return {
      available: false,
      reason: 'capacity_exceeded',
      room: roomSummary,
      totalPrice: room.price_per_day,
    }
  }

  // Une réservation bloque la salle si :
  // - son status est actif (pending / awaiting_confirmation / confirmed)
  // ET
  // - elle est payée (payment_status = paid)
  // - OU son hold n'a pas expiré (hold_expires_at > maintenant)
  // - OU hold_expires_at est NULL (compatibilité avec les réservations historiques)
  const now = new Date().toISOString()

  const { count, error: conflictError } = await supabase
    .from('conference_reservations')
    .select('id', { count: 'exact', head: true })
    .eq('conference_room_id', input.conferenceRoomId)
    .eq('event_date', input.eventDate)
    .in('status', [...ACTIVE_CONFERENCE_RESERVATION_STATUSES])
    .or(`payment_status.eq.paid,hold_expires_at.is.null,hold_expires_at.gt.${now}`)

  if (conflictError) {
    throw new ConferenceReservationError(
      'Impossible de vérifier la disponibilité pour le moment.',
      'DATABASE_ERROR',
      500
    )
  }

  return {
    available: (count ?? 0) === 0,
    reason: (count ?? 0) === 0 ? 'available' : 'already_booked',
    room: roomSummary,
    totalPrice: room.price_per_day,
  }
}

export async function createConferenceReservation(
  supabase: TypedSupabaseClient,
  input: ConferenceReservationInput
) {
  const availability = await checkConferenceAvailability(supabase, input)

  if (!availability.available) {
    const messages = {
      room_unavailable: "Cette salle n'est pas ouverte à la réservation.",
      capacity_exceeded: `Cette salle accueille au maximum ${availability.room.capacity} participants.`,
      already_booked: 'Cette salle est déjà réservée à cette date.',
      past_date: "La date de l'événement doit être aujourd'hui ou dans le futur.",
      available: 'La salle est disponible.',
    } as const

    const code =
      availability.reason === 'capacity_exceeded'
        ? 'CAPACITY_EXCEEDED'
        : availability.reason === 'room_unavailable'
          ? 'ROOM_UNAVAILABLE'
          : 'ALREADY_BOOKED'

    throw new ConferenceReservationError(messages[availability.reason], code, 409)
  }

  // Hold de 30 minutes : la salle est temporairement réservée
  // pendant que le client finalise le paiement.
  const HOLD_DURATION_MS = 30 * 60 * 1000
  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS).toISOString()

  const reservation: ConferenceReservationInsert = {
    conference_room_id: availability.room.id,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    event_date: input.eventDate,
    participants: input.participants,
    event_type: input.eventType,
    special_requests: input.specialRequests || null,
    total_price: availability.room.pricePerDay,
    currency: 'GNF',
    status: 'awaiting_confirmation',
    payment_status: 'pending',
    payment_method: null,
    hold_expires_at: holdExpiresAt,
  }

  const { data, error } = await supabase
    .from('conference_reservations')
    .insert(reservation)
    .select('id, status, payment_status, total_price, currency, created_at')
    .single()

  if (error?.code === '23505') {
    throw new ConferenceReservationError(
      'Cette salle vient d’être réservée à cette date. Choisissez une autre date.',
      'ALREADY_BOOKED',
      409
    )
  }

  if (error || !data) {
    throw new ConferenceReservationError(
      "Impossible d'enregistrer la réservation pour le moment.",
      'DATABASE_ERROR',
      500
    )
  }

  return {
    reservation: data,
    room: availability.room,
  }
}
