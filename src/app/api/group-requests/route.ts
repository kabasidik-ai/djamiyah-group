// ============================================================
// POST /api/group-requests — Collecte des demandes Groupes & Séminaires
//
// Collecte UNIQUEMENT : la demande est enregistrée (référence de
// dossier + clé d'idempotence) en statut « reçue ». La possibilité
// d'utiliser GHL est laissée à une phase ultérieure, explicitement
// configurée et testée. Aucune confirmation n'est émise ici.
// ============================================================

import { NextResponse, after } from 'next/server'
import { createServiceRoleClient, isSupabaseServiceConfigured } from '@/lib/supabase'
import {
  createGroupRequest,
  GroupRequestError,
  GROUP_REQUEST_SUCCESS_MESSAGE,
} from '@/lib/groupRequests'
import { groupRequestSchema, type GroupRequestInput } from '@/lib/schemas/groupRequest'
import { checkRateLimit, ensureSameOrigin, getClientIp } from '@/lib/chapchap'
import { isGroupGhlSyncEnabled, runGroupGhlSync } from '@/lib/groups/groupGhlSyncServer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // ── Rate limiting : 10 demandes/IP/heure ──
  const ip = getClientIp(request)
  const rate = checkRateLimit('group-requests', ip, 10, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json(
      { message: 'Trop de demandes. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
  }

  // ── Same-origin check ──
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'
  if (!ensureSameOrigin(request, siteUrl)) {
    return NextResponse.json({ message: 'Requête non autorisée.' }, { status: 403 })
  }

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

    const parsed = groupRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Données de demande invalides.' },
        { status: 400 }
      )
    }

    // Le client ne fournit pas référence/idempotence : on crée une
    // nouvelle demande à partir du payload validé (une clé d'idempotence
    // est générée côté serveur pour garantir l'unicité).
    const result = await createGroupRequest(
      createServiceRoleClient(),
      parsed.data as GroupRequestInput
    )

    // Programmer la synchronisation Groupe → GHL APRÈS la réponse (non bloquant).
    // Ne s'exécute que si GHL_GROUP_SYNC_ENABLED === 'true' (absent/false pendant
    // cette phase → le dossier reste `pending`, aucune écriture GHL).
    after(() => {
      if (!isGroupGhlSyncEnabled()) return
      runGroupGhlSync(result.id).catch((err) => {
        console.error('[group-requests] synchronisation asynchrone échouée', err?.message ?? err)
      })
    })

    return NextResponse.json(
      {
        success: true,
        reference: result.reference,
        status: 'received',
        source: result.source,
        message: GROUP_REQUEST_SUCCESS_MESSAGE,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof GroupRequestError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[group-requests] Unexpected error', error)
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 })
  }
}
