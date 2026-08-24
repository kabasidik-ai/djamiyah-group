'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// ── Règles de sécurité minimales ─────────────────────────────
const RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { id: 'upper', label: 'Une lettre majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Une lettre minuscule', test: (v: string) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Un chiffre', test: (v: string) => /\d/.test(v) },
]

function allRulesPassed(pw: string): boolean {
  return RULES.every((r) => r.test(pw))
}

function ToggleBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-amber-600"
    >
      {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  )
}

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const passwordOk = allRulesPassed(password)
  const confirmOk = confirm.length > 0 && confirm === password
  const canSubmit = passwordOk && confirmOk && !isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)
    if (!canSubmit) return
    setIsPending(true)
    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setServerError(
          error.message.includes('session')
            ? 'Session expirée. Demandez un nouveau lien de réinitialisation.'
            : 'Impossible de mettre à jour le mot de passe. Réessayez.'
        )
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/admin/login'), 2000)
    } catch {
      setServerError('Une erreur inattendue est survenue. Réessayez.')
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-3">
        <CheckCircle2 className="mx-auto text-green-500" size={48} aria-hidden="true" />
        <p className="text-gray-800 font-semibold">Mot de passe mis à jour !</p>
        <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Nouveau mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            aria-describedby="password-rules"
          />
          <ToggleBtn show={showPw} onToggle={() => setShowPw((p) => !p)} />
        </div>
        {password.length > 0 && (
          <ul id="password-rules" className="mt-2 space-y-1" aria-label="Criteres du mot de passe">
            {RULES.map((rule) => {
              const ok = rule.test(password)
              return (
                <li
                  key={rule.id}
                  className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {ok ? (
                    <CheckCircle2 size={12} aria-hidden="true" />
                  ) : (
                    <XCircle size={12} aria-hidden="true" />
                  )}
                  {rule.label}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <input
            id="confirm"
            name="confirm"
            type={showCf ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
              confirm.length > 0 && !confirmOk ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          <ToggleBtn show={showCf} onToggle={() => setShowCf((p) => !p)} />
        </div>
        {confirm.length > 0 && !confirmOk && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            Les mots de passe ne correspondent pas.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Mise a jour...' : 'Definir le nouveau mot de passe'}
      </button>
    </form>
  )
}
