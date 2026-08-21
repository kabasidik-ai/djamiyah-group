import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'

const querySchema = z.object({
  id: z.string().uuid(),
})

/**
 * GET /api/reservations/status?id=<uuid>
 *
 * Retourne le statut de paiement d'une réservation (chambre).
 * Ne retourne aucune donnée sensible — uniquement ce qui est nécessaire
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
      .from('reservations')
      .select('id, payment_status, status, room_type, check_in, check_out, total_price, currency')
      .eq('id', parsed.data.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ message: 'Réservation introuvable.' }, { status: 404 })
    }

    return NextResponse.json({
      reservationId: data.id,
      paymentStatus: data.payment_status,
      reservationStatus: data.status,
      roomType: data.room_type,
      checkIn: data.check_in,
      checkOut: data.check_out,
      totalPrice: data.total_price,
      currency: data.currency,
    })
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 })
  }
}
