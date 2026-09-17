'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { conferences } from '@/data/content'
import { rama } from '@/data/hotels'

function usageSalle(name: string): string {
  switch (name) {
    case 'Wonkifon':
      return 'Réunions exécutives & séminaires'
    case 'Somayah':
      return 'Conférences de taille moyenne'
    case 'Maneah':
      return 'Formations & événements professionnels'
    case 'Soumbouyah':
      return 'Congrès & grands événements'
    default:
      return 'Événements professionnels'
  }
}

function imageSalle(name: string): string | null {
  switch (name) {
    case 'Maneah':
      return '/images/conference-maneah.webp'
    case 'Soumbouyah':
      return '/images/conference-soumbouya.webp'
    default:
      return null
  }
}

const SALLES_COYAH = conferences.facilities.map((f) => ({
  name: f.name,
  capacity: f.capacity,
  prix: `${f.price.toLocaleString('fr-FR')} GNF / jour`,
  usage: usageSalle(f.name),
  image: imageSalle(f.name),
}))

const CHOIX = [
  {
    titre: 'Petite réunion',
    desc: 'Entretiens, comités restreints et ateliers.',
    salle: 'Wonkifon — jusqu’à 20 places',
  },
  {
    titre: 'Formation',
    desc: 'Sessions de montée en compétences et workshops.',
    salle: 'Somayah — jusqu’à 50 places',
  },
  {
    titre: 'Conférence moyenne',
    desc: 'Séminaires et conférences professionnelles.',
    salle: 'Maneah — jusqu’à 75 places',
  },
  {
    titre: 'Grand événement',
    desc: 'Congrès et manifestations d’envergure.',
    salle: 'Soumbouyah — jusqu’à 150 places',
  },
  {
    titre: 'Conférence à Kissidougou',
    desc: 'Salle de conférence Hôtel Rama, 70 places.',
    salle: 'Demi-journée 1 000 000 · Journée 2 000 000 GNF',
  },
]

const ETAPES = [
  {
    num: '1',
    titre: 'Choisissez votre salle',
    desc: 'Sélectionnez l’hôtel et la salle adaptée à votre événement.',
  },
  {
    num: '2',
    titre: 'Vérifiez les détails',
    desc: 'Capacité, tarif et options avant confirmation.',
  },
  {
    num: '3',
    titre: 'Réservez & payez',
    desc: 'Finalisez votre réservation et le paiement sécurisé.',
  },
]

export default function EvenementielContent() {
  const [hotel, setHotel] = useState<'coyah' | 'rama'>('coyah')
  const ramaConf = rama.conference

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
            Nos deux établissements
          </h2>
          <p className="text-lg text-gray-600">
            Choisissez votre lieu : Maison Blanche à Coyah ou Hôtel Rama à Kissidougou.
          </p>
        </div>

        <div className="flex justify-center gap-3 rounded-2xl bg-gray-100 p-2 sm:p-3">
          <button
            type="button"
            onClick={() => setHotel('coyah')}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition sm:text-base ${
              hotel === 'coyah'
                ? 'bg-white text-[#0D3B3E] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Maison Blanche — Coyah
          </button>
          <button
            type="button"
            onClick={() => setHotel('rama')}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition sm:text-base ${
              hotel === 'rama'
                ? 'bg-white text-[#0D3B3E] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Hôtel Rama — Kissidougou
          </button>
        </div>

        {/* COYAH / MAISON BLANCHE */}
        {hotel === 'coyah' && (
          <div id="salles" className="mt-14 scroll-mt-24">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-[#F9A03F] font-semibold mb-2">
                Maison Blanche — Coyah
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#0D3B3E] mb-3">
                Nos salles à Coyah
              </h3>
              <p className="text-gray-600">
                Location à la journée uniquement, dans un cadre hôtelier moderne.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SALLES_COYAH.map((salle) => (
                <article
                  key={salle.name}
                  className="group flex flex-col bg-white rounded-2xl border border-[#EDEBE7] overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.10)] transition-all duration-300"
                >
                  <div className="relative h-56 overflow-hidden">
                    {salle.image ? (
                      <Image
                        src={salle.image}
                        alt={`Salle ${salle.name} - Maison Blanche Coyah`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-[#0D3B3E] to-[#0D3B3E]/90" />
                    )}
                    {salle.image && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    )}
                    <div className="absolute top-3 left-3 bg-[#0D3B3E]/85 text-white text-[11px] px-2.5 py-1 rounded-full">
                      Maison Blanche
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-xl font-serif font-bold text-[#0D3B3E] mb-1">
                      {salle.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">{salle.usage}</p>

                    <dl className="flex justify-between items-center border-t border-gray-200 pt-3">
                      <div className="text-sm">
                        <span className="block text-[11px] uppercase tracking-wide text-gray-400">
                          Capacité
                        </span>
                        <span className="font-semibold text-[#0D3B3E]">{salle.capacity}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] uppercase tracking-wide text-gray-400">
                          Tarif journée
                        </span>
                        <span className="font-bold text-[#F9A03F] text-lg">{salle.prix}</span>
                      </div>
                    </dl>

                    <Link
                      href="/reservation"
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                    >
                      Réserver cette salle
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* RAMA / KISSIDOUGOU */}
        {hotel === 'rama' && ramaConf && (
          <div id="salles" className="mt-14 scroll-mt-24">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-[#F9A03F] font-semibold mb-2">
                Hôtel Rama — Kissidougou
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#0D3B3E] mb-3">
                Salle de conférence Rama
              </h3>
            </div>

            <article className="flex flex-col md:flex-row bg-white rounded-2xl border border-[#EDEBE7] overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.06)]">
              <div className="md:w-1/2 relative min-h-[280px]">
                <Image
                  src="/images/hotel-rama-kissidougou.webp"
                  alt="Salle de conférence Hôtel Rama - Kissidougou"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 left-3 bg-[#0D3B3E]/85 text-white text-[11px] px-2.5 py-1 rounded-full">
                  Hôtel Rama
                </div>
              </div>

              <div className="md:w-1/2 p-8 flex flex-col">
                <h4 className="text-2xl font-serif font-bold text-[#0D3B3E] mb-2">
                  Salle de conférence
                </h4>
                <p className="text-sm text-gray-500 mb-6">
                  Conférences, séminaires et formations à Kissidougou.
                </p>

                <dl className="flex items-center justify-between rounded-xl border border-[#F9A03F]/40 bg-[#F0F7F7] p-3.5 mb-3">
                  <dt className="text-sm text-gray-600">Capacité</dt>
                  <dd className="font-semibold text-[#0D3B3E]">{ramaConf.capacity}</dd>
                </dl>

                <dl className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/70 p-3.5 mb-3">
                  <dt className="text-sm text-gray-600">Demi-journée</dt>
                  <dd className="font-bold text-[#F9A03F]">{ramaConf.halfDayPrice}</dd>
                </dl>

                <dl className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/70 p-3.5 mb-6">
                  <dt className="text-sm text-gray-600">Journée complète</dt>
                  <dd className="font-bold text-[#0D3B3E]">{ramaConf.fullDayPrice}</dd>
                </dl>

                <Link
                  href="/reservation?hotel=rama"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  Réserver cette salle
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* QUELLE SALLE CHOISIR ? */}
        <div id="choisir" className="mt-20 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
              Quelle salle choisir ?
            </h2>
            <p className="text-lg text-gray-600">Un repère simple selon votre type d’événement.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHOIX.map((c) => (
              <div
                key={c.titre}
                className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]"
              >
                <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">{c.titre}</h3>
                <p className="text-sm text-gray-600 mb-4">{c.desc}</p>
                <p className="text-sm font-medium text-[#F9A03F]">{c.salle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RÉSERVEZ EN 3 ÉTAPES */}
        <div id="etapes" className="mt-20 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
              Réservez en 3 étapes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ETAPES.map((e) => (
              <div key={e.num} className="flex flex-col items-center text-center">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#0D3B3E] text-white font-serif text-2xl mb-4">
                  {e.num}
                </span>
                <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">{e.titre}</h3>
                <p className="text-sm text-gray-600">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B3E] to-[#0D3B3E]/85" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Vous organisez un événement ?
          </h2>
          <Link
            href="/reservation"
            className="inline-flex items-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-8 py-4 rounded-full shadow-[0_4px_16px_rgba(249,160,63,0.40)] transition-colors"
          >
            Réserver une salle
          </Link>
        </div>
      </div>
    </section>
  )
}
