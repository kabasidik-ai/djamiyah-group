import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <div>
        <p className="text-6xl font-bold text-amber-600">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-gray-500">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/reservation"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Faire une réservation
        </Link>
      </div>
      <p className="text-xs text-gray-400">
        Groupe Djamiyah — Hôtel Maison Blanche, Coyah
      </p>
    </div>
  )
}
