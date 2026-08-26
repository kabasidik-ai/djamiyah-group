// ============================================================
// GET /api/auth/ghl/callback
// Reçoit le code OAuth GHL → échange tokens → stocke en DB
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, exchangeLocationToken } from '@/lib/ghl/oauth'
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
    // Échange du code contre les tokens (user_type=Company pour Agency install)
    const tokenData = await exchangeCodeForTokens(code)

    const location = process.env.GHL_LOCATION_ID

    // ── CAS 1 : userType === 'Company' (Agency → sub-account) ─────────────
    if (tokenData.userType === 'Company') {
      // Vérifier companyId + access_token
      if (!tokenData.companyId || !tokenData.access_token) {
        logger.error('GHL OAuth company info incomplète (rejet)', {
          hasCompanyId: Boolean(tokenData.companyId),
          hasAccess: Boolean(tokenData.access_token),
        })
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('company info incomplète')}`
        )
      }

      if (!location) {
        logger.error('GHL_LOCATION_ID absent (rejet)')
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('GHL_LOCATION_ID manquant')}`
        )
      }

      // Échanger le Company token → Location token pour GHL_LOCATION_ID
      const locationToken = await exchangeLocationToken(
        tokenData.access_token,
        tokenData.companyId,
        location
      )

      // Vérifier que le token retourné est bien Location
      if (locationToken.userType && locationToken.userType !== 'Location') {
        logger.error('GHL Location token userType inattendu (rejet)', {
          userType: locationToken.userType,
        })
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('userType inattendu')}`
        )
      }

      // Vérifier locationToken.locationId === GHL_LOCATION_ID
      if (locationToken.locationId && locationToken.locationId !== location) {
        logger.error('GHL Location token locationId mismatch (rejet)', {
          hasLocation: Boolean(locationToken.locationId),
        })
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('locationId mismatch')}`
        )
      }

      // Vérifier access_token + refresh_token
      if (!locationToken.access_token || !locationToken.refresh_token) {
        logger.error('GHL Location token incomplet (rejet)', {
          hasAccess: Boolean(locationToken.access_token),
          hasRefresh: Boolean(locationToken.refresh_token),
        })
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('token incomplet')}`
        )
      }

      // Sauvegarder le Location token dans ghl_oauth_tokens
      const tokenInfo = await saveToken(location, locationToken)
      logger.info('Token GHL OAuth (Location) sauvegardé', {
        locationId: tokenInfo.locationId,
        expiresAt: tokenInfo.expiresAt.toISOString(),
      })

      // Redirection succès
      const response = NextResponse.redirect(
        `${SITE_URL}/admin?oauth_success=1&location_id=${location}`
      )
      if (storedState) {
        response.cookies.delete('ghl_oauth_state')
      }
      return response
    }

    // ── CAS 2 : userType === 'Location' (échange direct) ──────────────────
    if (tokenData.userType === 'Location') {
      // Ne PAS appeler /oauth/location-token
      if (tokenData.locationId !== location) {
        logger.error('GHL OAuth locationId mismatch (rejet)', {
          hasLocation: Boolean(tokenData.locationId),
        })
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('locationId mismatch')}`
        )
      }

      if (!tokenData.access_token || !tokenData.refresh_token) {
        logger.error('GHL OAuth token incomplet (rejet)', {
          hasAccess: Boolean(tokenData.access_token),
          hasRefresh: Boolean(tokenData.refresh_token),
        })
        return NextResponse.redirect(
          `${SITE_URL}/admin?oauth_error=${encodeURIComponent('token incomplet')}`
        )
      }

      const tokenInfo = await saveToken(tokenData.locationId as string, tokenData)
      logger.info('Token GHL OAuth (Location direct) sauvegardé', {
        locationId: tokenInfo.locationId,
        expiresAt: tokenInfo.expiresAt.toISOString(),
      })

      const response = NextResponse.redirect(
        `${SITE_URL}/admin?oauth_success=1&location_id=${tokenData.locationId}`
      )
      if (storedState) {
        response.cookies.delete('ghl_oauth_state')
      }
      return response
    }

    // ── userType inattendu → rejeter proprement ───────────────────────────
    logger.error('GHL OAuth userType inconnu (rejet)', {
      userType: tokenData.userType,
    })
    return NextResponse.redirect(
      `${SITE_URL}/admin?oauth_error=${encodeURIComponent('userType inconnu')}`
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('GHL OAuth callback erreur', { error: message })
    return NextResponse.redirect(`${SITE_URL}/admin?oauth_error=${encodeURIComponent(message)}`)
  }
}
