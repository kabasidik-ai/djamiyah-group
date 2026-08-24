'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { loginAction, type LoginState } from '../actions'

const RESET_REDIRECT_TO = 'https://djamiyahgroup.com/api/auth/callback'
const initialState: LoginState = { error: null }

function LoginView({ onForgotPassword }: { onForgotPassword: () => void }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="staff@djamiyahgroup.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-amber-600"
          >
            {showPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Connexion...' : 'Se connecter'}
      </button>
      <div className="text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-amber-600 hover:text-amber-700 hover:underline focus:outline-none focus:underline"
        >
          Mot de passe oublie ?
        </button>
      </div>
    </form>
  )
}

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending || sent) return
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    setIsPending(true)
    setError(null)

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: RESET_REDIRECT_TO,
      })
      if (supabaseError) {
        if (supabaseError.status === 429 || supabaseError.message.toLowerCase().includes('rate')) {
          setError('Trop de tentatives. Veuillez patienter quelques minutes.')
          return
        }
      }
      // Réponse toujours neutre — ne révèle pas l'existence du compte
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setIsPending(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          Si cette adresse est associee a un compte, un lien de reinitialisation a ete envoye.
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
        >
          Retour a la connexion
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-sm text-gray-600">
        Saisissez votre adresse email. Si elle est associee a un compte staff, vous recevrez un lien
        de reinitialisation.
      </p>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="reset-email"
          name="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="staff@djamiyahgroup.com"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !email.trim()}
        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Envoi en cours...' : 'Envoyer le lien'}
      </button>
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline focus:outline-none focus:underline"
        >
          Retour a la connexion
        </button>
      </div>
    </form>
  )
}

export function LoginForm() {
  const [view, setView] = useState<'login' | 'forgot'>('login')
  if (view === 'forgot') {
    return <ForgotPasswordView onBack={() => setView('login')} />
  }
  return <LoginView onForgotPassword={() => setView('forgot')} />
}
