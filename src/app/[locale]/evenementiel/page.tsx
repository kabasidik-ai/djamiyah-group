import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import EvenementielContent from '@/components/evenementiel/EvenementielContent'

export const metadata: Metadata = {
  title: 'Salles & Conférences | Groupe Djamiyah',
  description:
    'Salles et espaces de conférence à Coyah (Hôtel Maison Blanche) et Kissidougou (Hôtel Rama). Réunions, séminaires, formations et événements.',
}

export default function EvenementielPage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative h-[42vh] min-h-[380px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/heroevent.png"
          alt="Salles et conférences Groupe Djamiyah"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 text-center px-4">
          <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-4">
            Groupe Djamiyah
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] mb-4">
            Salles &amp; Conférences
          </h1>
          <p className="text-lg md:text-xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Des espaces adaptés à vos réunions, séminaires, formations et événements à Coyah et
            Kissidougou.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <a
              href="#salles"
              className="inline-flex items-center justify-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
            >
              Voir les salles
            </a>
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-full border border-white/30 transition-colors"
            >
              Réserver une salle
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENU INTERACTIF (sélecteur hôtels, salles, étapes, CTA) */}
      <EvenementielContent />

      <div className="text-center py-12">
        <Link
          href="/"
          className="inline-flex items-center text-[#F9A03F] hover:text-[#e8911e] font-semibold text-base sm:text-lg"
        >
          ← Retour à l’accueil
        </Link>
      </div>
    </div>
  )
}
