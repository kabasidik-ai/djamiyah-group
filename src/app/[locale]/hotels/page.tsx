import Link from 'next/link'
import {
  Award,
  MapPin,
  HeartHandshake,
  UtensilsCrossed,
  Building2,
  Headphones,
  Phone,
} from 'lucide-react'
import { hotels, hotelGroups } from '@/data/hotels'

export default function HotelsPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-primary to-accent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Nos hôtels</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Découvrez le luxe et le confort des hôtels du Groupe Djamiyah en Guinée
          </p>
        </div>
      </section>

      {/* Group Introduction */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
              {hotelGroups.djamiyah.name}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Un groupe hôtelier d&apos;excellence offrant des hébergements de qualité en Guinée.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Hébergements de luxe
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Restauration
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Salles de conférence
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Services premium
              </div>
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                id={hotel.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Hotel Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={hotel.images.exterior}
                    alt={`Vue extérieure - ${hotel.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
                      {hotel.shortName}
                    </h2>
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                        {hotel.name}
                      </h3>
                      <p className="text-secondary font-medium">{hotel.tagline}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">{hotel.description}</p>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Localisation</h4>
                    <div className="flex items-center text-gray-700">
                      <div className="w-14 h-14 rounded-xl bg-[#F0F7F7] flex items-center justify-center mr-3">
                        <MapPin className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />
                      </div>
                      <p>{hotel.location}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{hotel.address}</p>
                  </div>

                  {/* Contact & Booking */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={hotel.bookingLink}
                      className="flex-1 bg-primary hover:bg-amber-600 text-white text-center py-3.5 rounded-lg font-semibold transition-colors hover:shadow-lg"
                    >
                      Réserver
                    </Link>
                    <Link
                      href={`/contact?hotel=${hotel.id}`}
                      className="flex-1 border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary text-center py-3.5 rounded-lg font-semibold transition-colors"
                    >
                      Contacter l&apos;hôtel
                    </Link>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Téléphone</div>
                        {hotel.phone === 'À venir' ? (
                          <span className="text-gray-700 font-medium">À venir</span>
                        ) : (
                          <a
                            href={`tel:${hotel.phone}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {hotel.phone}
                          </a>
                        )}
                        {hotel.phoneSecondary && hotel.phone !== 'À venir' && (
                          <a
                            href={`tel:${hotel.phoneSecondary}`}
                            className="text-primary hover:underline font-medium block mt-1"
                          >
                            {hotel.phoneSecondary}
                          </a>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">E-mail</div>
                        {hotel.email === 'À venir' ? (
                          <span className="text-gray-700 font-medium">À venir</span>
                        ) : (
                          <a
                            href={`mailto:${hotel.email}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {hotel.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chambres */}
                  {hotel.roomCategories.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-lg font-semibold mb-3">
                        {hotel.id === 'rama' ? 'Chambres' : 'Nos chambres'}
                      </h4>
                      <div className="space-y-3">
                        {hotel.roomCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="flex items-start gap-3 bg-[#F0F7F7] rounded-xl p-3"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-[#0D3B3E]">{cat.name}</div>
                                {cat.count ? (
                                  <span className="text-xs text-gray-500 font-normal shrink-0">
                                    {cat.count} chambres
                                  </span>
                                ) : null}
                              </div>
                              {cat.priceRange && (
                                <div className="mt-0.5 font-bold text-[#F9A03F] text-base">
                                  {cat.priceRange}
                                </div>
                              )}
                              <p className="text-sm text-gray-600 leading-relaxed mt-1">
                                {cat.description}
                              </p>
                              {cat.features.length > 0 && (
                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                  {cat.features.map((feature, idx) => (
                                    <li
                                      key={idx}
                                      className="text-[11px] px-2 py-0.5 rounded-full bg-[#0D3B3E]/8 text-[#0D3B3E]"
                                    >
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conférence */}
                  {hotel.conference && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-lg font-semibold mb-3">Salle de conférence</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-[#F0F7F7] rounded-xl p-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0D3B3E] flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-white" strokeWidth={1.5} />
                          </div>
                          <p className="font-medium text-[#0D3B3E]">
                            Capacité — {hotel.conference.capacity}
                          </p>
                        </div>
                        {/* Tarif principal : demi-journée */}
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#F9A03F]/40 bg-[#F0F7F7] p-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-[#0D3B3E]/70 font-semibold">
                              Demi-journée
                            </div>
                            <div className="mt-0.5 font-bold text-[#F9A03F] text-lg">
                              {hotel.conference.halfDayPrice}
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#F9A03F] text-white">
                            Tarif principal
                          </span>
                        </div>
                        {/* Tarif secondaire : journée complète */}
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 p-2.5">
                          <span className="text-sm text-gray-600">Journée complète</span>
                          <span className="text-sm font-semibold text-[#0D3B3E]">
                            {hotel.conference.fullDayPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Restaurant */}
                  {hotel.restaurant && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-lg font-semibold mb-3">Restaurant</h4>
                      <div className="space-y-3 text-gray-700">
                        <p className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-[#F9A03F] rounded-full flex-shrink-0" />
                          <span className="font-semibold text-[#0D3B3E]">
                            {hotel.restaurant.label}
                          </span>
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-[#F9A03F] rounded-full flex-shrink-0" />
                          Ouvert de{' '}
                          <span className="font-semibold text-[#0D3B3E]">
                            {hotel.restaurant.hours}
                          </span>
                        </p>
                        {hotel.restaurant.menuNote && (
                          <p className="text-sm leading-relaxed">{hotel.restaurant.menuNote}</p>
                        )}
                      </div>
                      <a
                        href={hotel.restaurant.phoneHref}
                        className="mt-3 inline-flex items-center gap-2 bg-[#F9A03F] hover:bg-[#e8911e] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors shadow-sm"
                      >
                        <Phone className="w-4 h-4" strokeWidth={2} />
                        {hotel.restaurant.menuType === 'variable'
                          ? 'Appeler la cuisine'
                          : 'Appeler le restaurant'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Why Choose Us */}
          <div className="mt-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Pourquoi choisir le Groupe Djamiyah
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Award className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: 'Qualité premium',
                  description:
                    "Un service d'exception et des hébergements soignés qui dépassent les attentes.",
                },
                {
                  icon: <MapPin className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: 'Emplacements stratégiques',
                  description:
                    'Des localisations clés en Guinée pour faciliter chacun de vos déplacements.',
                },
                {
                  icon: <HeartHandshake className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: 'Service personnalisé',
                  description:
                    'Un accompagnement sur mesure et une attention particulière pour chaque client.',
                },
                {
                  icon: <UtensilsCrossed className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: 'Restauration',
                  description:
                    'Une restauration soignée, locale et internationale, pensée pour chaque séjour.',
                },
                {
                  icon: <Building2 className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: 'Installations professionnelles',
                  description:
                    "Des espaces adaptés aux besoins professionnels et aux événements d'affaires.",
                },
                {
                  icon: <Headphones className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: 'Assistance 24h/24',
                  description: 'Une assistance continue pour répondre à vos besoins à tout moment.',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/50 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#F0F7F7] flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 bg-gradient-to-r from-secondary to-primary rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">
              Prêt pour un séjour inoubliable ?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Découvrez le meilleur de l&apos;hospitalité guinéenne avec le Groupe Djamiyah.
              Réservez dès aujourd&apos;hui votre séjour dans l&apos;un de nos hôtels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-white text-secondary hover:bg-gray-100 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Réserver votre séjour
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Nous contacter
              </Link>
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
