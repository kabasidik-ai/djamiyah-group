import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ChambresContent from '@/components/chambres/ChambresContent'

export const metadata: Metadata = {
  title: 'Chambres & Suites | Groupe Djamiyah',
  description:
    "Chambres et suites à l'Hôtel Maison Blanche (Coyah) et à l'Hôtel Rama (Kissidougou). Confort, climatisation, Wi-Fi et services personnalisés pour un séjour réussi.",
}

export default function ChambresPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <section className="relative h-[42vh] min-h-[380px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/corporate/hotel-maison-blanche-aerien.webp"
          alt="Chambres et suites Groupe Djamiyah"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4">
          <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-4">
            Groupe Djamiyah
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] mb-4">
            Chambres &amp; Suites
          </h1>
          <p className="text-lg md:text-xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Choisissez votre séjour à Coyah ou Kissidougou et trouvez la chambre adaptée à vos
            besoins.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Link
              href="#chambres"
              className="inline-flex items-center justify-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
            >
              Voir les chambres
            </Link>
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-full border border-white/30 transition-colors"
            >
              Réserver maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENU INTERACTIF (sélecteur hôtels, cartes chambres, sections) */}
      <ChambresContent />

      <div className="text-center py-12">
        <Link
          href="/"
          className="inline-flex items-center text-[#F9A03F] hover:text-[#e8911e] font-semibold text-base sm:text-lg"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
