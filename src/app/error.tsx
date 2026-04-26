'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[djamiyah-error]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <span className="text-3xl">!</span>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-gray-500">
          {error.message || 'Veuillez réessayer ou contacter le support.'}
        </p>
        {error.digest && <p className="mt-1 text-xs text-gray-400">Code : {error.digest}</p>}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
