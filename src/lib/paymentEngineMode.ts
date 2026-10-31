export type PaymentEngineMode = 'off' | 'local_mock'

export type LocalMockConfig = {
  mode: 'local_mock'
  chapchapBaseUrl: string
  supabaseUrl: string
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost'])

function isLoopbackHttpUrl(raw: string | undefined | null): boolean {
  if (typeof raw !== 'string' || !raw) return false
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:') return false
    if (!LOOPBACK_HOSTS.has(url.hostname)) return false
    if (url.username || url.password) return false
    // Refuse les formes ambiguës inutiles en config de base URL.
    if (url.search || url.hash) return false
    return true
  } catch {
    return false
  }
}

export function resolvePaymentEngineMode(
  env: Record<string, string | undefined> = process.env
): PaymentEngineMode {
  // Garde absolue : impossible d'activer P2 local_mock en production.
  if (env.NODE_ENV === 'production') return 'off'

  return env.P2_PAYMENT_ENGINE_MODE === 'local_mock' ? 'local_mock' : 'off'
}

export function readLocalMockConfig(
  env: Record<string, string | undefined> = process.env
): LocalMockConfig {
  const mode = resolvePaymentEngineMode(env)
  if (mode !== 'local_mock') {
    throw new Error('P2 local_mock is not enabled')
  }

  const chapchapBaseUrl = env.CHAPCHAP_BASE_URL
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL

  if (!isLoopbackHttpUrl(chapchapBaseUrl)) {
    throw new Error(
      'P2 local_mock requires CHAPCHAP_BASE_URL on loopback http://127.0.0.1 or http://localhost'
    )
  }

  if (!isLoopbackHttpUrl(supabaseUrl)) {
    throw new Error(
      'P2 local_mock requires NEXT_PUBLIC_SUPABASE_URL on loopback http://127.0.0.1 or http://localhost'
    )
  }

  return {
    mode,
    chapchapBaseUrl: chapchapBaseUrl as string,
    supabaseUrl: supabaseUrl as string,
  }
}

export function isP2LocalMockEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return resolvePaymentEngineMode(env) === 'local_mock'
}

export function assertLocalMockConfig(
  env: Record<string, string | undefined> = process.env
): LocalMockConfig {
  return readLocalMockConfig(env)
}
