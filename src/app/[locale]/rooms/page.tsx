import Link from 'next/link'
import { Wifi, Waves, Car, Thermometer, Tv, Utensils } from 'lucide-react'
import { rooms, roomImages } from '@/data/content'
import { ImageSlider } from '@/components/ui/ImageSlider'

export default function RoomsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-64 sm:h-80 flex items-center justify-center bg-gradient-to-r from-secondary to-primary">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-3 sm:mb-4">
            Nos chambres et suites
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            Decouvrez le luxe et le confort de nos hebergements
          </p>
        </div>
      </section>

      {/* Room Listings */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Nos Chambres
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Choisissez parmi notre selection de chambres luxueuses.
            </p>
          </div>

          {/* Mobile-first card grid */}
          <div className="flex flex-col gap-6 sm:gap-10 max-w-5xl mx-auto">
            {rooms.map((room) => {
              const formattedPrice = room.price.toLocaleString('fr-FR')
              const images = roomImages[room.slug] || []

              // Badge sélectif : seulement les plus demandées
              const popularSlugs = ['suite-prestige', 'chambre-premium']
              const isPopular = popularSlugs.includes(room.slug)

              return (
                <div
                  key={room.slug}
                  id={`room-${room.slug}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mx-auto w-full"
                >
                  {/* Image - Full Width on Mobile */}
                  <div className="w-full">
                    <ImageSlider images={images} alt={room.imageAlt} className="w-full" />
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6 lg:p-8 w-full">
                    {/* Header: Title + Badge */}
                    <div className="flex flex-row items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 leading-tight">
                          {room.name}
                        </h3>
                        <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-amber-500">
                          {formattedPrice} GNF
                          <span className="text-sm sm:text-base font-normal text-gray-500 ml-1">
                            /nuit
                          </span>
                        </div>
                      </div>
                      {isPopular && (
                        <div className="flex-shrink-0 px-2.5 py-1 text-xs sm:text-sm rounded-full bg-amber-100 text-amber-700 font-semibold">
                          ★ Populaire
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Features */}
                    <div className="mt-5 sm:mt-6">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
                        Equipements
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {room.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center text-xs sm:text-sm text-gray-700"
                          >
                            <span className="h-1.5 w-1.5 bg-amber-500 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                      <Link
                        href="/reservation"
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-colors shadow-md hover:shadow-lg"
                      >
                        Reserver
                      </Link>
                      <Link
                        href="#room-inquiry"
                        className="flex-1 border-2 border-gray-300 hover:border-amber-500 text-gray-700 hover:text-amber-600 text-center py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-colors"
                      >
                        Se renseigner
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Amenities Section */}
          <div className="mt-16 sm:mt-20 bg-gray-100 rounded-2xl p-6 sm:p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center mb-8 sm:mb-12">
              Services de l&apos;hotel
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: Wifi, title: 'Wi-Fi', desc: 'Connexion internet' },
                { icon: Waves, title: 'Piscine', desc: 'Piscine sur place' },
                { icon: Car, title: 'Parking', desc: 'Parking securise' },
                {
                  icon: Thermometer,
                  title: 'Climatisation',
                  desc: 'Confort dans toutes les chambres',
                },
                { icon: Tv, title: 'TV ecran plat', desc: 'Television moderne' },
                { icon: Utensils, title: 'Restaurant', desc: 'Cuisine sur place' },
              ].map((amenity, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 sm:p-6 rounded-xl text-center hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <amenity.icon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1">{amenity.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">{amenity.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inquiry Form */}
          <div id="room-inquiry" className="mt-16 sm:mt-20">
            <div className="bg-gradient-to-r from-secondary to-primary rounded-2xl p-6 sm:p-8 md:p-12 text-white">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center mb-4 sm:mb-6">
                  Des questions sur nos chambres ?
                </h2>
                <p className="text-gray-200 text-center mb-6 sm:mb-8 text-sm sm:text-base">
                  Notre equipe est a votre ecoute pour vous aider a choisir l&apos;hebergement
                  ideal.
                </p>

                <form className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom complet</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Adresse email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
                        placeholder="contact@djamiyah.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
                      placeholder="Parlez-nous de vos besoins en hebergement..."
                    />
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="submit"
                      className="bg-white text-secondary hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full font-semibold transition-colors text-sm sm:text-base"
                    >
                      Envoyer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-10 sm:mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-amber-500 hover:text-amber-600 font-semibold text-base sm:text-lg"
            >
              ← Retour a l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
