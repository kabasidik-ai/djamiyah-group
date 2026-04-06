// ============================================================
// GET /api/config/avatar
// Retourne la config avatar de Salematou (public, sans auth)
// Priorité : Supabase site_config → env SALEMATOU_AVATAR_URL → SVG par défaut
// ============================================================

import { NextResponse } from 'next/server'
import type { AvatarConfig } from '@/lib/ghl/types'

export const runtime = 'nodejs'

// Cache 1 heure côté CDN Vercel (revalidate sur PUT admin)
export const revalidate = 3600

interface AvatarApiResponse {
  success: boolean
  avatar: AvatarConfig
}

export async function GET(): Promise<NextResponse<AvatarApiResponse>> {
  // 1. Essayer Supabase site_config (mise à jour sans redéploiement)
  try {
    const { isSupabaseServiceConfigured, createServiceRoleClient } = await import('@/lib/supabase')

    if (isSupabaseServiceConfigured()) {
      const db = createServiceRoleClient()
      const { data } = await db
        .from('site_config')
        .select('value, updated_at')
        .eq('key', 'salematou_avatar_url')
        .single()

      if (data && (data as Record<string, string>).value) {
        const row = data as Record<string, string>
        return NextResponse.json(
          {
            success: true,
            avatar: {
              url: row.value,
              alt: 'Salematou — Concierge Groupe Djamiyah',
              updatedAt: row.updated_at ?? new Date().toISOString(),
            },
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
          }
        )
      }
    }
  } catch {
    // Supabase non configuré ou erreur réseau — continuer
  }

  // 2. Variable d'environnement SALEMATOU_AVATAR_URL
  const envUrl = process.env.SALEMATOU_AVATAR_URL?.trim()
  if (envUrl) {
    return NextResponse.json(
      {
        success: true,
        avatar: {
          url: envUrl,
          alt: 'Salematou — Concierge Groupe Djamiyah',
          updatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  }

  // 3. WebP local par défaut — garanti accessible dans /public/images/
  return NextResponse.json(
    {
      success: true,
      avatar: {
        url: '/images/receptionniste-avatar.webp',
        alt: 'Salematou — Concierge Groupe Djamiyah',
        updatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
