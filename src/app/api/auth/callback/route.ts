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

  // Préparer la réponse de redirection AVANT l'échange PKCE.
  // Les cookies écrits par Supabase dans setAll() seront posés directement
  // sur cet objet response → ils seront bien transmis au navigateur via Set-Cookie.
  const safeNext = next.startsWith('/') ? next : '/admin/update-password'
  const response = NextResponse.redirect(`${SITE_URL}${safeNext}`)

  // Lire les cookies entrants depuis la requête (nécessaire pour le verifier PKCE)
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
          // Écrire chaque cookie Supabase directement sur l'objet response.
          // C'est le seul moyen de les propager au navigateur depuis une Route Handler.
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
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

  // Succès → la réponse contient déjà les Set-Cookie Supabase + la redirection
  return response
}
