import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_DASHBOARD_PATH = '/admin'

/**
 * Allowlist des emails staff autorisés à accéder à l'espace admin.
 * Variable d'environnement ADMIN_EMAILS, séparée par des virgules :
 *   ADMIN_EMAILS=alice@djamiyahgroup.com,bob@djamiyahgroup.com
 * Comparaison insensible à la casse.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

export type AdminUser = {
  id: string
  email: string
}

/**
 * Garde serveur pour les pages et Server Actions de l'espace staff.
 *
 * Vérifie réellement la session Supabase Auth (cookie httpOnly) côté
 * serveur, puis applique l'allowlist ADMIN_EMAILS. Ce n'est pas une simple
 * protection par proxy : chaque page/action appelle ce helper.
 *
 * - Session absente ou invalide -> redirection vers /admin/login
 * - Email non autorisé -> redirection vers /admin/login
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    redirect(ADMIN_LOGIN_PATH)
  }

  if (!isAdminEmail(data.user.email)) {
    redirect(ADMIN_LOGIN_PATH)
  }

  return {
    id: data.user.id,
    email: (data.user.email ?? '').toLowerCase(),
  }
}
