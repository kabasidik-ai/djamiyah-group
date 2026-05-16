/**
 * Validation des variables d'environnement critiques au démarrage.
 * Importer ce module le plus tôt possible (layout.tsx racine).
 *
 * Si une variable est manquante ou invalide, le build/start échoue
 * avec un message explicite listant chaque problème.
 */

import { z } from 'zod'

const envSchema = z.object({
  // ── GoHighLevel ───────────────────────────────────────────────
  GHL_API_TOKEN: z
    .string()
    .regex(
      /^pit-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      'GHL_API_TOKEN format invalide (doit être pit-UUID)'
    ),

  GHL_LOCATION_ID: z
    .string()
    .regex(/^[A-Za-z0-9]+$/, 'Caractères invalides')
    .min(15, 'Trop court (min 15)')
    .max(30, 'Trop long (max 30)'),

  GHL_CONVERSATION_AI_AGENT_ID: z
    .string()
    .regex(/^[A-Za-z0-9]+$/, 'Caractères invalides')
    .min(15, 'Trop court (min 15)')
    .max(30, 'Trop long (max 30)'),

  // ── Supabase ──────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Doit être une URL valide'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .startsWith('eyJ', 'Doit être un JWT (commence par eyJ)'),

  SUPABASE_SERVICE_ROLE_KEY: z.string().startsWith('eyJ', 'Doit être un JWT (commence par eyJ)'),

  // ── ChapChapPay ───────────────────────────────────────────────
  CHAPCHAP_API_KEY_PRODUCTION: z.string().regex(/^[a-f0-9]{64}$/, 'Doit être 64 caractères hex'),

  CHAPCHAP_HMAC_SECRET: z.string().regex(/^[a-f0-9]{32}$/, 'Doit être 32 caractères hex'),

  CHAPCHAP_NOTIFY_URL: z.string().url('Doit être une URL valide'),

  CHAPCHAP_RETURN_URL: z.string().url('Doit être une URL valide'),

  CHAPCHAP_BASE_URL: z.string().url('Doit être une URL valide'),

  // ── Site ──────────────────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: z.string().url('Doit être une URL valide'),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const lines: string[] = []

    for (const [key, messages] of Object.entries(errors)) {
      if (messages && messages.length > 0) {
        lines.push(`  ❌ ${key}: ${messages.join(', ')}`)
      }
    }

    const errorMessage = [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      "║  ERREUR CRITIQUE — Variables d'environnement invalides     ║",
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      `${lines.length} variable(s) invalide(s) :`,
      '',
      ...lines,
      '',
      'Vérifiez .env.local et les variables Vercel.',
      '',
    ].join('\n')

    console.error(errorMessage)
    throw new Error(`Variables d'environnement invalides : ${Object.keys(errors).join(', ')}`)
  }

  return result.data
}

/** Objet typé contenant toutes les variables d'environnement validées */
export const env: Env = validateEnv()
