'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Wifi, Thermometer, Tv, Car, Utensils, Waves } from 'lucide-react'
import { rooms, ramaRooms, roomImages } from '@/data/content'

// ─── Données strictement issues des sources existantes (aucun tarif ni capacité inventés) ───
// Capacité réellement documentée dans les données (Double Premium = jusqu'à 4 personnes),
// les autres ne portent pas de capacité explicite → on n'affiche que ce qui existe.
const COYAH = rooms
const RAMA = ramaRooms

function capaciteSalle(name: string): string | null {
  // Capacité uniquement si explicitement présente dans la description des données
  if (name.includes('Double Premium') || name.includes('Double'))
    return 'Capacité maximale : 4 personnes'
  return null
}

function imagePrincipale(slug: string): string | null {
  const gallery = roomImages[slug]
  if (gallery && gallery.length > 0) return gallery[0]
  return null
}

type ChoixCible = { hotel: 'coyah' | 'rama'; slug: string; label: string }

const CHOIX: { titre: string; desc: string; chambre: string; cible: ChoixCible }[] = [
  {
    titre: 'Couple / séjour court',
    desc: 'Un séjour confortable et fonctionnel à deux.',
    chambre: 'Chambre Confort · Maison Blanche',
    cible: { hotel: 'coyah', slug: 'chambre-confort', label: 'Chambre Confort' },
  },
  {
    titre: 'Plus de confort',
    desc: 'Plus d’espace et d’équipements pour se détendre.',
    chambre: 'Chambre Premium · Maison Blanche',
    cible: { hotel: 'coyah', slug: 'chambre-premium', label: 'Chambre Premium' },
  },
  {
    titre: 'Famille / petit groupe',
    desc: 'Un espace généreux jusqu’à 4 personnes.',
    chambre: 'Double Premium · Coyah ou Rama',
    cible: { hotel: 'coyah', slug: 'double-premium', label: 'Double Premium' },
  },
  {
    titre: 'Suite premium',
    desc: 'De la Suite Premium à la Suite Prestige, l’exception.',
    chambre: 'Suites · Maison Blanche',
    cible: { hotel: 'coyah', slug: 'suite-premium', label: 'Suite Premium' },
  },
  {
    titre: 'Séjour à Kissidougou',
    desc: 'Le standing Djamiyah dans la capitale du café.',
    chambre: 'Confort & Double Premium · Hôtel Rama',
    cible: { hotel: 'rama', slug: 'rama-confort', label: 'Chambre Confort — Hôtel Rama' },
  },
]

const SERVICES = [
  { icon: Wifi, title: 'Wi-Fi', desc: 'Connexion haut débit' },
  { icon: Thermometer, title: 'Climatisation', desc: 'Confort dans chaque chambre' },
  { icon: Utensils, title: 'Restaurant', desc: 'Cuisine sur place' },
  { icon: Car, title: 'Parking', desc: 'Parking sécurisé' },
  { icon: Waves, title: 'Piscine', desc: 'Piscine à Maison Blanche' },
  { icon: Tv, title: 'TV écran plat', desc: 'Télévision moderne' },
]

export default function ChambresContent() {
  const [hotel, setHotel] = useState<'coyah' | 'rama'>('coyah')
  const liste = hotel === 'coyah' ? COYAH : RAMA

  const goToChoix = (cible: ChoixCible) => {
    setHotel(cible.hotel)
    // Attendre la prochaine frame pour que la grille de l'hôtel cible soit rendue
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = document.getElementById(`chambre-${cible.slug}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  return (
    <section id="chambres" className="py-16 md:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sélecteur d'hôtels */}
        <div
          className="mt-10 flex justify-center gap-3 rounded-2xl bg-gray-100 p-2 sm:p-3"
          role="tablist"
          aria-label="Sélectionner un hôtel"
        >
          <button
            type="button"
            role="tab"
            aria-selected={hotel === 'coyah'}
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
            role="tab"
            aria-selected={hotel === 'rama'}
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

        {/* En-tête section */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-[#F9A03F] font-semibold mb-2">
            {hotel === 'coyah' ? 'Maison Blanche — Coyah' : 'Hôtel Rama — Kissidougou'}
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#0D3B3E] mb-3">
            {hotel === 'coyah' ? 'Nos chambres à Coyah' : 'Nos chambres à Kissidougou'}
          </h2>
          <p className="text-gray-600">
            {hotel === 'coyah'
              ? 'Sélectionnez la chambre adaptée à votre séjour. Tarif par nuit.'
              : 'Chambres Confort et Double Premium, dans le standing Djamiyah. Tarif par nuit.'}
          </p>
        </div>

        {/* Cartes chambres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {liste.map((room) => {
            const img = imagePrincipale(room.slug)
            const formattedPrice = room.price.toLocaleString('fr-FR')
            const cap = capaciteSalle(room.name)
            return (
              <article
                key={room.slug}
                id={`chambre-${room.slug}`}
                data-hotel={hotel}
                className="group flex flex-col bg-white rounded-2xl border border-[#EDEBE7] overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.10)] transition-all duration-300"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {img ? (
                    <Image
                      src={img}
                      alt={room.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-[#0D3B3E] to-[#0D3B3E]/90">
                      <span className="sr-only">{room.imageAlt}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#0D3B3E]/85 text-white text-[11px] px-2.5 py-1 rounded-full">
                    {hotel === 'coyah' ? 'Maison Blanche' : 'Hôtel Rama'}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 flex flex-col">
                  <h3 className="text-xl font-serif font-bold text-[#0D3B3E] mb-1">{room.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {hotel === 'coyah' ? 'Coyah, Guinée' : 'Kissidougou, Guinée'}
                  </p>

                  {cap && <p className="text-xs text-gray-500 mb-2">{cap}</p>}

                  {/* Prix */}
                  <div className="border-t border-gray-200 pt-3 mb-3">
                    <span className="text-2xl font-bold text-[#F9A03F]">{formattedPrice} GNF</span>
                    <span className="text-sm font-normal text-gray-500 ml-1">/ nuit</span>
                  </div>

                  {/* Équipements (max 5, issus des données) */}
                  <ul className="flex flex-wrap gap-1.5 mb-4">
                    {room.features.slice(0, 5).map((feature) => (
                      <li
                        key={feature}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-[#0D3B3E]/8 text-[#0D3B3E]"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <p className="text-[11px] text-gray-400 mb-4">
                    Réservation sécurisée · Paiement via le parcours de réservation
                  </p>

                  {/* CTA */}
                  <Link
                    href={hotel === 'coyah' ? '/reservation' : '/reservation?hotel=rama'}
                    className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    Réserver cette chambre
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

        {/* Quelle chambre choisir ? */}
        <div id="choisir" className="mt-20 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
              Quelle chambre choisir ?
            </h2>
            <p className="text-lg text-gray-600">Un repère simple selon votre type de séjour.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHOIX.map((c) => (
              <button
                type="button"
                key={c.titre}
                onClick={() => goToChoix(c.cible)}
                aria-label={`Voir ${c.titre} — ${c.chambre}`}
                className="group text-left bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0D3B3E]/40 hover:shadow-[0_12px_28px_rgba(17,24,39,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D3B3E] w-full"
              >
                <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">{c.titre}</h3>
                <p className="text-sm text-gray-600 mb-4">{c.desc}</p>
                <p className="text-sm font-medium text-[#F9A03F]">{c.chambre}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div id="services" className="mt-20 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
              Services &amp; équipements
            </h2>
            <p className="text-lg text-gray-600">
              Les services de l’hôtel pour un séjour confortable.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="bg-white p-5 rounded-xl text-center hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-3">
                  <s.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#F9A03F]" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base mb-1">{s.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA FINAL */}
        <div className="mt-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B3E] to-[#0D3B3E]/85" />
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Prêt à réserver votre séjour ?
            </h2>
            <p className="text-white/80 text-lg mb-6 max-w-2xl mx-auto">
              Choisissez votre hôtel, votre chambre et finalisez votre réservation en quelques
              étapes.
            </p>
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-8 py-4 rounded-full shadow-[0_4px_16px_rgba(249,160,63,0.40)] transition-colors"
            >
              Réserver une chambre
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
