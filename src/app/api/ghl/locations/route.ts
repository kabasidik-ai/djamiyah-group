// ============================================================
// GET /api/ghl/locations
// Liste toutes les locations GHL disponibles
// Usage : configurer GHL_LOCATION_ID dans Vercel env
// ============================================================

import { NextResponse } from 'next/server'
import { listLocations, getLocation } from '@/lib/ghl/client'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

interface LocationsApiResponse {
  success: boolean
  locations: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    city?: string
    country?: string
  }>
  current?: {
    id: string
    name: string
  }
  error?: string
}

export async function GET(): Promise<NextResponse<LocationsApiResponse>> {
  try {
    const [allLocations, currentLocation] = await Promise.allSettled([
      listLocations(),
      getLocation(),
    ])

    const locations =
      allLocations.status === 'fulfilled'
        ? allLocations.value.map((l) => ({
            id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone,
            city: l.city,
            country: l.country,
          }))
        : []

    const current =
      currentLocation.status === 'fulfilled'
        ? { id: currentLocation.value.id, name: currentLocation.value.name }
        : undefined

    logger.info('Locations GHL listées', { count: locations.length })

    return NextResponse.json({ success: true, locations, current })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('Erreur listing locations GHL', { error: message })

    return NextResponse.json(
      {
        success: false,
        locations: [],
        error: process.env.NODE_ENV === 'development' ? message : 'Erreur serveur',
      },
      { status: 500 }
    )
  }
}
