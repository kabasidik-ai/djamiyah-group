// ============================================================
// GET  /api/contact?id=xxx — Récupération d'un contact GHL
// POST /api/contact       — Création / recherche de contact
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateContact, getContact } from '@/lib/ghl/client'
import { logger } from '@/lib/utils/logger'
import type { GHLContactCreate } from '@/lib/ghl/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const contactId = req.nextUrl.searchParams.get('id')

  if (!contactId) {
    return NextResponse.json({ error: 'Paramètre id requis' }, { status: 400 })
  }

  try {
    const contact = await getContact(contactId)
    return NextResponse.json({ success: true, contact })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    logger.error('GET /api/contact erreur', { contactId, error: msg })
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: Partial<Omit<GHLContactCreate, 'locationId'>>

  try {
    payload = (await req.json()) as typeof payload
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { firstName, lastName, email, phone, source, tags } = payload

  if (!email && !phone && !firstName) {
    return NextResponse.json(
      { error: 'Au moins un champ parmi email, phone ou firstName est requis.' },
      { status: 400 }
    )
  }

  try {
    const contact = await findOrCreateContact({
      firstName,
      lastName,
      email,
      phone,
      source: source ?? 'Concierge IA - Web',
      tags: tags ?? ['concierge-ia'],
    })

    logger.info('Contact trouvé/créé', { contactId: contact.id })
    return NextResponse.json({ success: true, contact }, { status: 200 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    logger.error('POST /api/contact erreur', { error: msg })
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
