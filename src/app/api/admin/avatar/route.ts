// ============================================================
// PUT /api/admin/avatar — Mise à jour de l'avatar Salematou
// Protégé par ADMIN_SECRET_KEY (header x-admin-key)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

interface AdminAvatarRequest {
  url: string
}

interface AdminAvatarResponse {
  success: boolean
  message?: string
  error?: string
}

function isAuthorized(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY
  if (!adminKey) return false
  return req.headers.get('x-admin-key') === adminKey
}

export async function PUT(req: NextRequest): Promise<NextResponse<AdminAvatarResponse>> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
  }

  let body: AdminAvatarRequest
  try {
    body = (await req.json()) as AdminAvatarRequest
  } catch {
    return NextResponse.json({ success: false, error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { url } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Champ `url` requis (string)' },
      { status: 400 }
    )
  }

  // Valider que l'URL est une URL valide (HTTPS recommandé)
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Protocole invalide')
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'URL invalide. Format attendu: https://...' },
      { status: 400 }
    )
  }

  try {
    const { isSupabaseServiceConfigured, createServiceRoleClient } = await import('@/lib/supabase')

    if (!isSupabaseServiceConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Supabase non configuré. ' +
            'Ajoutez SUPABASE_SERVICE_ROLE_KEY dans Vercel et relancez.',
        },
        { status: 503 }
      )
    }

    const db = createServiceRoleClient()
    const { error } = await db
      .from('site_config')
      .upsert(
        { key: 'salematou_avatar_url', value: url, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) throw new Error(error.message)

    logger.info('Avatar Salematou mis à jour', { url })

    return NextResponse.json({
      success: true,
      message: `Avatar mis à jour. URL: ${url}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('Erreur mise à jour avatar', { error: message })

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// GET — Lecture admin (avec auth)
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
  }

  // Déléguer à l'endpoint public
  const publicUrl = `${req.nextUrl.origin}/api/config/avatar`
  const res = await fetch(publicUrl)
  const data = await res.json() as Record<string, unknown>
  return NextResponse.json(data)
}
