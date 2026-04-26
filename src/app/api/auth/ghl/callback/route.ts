// ============================================================
// GET /api/auth/ghl/callback
// Reçoit le code OAuth GHL → échange tokens → stocke en DB
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/ghl/oauth'
import { saveToken } from '@/lib/ghl/token-store'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://djamiyahgroup.com'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // GHL a retourné une erreur
  if (error) {
    logger.error('GHL OAuth refusé', { error })
    return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=missing_code`)
  }

  // Vérification du state anti-CSRF
  const storedState = req.cookies.get('ghl_oauth_state')?.value
  if (!storedState || storedState !== state) {
    logger.error('GHL OAuth state invalide', { received: state })
    return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=invalid_state`)
  }

  try {
    // Échange du code contre les tokens
    const tokenData = await exchangeCodeForTokens(code)

    // Résolution du locationId (inclus dans la réponse token GHL)
    const locationId = tokenData.locationId ?? process.env.GHL_LOCATION_ID
    if (!locationId) {
      throw new Error(
        'locationId absent de la réponse OAuth. ' +
          'Définissez GHL_LOCATION_ID ou reconnectez via GHL Marketplace.'
      )
    }

    // Stockage sécurisé en Supabase
    const tokenInfo = await saveToken(locationId, tokenData)
    logger.info('Token GHL OAuth sauvegardé', {
      locationId: tokenInfo.locationId,
      expiresAt: tokenInfo.expiresAt.toISOString(),
    })

    // Redirection vers page admin avec succès
    const response = NextResponse.redirect(
      `${SITE_URL}/admin?oauth_success=1&location_id=${locationId}`
    )

    // Nettoyer le cookie state
    response.cookies.delete('ghl_oauth_state')

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('GHL OAuth callback erreur', { error: message })
    return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=${encodeURIComponent(message)}`)
  }
}
