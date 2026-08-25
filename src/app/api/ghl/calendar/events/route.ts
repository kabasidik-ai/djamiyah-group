import { NextResponse } from 'next/server'
import { listCalendarEvents } from '@/lib/ghl/client'
import { requireAdmin } from '@/lib/adminAuth'

// Lecture seule des événements d'agenda (calendrier GHL cible)
export const runtime = 'nodejs'

export async function GET() {
  await requireAdmin()

  const calendarId = process.env.NEXT_PUBLIC_GHL_CALENDAR_ID
  const locationId = process.env.GHL_LOCATION_ID

  if (!locationId) {
    return NextResponse.json({ error: 'GHL_LOCATION_ID manquant.' }, { status: 500 })
  }

  try {
    const events = await listCalendarEvents({ calendarId, locationId })
    return NextResponse.json({ events })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
