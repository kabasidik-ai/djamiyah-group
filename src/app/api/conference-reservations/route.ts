import { NextResponse } from 'next/server'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'
import {
  createConferenceReservation,
  ConferenceReservationError,
} from '@/lib/conferenceReservations'
import { conferenceReservationSchema } from '@/lib/schemas/conferenceReservation'

export async function POST(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ message: 'Service indisponible.' }, { status: 503 })
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 })
    }

    const parsed = conferenceReservationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Données de réservation invalides.' },
        { status: 400 }
      )
    }

    const result = await createConferenceReservation(createServiceRoleClient(), parsed.data)

    return NextResponse.json(
      {
        success: true,
        reservationId: result.reservation.id,
        status: result.reservation.status,
        paymentStatus: result.reservation.payment_status,
        totalPrice: result.reservation.total_price,
        currency: result.reservation.currency,
        room: result.room,
        message: 'Votre demande de réservation est enregistrée et attend confirmation.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ConferenceReservationError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[conference-reservations] Unexpected error', error)
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 })
  }
}
