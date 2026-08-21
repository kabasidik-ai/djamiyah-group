import { NextResponse } from 'next/server'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'
import { reservationServerSchema } from '@/lib/schemas/reservationServer'

/**
 * Type de retour de la RPC reserve_room.
 */
type ReserveRoomResult = {
  ok: boolean
  code?: string
  message?: string
  reservation_id?: string
  total_price?: number
  currency?: string
  status?: string
  nights?: number
  price_per_night?: number
  room_name?: string
  created_at?: string
  active_count?: number
  total_units?: number
}

/**
 * Mapping code RPC → HTTP status.
 */
function rpcCodeToHttpStatus(code: string): number {
  switch (code) {
    case 'INVALID_DATES':
    case 'PAST_DATE':
      return 400
    case 'ROOM_NOT_FOUND':
      return 404
    case 'NO_AVAILABILITY':
      return 409
    default:
      return 500
  }
}

export async function POST(request: Request) {
  // ── Vérification config Supabase ──────────────────────────────────────────
  if (!isSupabaseServiceConfigured()) {
    console.error('[reservations/route] SUPABASE_SERVICE_ROLE_KEY manquant.')
    return NextResponse.json(
      {
        message: "Configuration serveur incomplète. Veuillez contacter l'administrateur.",
        code: 'MISSING_SERVICE_ROLE_KEY',
      },
      { status: 503 }
    )
  }

  try {
    // ── Parse le body JSON ────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 })
    }

    // ── Validation Zod côté serveur ───────────────────────────────────────────
    const parsed = reservationServerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message || 'Données de réservation invalides.',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const data = parsed.data
    const guests = data.adults + data.children

    // ── Appel RPC atomique reserve_room ───────────────────────────────────────
    // Le prix est calculé par PostgreSQL à partir de rooms.price_per_night.
    // totalPrice envoyé par le client est IGNORÉ.
    const supabase = createServiceRoleClient()

    const { data: rpcResult, error: rpcError } = await supabase.rpc('reserve_room', {
      p_room_name: data.roomType,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_email: data.email,
      p_phone: data.phone,
      p_hotel_name: data.hotelName,
      p_check_in: data.checkIn,
      p_check_out: data.checkOut,
      p_guests: guests,
    })

    if (rpcError) {
      console.error('[reservations/route] RPC error:', rpcError)
      return NextResponse.json(
        {
          message: "Erreur serveur lors de l'enregistrement de la réservation.",
          code: 'RPC_ERROR',
        },
        { status: 500 }
      )
    }

    // ── Traiter la réponse de la RPC ──────────────────────────────────────────
    const result = rpcResult as ReserveRoomResult

    if (!result.ok) {
      const httpStatus = rpcCodeToHttpStatus(result.code ?? 'INTERNAL_ERROR')
      return NextResponse.json(
        {
          message: result.message ?? 'Erreur lors de la réservation.',
          code: result.code,
        },
        { status: httpStatus }
      )
    }

    // ── Succès ────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      reservationId: result.reservation_id,
      totalPrice: result.total_price,
      currency: result.currency,
      status: result.status,
      nights: result.nights,
      pricePerNight: result.price_per_night,
      roomName: result.room_name,
      message: 'Demande de réservation enregistrée avec succès.',
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'unknown_error'
    console.error('[reservations/route] Unexpected error:', errMsg)
    return NextResponse.json(
      {
        message: "Erreur serveur lors de l'enregistrement de la réservation.",
        code: 'UNEXPECTED_ERROR',
      },
      { status: 500 }
    )
  }
}
