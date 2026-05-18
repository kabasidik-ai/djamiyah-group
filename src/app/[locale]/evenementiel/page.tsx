import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { conferences } from '@/data/content'

export const metadata: Metadata = {
  title: 'Salles de Conférences à Coyah | Hôtel Maison Blanche',
  description:
    "Organisez vos conférences, séminaires et réunions professionnelles à l'Hôtel Maison Blanche de Coyah. 4 salles équipées pour 20 à 150 personnes.",
}

export default function EvenementielPage() {
  const eventTypes = [
    {
      name: "Séminaires d'entreprise",
      description: 'Séminaires internes, sessions de stratégie et alignement des équipes',
    },
    {
      name: 'Conférences professionnelles',
      description: 'Rencontres sectorielles, panels et prises de parole institutionnelles',
    },
    {
      name: 'Formations et ateliers',
      description: 'Programmes de montée en compétences, workshops et sessions pratiques',
    },
    {
      name: "Réunions d'affaires",
      description: 'Comités de direction, réunions partenaires et rendez-vous exécutifs',
    },
  ]

  const corporateServices = [
    {
      title: 'Assistance à la planification',
      description: 'Accompagnement professionnel pour structurer vos séminaires et conférences.',
    },
    {
      title: 'Restauration entreprise',
      description: "Pauses-café, déjeuners d'affaires et offres adaptées au format corporate.",
    },
    {
      title: 'Support audiovisuel',
      description:
        'Configuration sur site des équipements de projection, sonorisation et présentation.',
    },
    {
      title: 'Support logistique',
      description: "Coordination d'accueil, signalétique et assistance opérationnelle le jour J.",
    },
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/heroevent.png"
          alt="Espaces événementiels"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center">
          <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-4">
            Groupe Djamiyah
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] mb-4">
            Espaces événementiels
          </h1>
          <p className="text-lg md:text-xl text-white max-w-3xl mx-auto font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] px-4">
            Le lieu idéal pour conférences, séminaires et événements professionnels à Coyah
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-6">
              Votre lieu idéal pour vos événements
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Organisez vos événements 100% corporatifs dans un cadre moderne avec des espaces
              adaptés aux séminaires, conférences, formations et réunions d&apos;affaires.
            </p>
          </div>

          {/* Facilities Grid */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center text-[#0D3B3E] mb-12">
              Nos salles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <img
                  src="/images/conference-soumbouya.webp"
                  alt="Salle de conférence Soumbouya"
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-serif text-xl font-semibold">Salle Soumbouya</h3>
                  <p className="text-white/70 text-sm mt-1">
                    Configuration en U — jusqu&apos;à 80 places
                  </p>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <img
                  src="/images/conference-maneah.webp"
                  alt="Salle de conférence Manéah"
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-serif text-xl font-semibold">Salle Manéah</h3>
                  <p className="text-white/70 text-sm mt-1">
                    Configuration théâtre — jusqu&apos;à 100 places
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {conferences.facilities.map((facility, idx) => (
                <article
                  key={idx}
                  className="bg-white rounded-2xl border border-[#EDEBE7] p-8 shadow-[0_6px_18px_rgba(17,24,39,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.08)] transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold text-[#0D3B3E] mb-3">{facility.name}</h3>
                  <p className="text-[#F9A03F] font-medium mb-4">{facility.capacity}</p>
                  <p className="text-[#6B7280] leading-relaxed mb-5">{facility.description}</p>
                  <ul className="space-y-2.5">
                    {facility.features.map((feature, fIdx) => (
                      <li key={fIdx} className="text-sm text-[#6B7280] leading-relaxed">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="bg-[#FAF9F7] rounded-3xl p-10 md:p-14 mb-20 border border-[#ECEAE6]">
            <h2 className="text-3xl font-serif font-bold text-center text-[#0D3B3E] mb-12">
              Services événementiels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {corporateServices.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-white p-7 md:p-8 rounded-2xl border border-[#EFEDE9] shadow-[0_6px_18px_rgba(17,24,39,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.08)] transition-all duration-300"
                >
                  <h4 className="text-lg font-semibold text-[#0D3B3E] mb-3">{service.title}</h4>
                  <p className="text-sm leading-relaxed text-[#6B7280]">{service.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Types */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center text-[#0D3B3E] mb-12">
              Types d&apos;événements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventTypes.map((event, idx) => (
                <div
                  key={idx}
                  className="bg-white p-7 md:p-8 rounded-2xl border border-[#E8E6E2] shadow-[0_6px_18px_rgba(17,24,39,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.08)] transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-[#0D3B3E] mb-3">{event.name}</h3>
                  <p className="text-[#6B7280] leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-[#0D3B3E] to-[#0D3B3E]/80 rounded-3xl p-10 md:p-14 mb-20 text-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-center mb-8">
                Formules événements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: 'Formule Demi-journée',
                    price: 'À partir de 1 500 000 GNF',
                    description: 'Idéale pour réunions exécutives et ateliers courts',
                    features: ["Jusqu'à 50 invités", 'Équipement AV de base', 'Pause-café'],
                  },
                  {
                    name: 'Formule Journée complète',
                    price: 'À partir de 2 500 000 GNF',
                    description: "Conçue pour conférences et séminaires d'entreprise",
                    features: [
                      "Jusqu'à 150 invités",
                      'Configuration AV complète',
                      'Restauration incluse',
                      'Coordinateur événementiel',
                    ],
                    popular: true,
                  },
                  {
                    name: 'Formule Sur mesure',
                    price: 'Nous contacter',
                    description: 'Solutions adaptées aux besoins spécifiques de votre organisation',
                    features: [
                      'Capacité flexible',
                      'Services personnalisés',
                      'Accompagnement complet',
                      'Traitement VIP',
                    ],
                  },
                ].map((pkg, idx) => (
                  <div
                    key={idx}
                    className={`bg-white/10 backdrop-blur-sm rounded-2xl p-7 md:p-8 border border-white/20 transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 ${pkg.popular ? 'ring-2 ring-[#F9A03F]' : ''}`}
                  >
                    {pkg.popular && (
                      <div className="text-center mb-4">
                        <span className="bg-[#F9A03F] text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Le plus choisi
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                    <div className="text-2xl font-bold mb-3 text-[#F9A03F]">{pkg.price}</div>
                    <p className="text-gray-200 mb-4">{pkg.description}</p>
                    <ul className="space-y-2.5">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="text-sm text-white/90 leading-relaxed">
                          ✓ {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mb-16">
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white font-semibold px-8 py-4 rounded-full shadow-[0_4px_16px_rgba(249,160,63,0.40)] hover:shadow-[0_6px_24px_rgba(249,160,63,0.55)] transition-all duration-200 hover:scale-[1.03]"
            >
              Réserver un espace événementiel
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center text-[#F9A03F] hover:text-[#e8911e] font-semibold text-base sm:text-lg"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
