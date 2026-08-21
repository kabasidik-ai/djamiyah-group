'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { ADMIN_DASHBOARD_PATH, isAdminEmail, requireAdmin } from '@/lib/adminAuth'
import {
  updateConferenceReservationStatus,
  type ReservationAction,
} from '@/lib/adminConferenceReservations'

export type LoginState = {
  error: string | null
}

/**
 * Connexion staff via Supabase Auth (email + mot de passe).
 * L'allowlist ADMIN_EMAILS est vérifiée AVANT la validation du mot de passe
 * pour ne pas révéler l'existence d'un compte à un email non autorisé.
 */
export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  if (!isAdminEmail(email)) {
    return { error: 'Identifiants invalides.' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Identifiants invalides.' }
  }

  redirect(ADMIN_DASHBOARD_PATH)
}

/**
 * Déconnexion staff.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export type ReservationActionState = {
  error: string | null
  success: string | null
}

/**
 * Action staff : Confirmer ou Refuser une réservation de conférence.
 *
 * Sécurité réelle côté serveur :
 * 1. requireAdmin() vérifie la session Supabase + allowlist ADMIN_EMAILS
 * 2. Transitions restreintes à awaiting_confirmation/pending -> confirmed/cancelled
 * 3. payment_status n'est jamais modifié ici
 */
export async function setReservationStatusAction(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  // Garde serveur : session + allowlist
  await requireAdmin()

  const reservationId = String(formData.get('reservationId') ?? '')
  const action = String(formData.get('action') ?? '') as ReservationAction

  if (!reservationId) {
    return { error: 'Identifiant de réservation manquant.', success: null }
  }

  if (action !== 'confirmed' && action !== 'cancelled') {
    return { error: 'Action invalide.', success: null }
  }

  const result = await updateConferenceReservationStatus(reservationId, action)

  if (!result.ok) {
    return { error: result.error, success: null }
  }

  revalidatePath('/admin/conference-reservations')

  return {
    error: null,
    success: action === 'confirmed' ? 'Réservation confirmée.' : 'Réservation refusée (annulée).',
  }
}
