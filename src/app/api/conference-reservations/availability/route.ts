import { NextResponse } from 'next/server'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'
import {
  checkConferenceAvailability,
  ConferenceReservationError,
} from '@/lib/conferenceReservations'
import { conferenceAvailabilitySchema } from '@/lib/schemas/conferenceReservation'

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

    const parsed = conferenceAvailabilitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Données invalides.' },
        { status: 400 }
      )
    }

    const availability = await checkConferenceAvailability(createServiceRoleClient(), parsed.data)
    return NextResponse.json(availability)
  } catch (error) {
    if (error instanceof ConferenceReservationError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[conference-availability] Unexpected error', error)
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 })
  }
}
