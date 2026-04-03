// ============================================================
// GET /api/auth/ghl/authorize
// Démarre le flux OAuth 2.0 GHL — redirige vers GHL Marketplace
// ============================================================

import { NextResponse } from 'next/server'
import { buildAuthorizationUrl } from '@/lib/ghl/oauth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  // Génération d'un state aléatoire anti-CSRF
  const state = randomBytes(32).toString('hex')

  // En production, stocker le state en cookie sécurisé
  const authUrl = buildAuthorizationUrl(state)

  const response = NextResponse.redirect(authUrl)

  // Cookie httpOnly pour valider le state au callback
  response.cookies.set('ghl_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
