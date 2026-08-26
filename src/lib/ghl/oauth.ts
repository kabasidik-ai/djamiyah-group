// ============================================================
// GHL OAuth 2.0 — Groupe Djamiyah
// Compatible Vercel Edge / Node runtime
// ============================================================

import type { GHLOAuthTokenResponse, GHLTokenInfo } from './types'

const GHL_OAUTH_BASE = 'https://marketplace.gohighlevel.com'
const GHL_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token'

// ── Config OAuth (depuis variables d'environnement) ───────────

function getOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const clientId = process.env.GHL_CLIENT_ID
  const clientSecret = process.env.GHL_CLIENT_SECRET
  const redirectUri = process.env.GHL_OAUTH_REDIRECT_URI

  if (!clientId) throw new Error("GHL_CLIENT_ID manquant dans les variables d'environnement")
  if (!clientSecret)
    throw new Error("GHL_CLIENT_SECRET manquant dans les variables d'environnement")
  if (!redirectUri)
    throw new Error("GHL_OAUTH_REDIRECT_URI manquant dans les variables d'environnement")

  return { clientId, clientSecret, redirectUri }
}

// ── Scopes nécessaires ────────────────────────────────────────

export const GHL_SCOPES = [
  'conversations.readonly',
  'conversations.write',
  'conversations/message.readonly',
  'conversations/message.write',
  'contacts.readonly',
  'contacts.write',
  'locations.readonly',
  'oauth.readonly',
  'oauth.write',
  'bots.readonly',
  // Agenda : lecture seule des calendriers et événements
  'calendars.readonly',
  'calendars/events.readonly',
] as const

export type GHLScope = (typeof GHL_SCOPES)[number]

// ── Génération de l'URL d'autorisation ───────────────────────

export function buildAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig()

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: GHL_SCOPES.join(' '),
    state,
  })

  return `${GHL_OAUTH_BASE}/oauth/chooselocation?${params.toString()}`
}

// ── Échange code → tokens ─────────────────────────────────────

export async function exchangeCodeForTokens(code: string): Promise<GHLOAuthTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig()

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    user_type: 'Location',
  })

  // ── Logs tibres de diagnostic (aucun secret, code, token ni client_secret) ──
  console.log(
    '[GHL-EXCHANGE][info] fields:',
    JSON.stringify({
      has_client_id: Boolean(clientId),
      has_client_secret: Boolean(clientSecret),
      client_id_len: clientId?.length ?? 0,
      client_id_prefix8: clientId ? clientId.slice(0, 8) : '',
      client_id_suffix6: clientId ? clientId.slice(-6) : '',
      client_id_leading_space: clientId ? /^\s/.test(clientId) : false,
      client_id_trailing_space: clientId ? /\s$/.test(clientId) : false,
      client_id_has_newline: clientId ? /\n/.test(clientId) : false,
      client_id_has_cr: clientId ? /\r/.test(clientId) : false,
      client_id_has_quotes: clientId ? /["']/.test(clientId) : false,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_present: Boolean(code),
      user_type: 'Location',
    })
  )

  const response = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  console.log('[GHL-EXCHANGE][status]', response.status)

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    console.error(
      '[GHL-EXCHANGE][resp]',
      JSON.stringify({
        status: response.status,
        body: errorText,
      })
    )
    throw new Error(`GHL token exchange failed ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<GHLOAuthTokenResponse>
}

// ── Refresh du token ──────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<GHLOAuthTokenResponse> {
  const { clientId, clientSecret } = getOAuthConfig()

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    throw new Error(`GHL token refresh failed ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<GHLOAuthTokenResponse>
}

// ── Calcul de la date d'expiration ────────────────────────────

export function tokenExpiresAt(expiresIn: number): Date {
  // Marge de sécurité : on considère expiré 5 minutes avant
  return new Date(Date.now() + (expiresIn - 300) * 1000)
}

// ── Vérification si le token est expiré ──────────────────────

export function isTokenExpired(tokenInfo: GHLTokenInfo): boolean {
  return new Date() >= tokenInfo.expiresAt
}
