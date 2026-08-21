import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'

const querySchema = z.object({
  id: z.string().uuid(),
})

/**
 * GET /api/conference-reservations/status?id=<uuid>
 *
 * Retourne le statut de paiement d'une réservation de salle de conférence.
 * Ne retourne aucune donnée personnelle — uniquement ce qui est nécessaire
 * pour que la success page affiche le bon état.
 */
export async function GET(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ message: 'Service indisponible.' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({ id: searchParams.get('id') })

  if (!parsed.success) {
    return NextResponse.json({ message: 'Paramètre id invalide.' }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('conference_reservations')
      .select(
        'id, payment_status, status, total_price, currency, conference_room_id, event_date, participants'
      )
      .eq('id', parsed.data.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ message: 'Réservation introuvable.' }, { status: 404 })
    }

    // Charger le nom de la salle
    const { data: room } = await supabase
      .from('conference_rooms')
      .select('name')
      .eq('id', data.conference_room_id)
      .single()

    return NextResponse.json({
      reservationId: data.id,
      paymentStatus: data.payment_status,
      reservationStatus: data.status,
      totalPrice: data.total_price,
      currency: data.currency,
      roomName: room?.name || null,
      eventDate: data.event_date,
      participants: data.participants,
      reservationType: 'conference',
    })
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 })
  }
}
