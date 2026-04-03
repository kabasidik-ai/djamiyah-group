// ============================================================
// GHL Token Store — Supabase
// Stockage et récupération des tokens OAuth GHL
// ============================================================

import { createServiceRoleClient } from '@/lib/supabase'
import { refreshAccessToken, tokenExpiresAt, isTokenExpired } from './oauth'
import type { GHLTokenInfo, GHLOAuthTokenResponse } from './types'
import type { Database } from '@/types/database'

type GHLOAuthTokenRow = Database['public']['Tables']['ghl_oauth_tokens']['Row']
type GHLOAuthTokenInsert = Database['public']['Tables']['ghl_oauth_tokens']['Insert']

// ── Helpers de mapping ────────────────────────────────────────

function rowToTokenInfo(row: GHLOAuthTokenRow): GHLTokenInfo {
  return {
    locationId: row.location_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: new Date(row.expires_at),
    scope: row.scope,
    tokenType: row.token_type,
  }
}

function oauthResponseToInsert(
  locationId: string,
  data: GHLOAuthTokenResponse
): GHLOAuthTokenInsert {
  return {
    location_id: locationId,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: tokenExpiresAt(data.expires_in).toISOString(),
    scope: data.scope,
    token_type: data.token_type,
  }
}

// ── Sauvegarde d'un token ─────────────────────────────────────

export async function saveToken(
  locationId: string,
  data: GHLOAuthTokenResponse
): Promise<GHLTokenInfo> {
  const db = createServiceRoleClient()
  const insert = oauthResponseToInsert(locationId, data)

  const { data: saved, error } = await db
    .from('ghl_oauth_tokens')
    .upsert(insert, { onConflict: 'location_id' })
    .select()
    .single()

  if (error) throw new Error(`Impossible de sauvegarder le token GHL: ${error.message}`)
  if (!saved) throw new Error('Token GHL non retourné après sauvegarde')

  return rowToTokenInfo(saved as GHLOAuthTokenRow)
}

// ── Récupération du token actif pour une location ─────────────

export async function getValidToken(locationId: string): Promise<GHLTokenInfo> {
  const db = createServiceRoleClient()

  const { data: row, error } = await db
    .from('ghl_oauth_tokens')
    .select('*')
    .eq('location_id', locationId)
    .single()

  if (error || !row) {
    throw new Error(
      `Aucun token OAuth trouvé pour location ${locationId}. ` +
      `Veuillez compléter le flux OAuth sur /api/auth/ghl/authorize`
    )
  }

  const tokenInfo = rowToTokenInfo(row as GHLOAuthTokenRow)

  // Auto-refresh si expiré
  if (isTokenExpired(tokenInfo)) {
    const refreshed = await refreshAccessToken(tokenInfo.refreshToken)
    return saveToken(locationId, refreshed)
  }

  return tokenInfo
}

// ── Résolution du Bearer token (OAuth prioritaire, fallback Private Token) ─

export async function resolveAccessToken(locationId?: string): Promise<string> {
  // 1. Essayer OAuth
  try {
    const id = locationId ?? process.env.GHL_LOCATION_ID
    if (id) {
      const tokenInfo = await getValidToken(id)
      return tokenInfo.accessToken
    }
  } catch {
    // OAuth non configuré ou Supabase indisponible — passer au fallback
  }

  // 2. Fallback : GHL_PRIVATE_TOKEN (legacy, pendant la migration)
  const privateToken = process.env.GHL_PRIVATE_TOKEN
  if (privateToken) return privateToken

  throw new Error(
    'Aucun token GHL disponible. ' +
    'Configurez OAuth via /api/auth/ghl/authorize OU définissez GHL_PRIVATE_TOKEN.'
  )
}
