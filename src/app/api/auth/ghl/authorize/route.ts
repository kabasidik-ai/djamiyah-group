// ============================================================
// GET /api/auth/ghl/authorize
// Démarre le flux OAuth 2.0 GHL — redirige vers GHL Marketplace
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { buildAuthorizationUrl } from '@/lib/ghl/oauth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

const CANONICAL_HOST = 'djamiyahgroup.com'
const CANONICAL_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${CANONICAL_HOST}`

export async function GET(req: NextRequest): Promise<NextResponse> {
  const hostname = req.nextUrl.hostname

  // Domaine canonique : si on arrive via un alias Vercel (*.vercel.app) ou tout
  // autre hôte, on redirige vers le domaine canonique POUR QUE le cookie
  // ghl_oauth_state soit posé sur djamiyahgroup.com (et retrouvé au callback).
  if (hostname !== CANONICAL_HOST) {
    const canonicalUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, CANONICAL_ORIGIN)
    return NextResponse.redirect(canonicalUrl)
  }

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
    maxAge: 900, // 15 minutes
    path: '/',
  })

  return response
}
