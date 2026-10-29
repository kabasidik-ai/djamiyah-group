import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import GroupRequestContent from '@/components/group-request/GroupRequestContent'

export const metadata: Metadata = {
  title: 'Groupes & Séminaires | Hôtel Maison Blanche — Groupe Djamiyah',
  description:
    'Organisez séminaires, conférences, formations, réunions et autres événements professionnels à Coyah. Demandez une proposition : la disponibilité et les prestations sont vérifiées par notre équipe.',
}

export default function GroupesSeminairesPage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative h-[46vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/conference-soumbouya.webp"
          alt="Salles Groupes et Séminaires — Hôtel Maison Blanche Coyah"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="inline-block font-sans text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#F9A03F] bg-[#0D3B3E]/45 backdrop-blur px-4 py-1.5 rounded-full mb-5">
            Groupe Djamiyah — Hôtel Maison Blanche · Coyah
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]">
            Groupes &amp; Séminaires
          </h1>
          <span
            aria-hidden="true"
            className="mx-auto my-5 block h-0.5 w-16 rounded-full bg-gradient-to-r from-[#F9A03F] to-[#d9821b]"
          />
          <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Séminaires, conférences, formations, réunions et autres événements professionnels — un
            cadre conçu pour vos équipes à Coyah.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-white/85">
            <span className="inline-flex items-center gap-2">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Vérification par notre équipe
            </span>
            <span className="inline-flex items-center gap-2">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              Proposition après étude de votre demande
            </span>
            <span className="inline-flex items-center gap-2">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Aucun engagement avant proposition
            </span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <a
              href="#formulaire"
              className="inline-flex items-center justify-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-7 py-3.5 rounded-full transition-colors shadow-[0_6px_22px_rgba(249,160,63,0.35)]"
            >
              Demander une proposition
            </a>
            <a
              href="#salles"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-full border border-white/30 transition-colors"
            >
              Voir les salles
            </a>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <GroupRequestContent />

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
