/**
 * P1 — Isolation des environnements pour les clés API ChapChap.
 *
 * Contrôle : la sélection de la clé repose sur `VERCEL_ENV` (autorité Vercel),
 * JAMAIS sur `NODE_ENV` seul (tous les déploiements Vercel tournent en
 * `NODE_ENV=production`, y compris Preview).
 *
 * Règles :
 *  - Déploiement de PRODUCTION (VERCEL_ENV === 'production') →
 *      CHAPCHAP_API_KEY_PRODUCTION SEULE. Absente → 503 fail-closed.
 *  - PREVIEW / DEVELOPMENT / local →
 *      CHAPCHAP_API_KEY_TEST SEULE, AUCUN fallback vers Production.
 *      Absente → 503 fail-closed.
 *      Présence résiduelle de la clé Production dans cet environnement →
 *      403 fail-closed (l'isolation des environnements n'est pas garantie :
 *      un partage de variables Production→Preview a été constaté par audit).
 */

export type ChapchapKeyDecision =
  | { allow: true; environment: 'production' | 'preview' | 'development'; key: string }
  | { allow: false; status: 403 | 503; reason: string }

export function resolveChapchapApiKey(env: NodeJS.ProcessEnv = process.env): ChapchapKeyDecision {
  const vercelEnv = env.VERCEL_ENV

  // ── PRODUCTION (déploiement Vercel de production uniquement) ──────────────
  if (vercelEnv === 'production' && env.NODE_ENV === 'production') {
    const productionKey = env.CHAPCHAP_API_KEY_PRODUCTION
    if (!productionKey) {
      return { allow: false, status: 503, reason: 'missing_production_key' }
    }
    return { allow: true, environment: 'production', key: productionKey }
  }

  // ── PREVIEW / DEVELOPMENT / LOCAL ──────────────────────────────────────────
  // Jamais de fallback vers la clé Production.
  const testKey = env.CHAPCHAP_API_KEY_TEST
  if (!testKey) {
    return { allow: false, status: 503, reason: 'missing_test_key_preview_or_dev' }
  }
  // Isolation : si la clé Production est encore présente dans cet environnement,
  // la configuration ne garantit pas la séparation → interdiction d'initier.
  if (env.CHAPCHAP_API_KEY_PRODUCTION) {
    return {
      allow: false,
      status: 403,
      reason: 'production_key_present_outside_production',
    }
  }
  return {
    allow: true,
    environment: vercelEnv === 'preview' ? 'preview' : 'development',
    key: testKey,
  }
}
