// ============================================================
// GET /api/auth/callback
// Reçoit le code PKCE de Supabase (email recovery, magic link…)
// Échange le code contre une session → redirige vers la bonne page
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://djamiyahgroup.com'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/update-password'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Supabase a retourné une erreur explicite
  if (errorParam) {
    const msg = errorDescription ?? errorParam
    return NextResponse.redirect(`${SITE_URL}/admin/login?error=${encodeURIComponent(msg)}`)
  }

  // Code PKCE absent
  if (!code) {
    return NextResponse.redirect(
      `${SITE_URL}/admin/login?error=${encodeURIComponent('Lien de réinitialisation invalide ou expiré.')}`
    )
  }

  // Création d'un client Supabase SSR capable de lire/écrire les cookies
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignoré si le contexte est read-only (middleware)
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${SITE_URL}/admin/login?error=${encodeURIComponent('Lien expiré ou déjà utilisé. Demandez un nouveau lien.')}`
    )
  }

  // Succès → redirection vers la page de saisie du nouveau mot de passe
  // On s'assure que `next` pointe bien vers une URL interne au site
  const safeNext = next.startsWith('/') ? next : '/admin/update-password'
  return NextResponse.redirect(`${SITE_URL}${safeNext}`)
}
