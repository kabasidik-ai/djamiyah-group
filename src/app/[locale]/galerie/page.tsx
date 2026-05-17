import type { Metadata } from 'next'
import GalleryHero from '@/components/GalleryHero'

export const metadata: Metadata = {
  title: 'Galerie — Groupe Djamiyah',
  description:
    "Découvrez en images les hôtels du Groupe Djamiyah : chambres, restaurant, espaces de conférence et extérieurs de l'Hôtel Maison Blanche à Coyah et l'Hôtel Rama à Kissidougou.",
}

export default function GaleriePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero text ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-20 text-center">
        <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-4">
          Groupe Djamiyah
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#0D3B3E] leading-tight mb-4">
          Notre Galerie
        </h1>
        <p className="text-[#0D3B3E]/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Explorez nos espaces — chambres luxueuses, restaurant gastronomique, salles de conférence
          et hôtels en Guinée.
        </p>
      </div>

      {/* ── Galerie interactive ── */}
      <GalleryHero />
    </main>
  )
}
