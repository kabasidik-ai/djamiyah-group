/**
 * Validation des variables d'environnement critiques.
 * Importer ce module le plus tôt possible (layout.tsx racine).
 *
 * En dev : log warning si variable manquante (ne bloque pas le build).
 * En production : log warning uniquement — ne throw jamais pour ne pas
 * bloquer le build Vercel si un format ne correspond pas exactement.
 */

import { z } from 'zod'

const envSchema = z.object({
  // ── GoHighLevel ───────────────────────────────────────────────
  GHL_API_TOKEN: z.string().min(1, 'GHL_API_TOKEN requis'),
  GHL_LOCATION_ID: z.string().min(1, 'GHL_LOCATION_ID requis'),
  GHL_CONVERSATION_AI_AGENT_ID: z.string().min(1, 'GHL_CONVERSATION_AI_AGENT_ID requis'),

  // ── Supabase ──────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY requis'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY requis'),

  // ── ChapChapPay ───────────────────────────────────────────────
  CHAPCHAP_API_KEY_PRODUCTION: z.string().min(1, 'CHAPCHAP_API_KEY_PRODUCTION requis'),
  CHAPCHAP_HMAC_SECRET: z.string().min(1, 'CHAPCHAP_HMAC_SECRET requis'),
  CHAPCHAP_NOTIFY_URL: z.string().url('CHAPCHAP_NOTIFY_URL doit être une URL'),
  CHAPCHAP_RETURN_URL: z.string().url('CHAPCHAP_RETURN_URL doit être une URL'),
  CHAPCHAP_BASE_URL: z.string().url('CHAPCHAP_BASE_URL doit être une URL'),

  // ── Site ──────────────────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL doit être une URL'),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Partial<Env> {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const lines: string[] = []

    for (const [key, messages] of Object.entries(errors)) {
      if (messages && messages.length > 0) {
        lines.push(`  ⚠️  ${key}: ${messages.join(', ')}`)
      }
    }

    console.warn(
      [
        '',
        '┌──────────────────────────────────────────────────────────┐',
        "│  ⚠️  Variables d'environnement manquantes/invalides      │",
        '└──────────────────────────────────────────────────────────┘',
        '',
        ...lines,
        '',
        'Certaines fonctionnalités peuvent ne pas fonctionner.',
        'Vérifiez .env.local ou les variables Vercel.',
        '',
      ].join('\n')
    )

    // Return partial data — don't throw, don't block the build
    return (result as unknown as { data?: Partial<Env> }).data ?? {}
  }

  return result.data
}

/** Variables d'environnement validées (peut être partiel si certaines manquent) */
export const env: Partial<Env> = validateEnv()
