import Link from 'next/link'
import Image from 'next/image'
import { maisonBlanche, rama } from '@/data/hotels'
import { VideoHero } from '@/components/VideoHero'

// ─── Galerie premium (16 visuels existants, variés, sans doublons proches) ───
const GALLERY = [
  {
    src: '/images/corporate/hotel-maison-blanche-aerien.webp',
    alt: 'Hôtel Maison Blanche — vue aérienne',
  },
  {
    src: '/images/hotel-rama-kissidougou.webp',
    alt: 'Hôtel Rama — Kissidougou',
  },
  {
    src: '/images/maison-blanche/suite-prestige.jpg',
    alt: 'Suite Prestige — Hôtel Maison Blanche',
  },
  {
    src: '/images/maison-blanche/chambre-premium.jpg',
    alt: 'Chambre Premium — Hôtel Maison Blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/suite-prestige-salon-02-gallery.webp',
    alt: 'Salon Suite Prestige — Hôtel Maison Blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/chambre-lifestyle-detente-01-gallery.webp',
    alt: 'Chambre — détente',
  },
  {
    src: '/images/rama-confort.jpg',
    alt: 'Chambre Confort — Hôtel Rama',
  },
  {
    src: '/images/rama-double-premium.jpg',
    alt: 'Double Premium — Hôtel Rama',
  },
  {
    src: '/images/corporate/restaurant-service.webp',
    alt: 'Restaurant Groupe Djamiyah',
  },
  {
    src: '/2Djamiyahgalleryphoto/restaurant-fruits-buffet-01-gallery.webp',
    alt: 'Restaurant — buffet fruits',
  },
  {
    src: '/2Djamiyahgalleryphoto/restaurant-diner-chandelle-01-gallery.webp',
    alt: 'Restaurant — dîner aux chandelles',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-piscine-cocotiers-01-gallery.webp',
    alt: 'Piscine — cocotiers',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-lagune-belvedere-01-gallery.webp',
    alt: 'Espace lagune — belvédère',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-piscine-exterieur-01-gallery.webp',
    alt: 'Piscine — extérieur',
  },
  {
    src: '/images/conference-soumbouya.webp',
    alt: 'Salle de conférence Soumbouya',
  },
  {
    src: '/2Djamiyahgalleryphoto/evenement-independance-groupe-01-gallery.webp',
    alt: 'Événement — Groupe Djamiyah',
  },
]

// ─── Aperçu chambres (3 catégories représentatives, sans inventer) ───
const HIGHLIGHT_ROOMS = [
  {
    name: 'Chambre Confort',
    price: '520 000 GNF / nuit',
    image: '/images/maison-blanche/chambre-confort.jpg',
    alt: 'Chambre Confort — Hôtel Maison Blanche',
  },
  {
    name: 'Double Premium',
    price: '870 000 GNF / nuit',
    image: '/images/maison-blanche/double-premium.jpg',
    alt: 'Double Premium — Hôtel Maison Blanche',
  },
  {
    name: 'Suite Prestige',
    price: '1 520 000 GNF / nuit',
    image: '/images/maison-blanche/suite-prestige.jpg',
    alt: 'Suite Prestige — Hôtel Maison Blanche',
  },
]

// ─── FAQ (2 hôtels, paiement aligné sur ChapChap) ───
const FAQ = [
  {
    q: 'Où sont situés les hôtels Djamiyah ?',
    a: 'Le Groupe Djamiyah compte deux établissements : l’Hôtel Maison Blanche à Coyah et l’Hôtel Rama à Kissidougou.',
  },
  {
    q: 'Comment réserver une chambre ?',
    a: 'Sélectionnez votre hôtel, votre chambre et vos dates via le parcours de réservation. Chaque demande est confirmée par notre équipe.',
  },
  {
    q: 'Comment payer ma réservation ?',
    a: 'Le paiement sécurisé est finalisé via ChapChap Pay. Les moyens disponibles sont proposés au moment du paiement.',
  },
  {
    q: 'Puis-je organiser un événement ?',
    a: 'Oui. Maison Blanche dispose de salles de 20 à 150 places et Hôtel Rama d’une salle de conférence de 70 places. Voir la page Salles & Conférences.',
  },
  {
    q: 'Comment contacter Maison Blanche ?',
    a: 'Par téléphone au +224 610 75 90 90 ou +224 625 42 42 23.',
  },
  {
    q: 'Comment contacter Hôtel Rama ?',
    a: 'Réception au +224 614 14 82 12, Direction au +224 614 14 82 14.',
  },
  {
    q: 'Hôtel Rama propose-t-il la demi-journée pour sa salle ?',
    a: 'Oui, la salle de conférence de Hôtel Rama peut être louée à la demi-journée. À Maison Blanche, la location est à la journée.',
  },
  {
    q: 'Le restaurant est-il accessible sans séjour ?',
    a: 'Oui, le restaurant est ouvert à tous. Contactez l’établissement pour vérifier la disponibilité du jour.',
  },
]

const SERVICES_MB = maisonBlanche.amenities.slice(0, 4)
const SERVICES_RAMA = rama.amenities.slice(0, 4)

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* HERO GROUPE */}
      <VideoHero
        videoSrc="/images/corporate/hero-video.mp4"
        poster="/images/corporate/hero-fallback.jpg"
        fallbackImage="/images/corporate/hero-fallback.jpg"
        alt="Groupe Djamiyah — Hôtel Maison Blanche et Hôtel Rama"
      />

      {/* ─── NOS HÔTELS ─── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-3">
              Nos hôtels
            </h2>
            <p className="text-lg text-gray-600">
              Deux destinations, une même exigence d’hospitalité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Maison Blanche */}
            <article className="group flex flex-col bg-white rounded-2xl border border-[#EDEBE7] overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.08)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,24,39,0.12)] transition-all duration-300">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/corporate/hotel-maison-blanche-aerien.webp"
                  alt="Hôtel Maison Blanche — Coyah"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-white font-serif text-2xl font-semibold">
                  Maison Blanche — Coyah
                </h3>
              </div>
              <div className="p-7">
                <p className="text-sm text-gray-500 mb-5">Coyah, Guinée — Route Nationale</p>
                <ul className="space-y-2">
                  {SERVICES_MB.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 bg-[#F9A03F] rounded-full flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/hotels"
                    className="flex-1 inline-flex items-center justify-center bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    Découvrir Maison Blanche
                  </Link>
                  <Link
                    href="/reservation"
                    className="flex-1 inline-flex items-center justify-center border-2 border-[#0D3B3E]/20 text-[#0D3B3E] hover:bg-[#0D3B3E] hover:text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    Réserver
                  </Link>
                </div>
              </div>
            </article>

            {/* Hôtel Rama */}
            <article className="group flex flex-col bg-white rounded-2xl border border-[#EDEBE7] overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.08)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,24,39,0.12)] transition-all duration-300">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/hotel-rama-kissidougou.webp"
                  alt="Hôtel Rama — Kissidougou"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-white font-serif text-2xl font-semibold">
                  Hôtel Rama — Kissidougou
                </h3>
              </div>
              <div className="p-7">
                <p className="text-sm text-gray-500 mb-5">Kissidougou, Guinée</p>
                <ul className="space-y-2">
                  {SERVICES_RAMA.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 bg-[#F9A03F] rounded-full flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/hotels"
                    className="flex-1 inline-flex items-center justify-center bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    Découvrir Hôtel Rama
                  </Link>
                  <Link
                    href="/reservation?hotel=rama"
                    className="flex-1 inline-flex items-center justify-center border-2 border-[#0D3B3E]/20 text-[#0D3B3E] hover:bg-[#0D3B3E] hover:text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    Réserver
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─── CHAMBRES & SUITES — APERÇU ─── */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-3">
              Chambres &amp; Suites
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un aperçu de nos hébergements. Découvrez l’ensemble des catégories et les tarifs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HIGHLIGHT_ROOMS.map((room) => (
              <article
                key={room.name}
                className="group flex flex-col bg-white rounded-2xl border border-[#EDEBE7] overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.1)] transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={room.image}
                    alt={room.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-[#0D3B3E] mb-3">{room.name}</h3>
                  <p className="text-2xl font-bold text-[#F9A03F]">{room.price}</p>
                  <Link
                    href="/chambres"
                    className="mt-4 w-full inline-flex items-center justify-center bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                  >
                    Voir les chambres
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/chambres"
              className="inline-flex items-center gap-2 bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              Voir toutes les chambres &amp; suites
            </Link>
          </div>
        </div>
      </section>

      {/* ─── RESTAURANT — BLOC ÉDITORIAL ─── */}
      <section className="py-20 bg-gradient-to-r from-[#FFF8F0] to-[#FFF4E6]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              <Image
                src="/images/corporate/restaurant-service.webp"
                alt="Restaurant Groupe Djamiyah — Maison Blanche Coyah"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-white/90 text-sm">
                Maison Blanche — Coyah
              </p>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-2">
                Restaurant Djamiyah
              </h2>
              <p className="text-sm text-gray-500 mb-4">Maison Blanche — Coyah</p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Cuisine internationale et locale dans un cadre élégant, avec terrasse sur la
                mangrove.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/restaurant"
                  className="flex-1 inline-flex items-center justify-center bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Découvrir le restaurant
                </Link>
                <Link
                  href="/restaurant"
                  className="flex-1 inline-flex items-center justify-center border-2 border-[#0D3B3E]/25 text-[#0D3B3E] hover:bg-[#0D3B3E] hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Voir le menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ÉVÉNEMENTIEL — APERÇU GROUPE ─── */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-3">
              Réunions, conférences &amp; événements
            </h2>
            <p className="text-lg text-gray-600">
              Des espaces adaptés à vos événements à Coyah et à Kissidougou.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-[#EDEBE7] shadow-[0_6px_18px_rgba(17,24,39,0.06)]">
              <h3 className="text-xl font-serif font-bold text-[#0D3B3E] mb-2">
                Maison Blanche — Coyah
              </h3>
              <p className="text-gray-600 mb-6">
                Salles événementielles de 20 à 150 places, à la journée.
              </p>
              <Link
                href="/evenementiel"
                className="w-full inline-flex items-center justify-center bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Découvrir nos salles
              </Link>
            </div>
            <div className="bg-white p-7 rounded-2xl border border-[#EDEBE7] shadow-[0_6px_18px_rgba(17,24,39,0.06)]">
              <h3 className="text-xl font-serif font-bold text-[#0D3B3E] mb-2">
                Hôtel Rama — Kissidougou
              </h3>
              <p className="text-gray-600 mb-6">
                Salle de conférence de 70 places, à la demi-journée ou à la journée.
              </p>
              <Link
                href="/evenementiel"
                className="w-full inline-flex items-center justify-center bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Découvrir nos salles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POURQUOI DJAMIYAH ? ─── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-3">
              Pourquoi Djamiyah ?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]">
              <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">Deux destinations</h3>
              <p className="text-sm text-gray-600">
                Coyah et Kissidougou, un même standard d’hospitalité.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]">
              <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">
                Hébergement &amp; restauration
              </h3>
              <p className="text-sm text-gray-600">Chambres et suites, restaurants sur place.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]">
              <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">Espaces événementiels</h3>
              <p className="text-sm text-gray-600">
                Salles de réunion et de conférence dans les deux hôtels.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]">
              <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">Réservation en ligne</h3>
              <p className="text-sm text-gray-600">
                Parcours de réservation simple et paiement sécurisé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── GALERIE (8 visuels) ─── */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end md:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-3">
                Galerie
              </h2>
              <p className="text-gray-600">Un aperçu de nos chambres, espaces et services.</p>
            </div>
            <Link
              href="/galerie"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#0D3B3E]/20 text-[#0D3B3E] hover:bg-[#0D3B3E] hover:text-white transition-colors"
            >
              Découvrir la galerie
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {GALLERY.map((g) => (
              <div key={g.src} className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] text-center mb-10">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {FAQ.map((item, idx) => (
                <details
                  key={idx}
                  className="group bg-white border border-gray-200 rounded-xl shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="list-none cursor-pointer flex items-center justify-between px-6 py-5">
                    <span className="text-lg font-semibold text-[#0D3B3E] pr-4">{item.q}</span>
                    <span className="text-2xl text-[#F9A03F] leading-none group-open:hidden">
                      +
                    </span>
                    <span className="text-2xl text-[#F9A03F] leading-none hidden group-open:inline">
                      −
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100">
                    <p className="pt-4">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B3E] to-[#0D3B3E]/85" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Prêt à organiser votre séjour ?
          </h2>
          <p className="text-white/80 text-lg mb-6 max-w-2xl mx-auto">
            Choisissez votre hôtel et finalisez votre réservation en quelques étapes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-center">
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              Réserver maintenant
            </Link>
            <Link
              href="/hotels"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/30 transition-colors"
            >
              Voir nos hôtels
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
