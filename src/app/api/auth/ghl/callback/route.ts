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

  // Valeur du cookie state (utilisée pour la validation stricte du flux classique)
  const storedState = req.cookies.get('ghl_oauth_state')?.value

  // Logs sûrs de diagnostic (aucun secret : state/code/token non affichés)
  logger.info('GHL OAuth callback diagnostic', {
    hostname: req.nextUrl.hostname,
    cookiePresent: Boolean(storedState),
    stateQueryPresent: Boolean(state),
    stateMatch: Boolean(storedState && state && storedState === state),
    errorParam: Boolean(error),
  })

  // ── Validation du state (flux classique via /api/auth/ghl/authorize) ──
  // Si un cookie + state sont fournis, la correspondance stricte est OBLIGATOIRE.
  if (storedState || state) {
    // Au moins un des deux est présent → on exige la correspondance stricte.
    // Aucune exception : mismatch → rejet sans échange.
    if (!state || !storedState || storedState !== state) {
      logger.error('GHL OAuth state invalide, rejet', {
        hasStoredState: Boolean(storedState),
        stateQueryPresent: Boolean(state),
      })
      return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=invalid_state`)
    }
  }

  try {
    // Échange du code contre les tokens
    const tokenData = await exchangeCodeForTokens(code)

    // ── Validations obligatoires AVANT saveToken ─────────────────────────
    const location = process.env.GHL_LOCATION_ID

    // 1. userType doit être "Location"
    if (tokenData.userType !== 'Location') {
      logger.error('GHL OAuth userType invalide (rejet)', {
        userType: tokenData.userType,
      })
      return NextResponse.redirect(
        `${SITE_URL}/admin?oauth_error=${encodeURIComponent('userType invalide')}`
      )
    }

    // 2. locationId présent et strictement égal à GHL_LOCATION_ID
    if (!tokenData.locationId || !location || tokenData.locationId !== location) {
      logger.error('GHL OAuth locationId mismatch (rejet)', {
        hasLocation: Boolean(tokenData.locationId),
      })
      return NextResponse.redirect(
        `${SITE_URL}/admin?oauth_error=${encodeURIComponent('locationId mismatch')}`
      )
    }

    // 3. access_token et refresh_token présents
    if (!tokenData.access_token || !tokenData.refresh_token) {
      logger.error('GHL OAuth token incomplet (rejet)', {
        hasAccess: Boolean(tokenData.access_token),
        hasRefresh: Boolean(tokenData.refresh_token),
      })
      return NextResponse.redirect(
        `${SITE_URL}/admin?oauth_error=${encodeURIComponent('token incomplet')}`
      )
    }

    const locationId = tokenData.locationId

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
    if (storedState) {
      response.cookies.delete('ghl_oauth_state')
    }

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('GHL OAuth callback erreur', { error: message })
    return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=${encodeURIComponent(message)}`)
  }
}
