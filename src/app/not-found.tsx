import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <div>
        <p className="text-7xl font-bold text-[#F9A03F] font-serif">404</p>
        <h1 className="mt-3 text-2xl font-serif font-semibold text-[#0D3B3E]">Page introuvable</h1>
        <p className="mt-2 text-sm text-[#0D3B3E]/50 max-w-xs mx-auto">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 px-6 py-3 text-sm font-semibold text-white transition-colors shadow-[0_2px_12px_rgba(13,59,62,0.25)]"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/reservation"
          className="rounded-full border-2 border-[#F9A03F] px-6 py-3 text-sm font-semibold text-[#F9A03F] hover:bg-[#F9A03F] hover:text-white transition-all duration-200"
        >
          Faire une réservation
        </Link>
      </div>
      <p className="text-xs text-[#0D3B3E]/30 font-sans">
        Groupe Djamiyah — Hôtel Maison Blanche, Coyah
      </p>
    </div>
  )
}
