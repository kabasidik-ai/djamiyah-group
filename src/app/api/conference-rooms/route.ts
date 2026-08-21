import { NextResponse } from 'next/server'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'

export async function GET() {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ message: 'Service indisponible.' }, { status: 503 })
  }

  const { data, error } = await createServiceRoleClient()
    .from('conference_rooms')
    .select('id, name, capacity, price_per_day, description, features, images, is_available')
    .order('capacity', { ascending: true })

  if (error) {
    console.error('[conference-rooms] Supabase read error', { code: error.code })
    return NextResponse.json({ message: 'Impossible de charger les salles.' }, { status: 500 })
  }

  return NextResponse.json({
    rooms: data.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      pricePerDay: room.price_per_day,
      description: room.description,
      features: room.features,
      images: room.images,
      isAvailable: room.is_available,
    })),
  })
}
