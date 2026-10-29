// ============================================================
// ghl-common.mjs — Utilitaires de lecture seuls pour auditer GHL.
// Aucune écriture. Variables.
// Variable CANONIQUE lue : GHL_PRIVATE_INTEGRATION_TOKEN.
// (Pas de fallback silencieux vers GHL_API_TOKEN / GHL_PRIVATE_TOKEN.)
// ============================================================

import { readFileSync } from 'node:fs'

function loadDotEnv() {
  const out = {}
  try {
    const url = new URL('../.env.local', import.meta.url)
    for (const line of readFileSync(url, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/)
      if (m) out[m[1]] = m[2].replace(/^"|"$/g, '')
    }
  } catch {
    /* fichier absent : on ne lit que process.env */
  }
  return out
}

const fromFile = loadDotEnv()

export function requireGhlToken() {
  const raw = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || fromFile.GHL_PRIVATE_INTEGRATION_TOKEN
  if (!raw) {
    throw new Error(
      'GHL_PRIVATE_INTEGRATION_TOKEN non défini. Configurez cette variable dans .env.local.'
    )
  }
  if (raw.trim().length === 0) {
    throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN est vide.')
  }
  if (raw !== raw.trim()) {
    throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN contient des espaces en début ou fin.')
  }
  return raw
}

export function requireLocation() {
  const loc = process.env.GHL_LOCATION_ID || fromFile.GHL_LOCATION_ID
  if (!loc) throw new Error('GHL_LOCATION_ID non défini.')
  return loc
}

/**
 * GET GHL en lecture seule. S'arrête (process.exit 2) dès 401/403.
 * Ne lève jamais de jeton. Ne modifie rien.
 */
export async function ghlGet(label, url, version) {
  const token = requireGhlToken()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  if (version) headers.Version = version

  let res
  try {
    res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(15000) })
  } catch (e) {
    console.log(`[${label}] ERREUR RÉSEAU : ${e.message}`)
    process.exitCode = 3
    return null
  }
  const text = await res.text().catch(() => '')
  console.log(`[${label}] HTTP ${res.status}`)
  if (res.status === 401 || res.status === 403) {
    console.log('STOP : 401/403 — arrêt immédiat.')
    process.exit(2)
  }
  return { status: res.status, text }
}
