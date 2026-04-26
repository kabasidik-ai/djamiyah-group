import Link from 'next/link'
import Image from 'next/image'
import { conferences } from '@/data/content'

export default function ConferencesPage() {
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
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center">
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
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
              Votre lieu idéal pour vos événements
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Organisez vos événements 100% corporatifs dans un cadre moderne avec des espaces
              adaptés aux séminaires, conférences, formations et réunions d&apos;affaires.
            </p>
          </div>

          {/* Facilities Grid */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Nos salles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <img
                  src="/images/conference-soumbouya.webp"
                  alt="Salle de conférence Soumbouya"
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{facility.name}</h3>
                  <p className="text-primary font-medium mb-4">{facility.capacity}</p>
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
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Services événementiels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {corporateServices.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-white p-7 md:p-8 rounded-2xl border border-[#EFEDE9] shadow-[0_6px_18px_rgba(17,24,39,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.08)] transition-all duration-300"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">{service.title}</h4>
                  <p className="text-sm leading-relaxed text-[#6B7280]">{service.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Types */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Types d&apos;événements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventTypes.map((event, idx) => (
                <div
                  key={idx}
                  className="bg-white p-7 md:p-8 rounded-2xl border border-[#E8E6E2] shadow-[0_6px_18px_rgba(17,24,39,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.08)] transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{event.name}</h3>
                  <p className="text-[#6B7280] leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Packages */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-10 md:p-14 mb-20 text-white">
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
                    className={`bg-white/10 backdrop-blur-sm rounded-2xl p-7 md:p-8 border border-white/20 transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 ${pkg.popular ? 'ring-2 ring-white' : ''}`}
                  >
                    {pkg.popular && (
                      <div className="text-center mb-4">
                        <span className="bg-white text-primary px-3 py-1 rounded-full text-sm font-semibold">
                          Le plus choisi
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                    <div className="text-2xl font-bold mb-3">{pkg.price}</div>
                    <p className="text-gray-200 mb-4">{pkg.description}</p>
                    <ul className="space-y-2.5">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="text-sm text-white/90 leading-relaxed">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-200 mt-8">
                Toutes les formules incluent l&apos;installation de base et le nettoyage. Services
                additionnels disponibles sur demande.
              </p>
            </div>
          </div>

          {/* Event Inquiry Form */}
          <div className="mb-20">
            <div className="bg-white rounded-3xl border border-[#EDEBE7] shadow-[0_8px_24px_rgba(17,24,39,0.06)] p-8 md:p-12">
              <h2 className="text-3xl font-serif font-bold text-center mb-8">
                Organisez votre événement
              </h2>
              <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                Décrivez vos besoins et notre équipe vous contactera avec des recommandations
                personnalisées et une proposition détaillée.
              </p>

              <form className="space-y-6 max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Personne de contact</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nom complet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Organisation</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Entreprise ou organisation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="contact@djamiyah.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+224 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type d&apos;événement</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Sélectionner un type</option>
                      <option value="seminar">Séminaire d&apos;entreprise</option>
                      <option value="conference">Conférence professionnelle</option>
                      <option value="training">Formation / atelier</option>
                      <option value="meeting">Réunion d&apos;affaires</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre d&apos;invités</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nombre de participants"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Détails de l&apos;événement
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Parlez-nous de vos besoins, dates souhaitées et demandes particulières..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-amber-600 text-white px-8 py-3.5 rounded-full font-semibold transition-colors"
                  >
                    Demander un devis
                  </button>
                  <p className="text-gray-500 text-sm mt-4">
                    Nous vous répondrons sous 24 heures avec une proposition détaillée
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Témoignages clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    'Le lieu parfait pour notre conférence annuelle. Équipe professionnelle et excellentes installations.',
                  author: 'Marie Diop',
                  position: 'Responsable Événementiel, TechCorp Africa',
                },
                {
                  quote:
                    "Nos séminaires de direction se déroulent toujours dans d'excellentes conditions, avec un service fiable et réactif.",
                  author: 'Kadiatou Barry',
                  position: 'Directrice RH, Groupe Horizon',
                },
                {
                  quote:
                    "Un cadre idéal pour nos séminaires de formation. Équipements modernes, service impeccable et une équipe à l'écoute de nos besoins.",
                  author: 'Sidiki Kaba',
                  position: 'Consultant en transformation digitale, Stratège numérique — Webfacil',
                },
              ].map((testimonial, idx) => (
                <article
                  key={idx}
                  className="bg-white p-7 rounded-2xl border border-[#EDEBE7] shadow-[0_6px_18px_rgba(17,24,39,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(17,24,39,0.08)] transition-all duration-300"
                >
                  <p className="text-[#6B7280] italic mb-4 leading-relaxed">{testimonial.quote}</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.position}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
