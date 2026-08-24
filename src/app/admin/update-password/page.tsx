import type { Metadata } from 'next'
import { UpdatePasswordForm } from './UpdatePasswordForm'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe — Espace Staff',
  robots: { index: false, follow: false },
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-gray-600">Djamiyah Group — Espace Staff</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
