import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'
import { Wifi, Waves, Car, Thermometer, Tv, Utensils } from 'lucide-react'
import { rooms, roomImages } from '@/data/content'
import { ImageSlider } from '@/components/ui/ImageSlider'

export const metadata: Metadata = {
  title: 'Chambres & Suites — Hôtel Maison Blanche',
  description:
    "Découvrez nos chambres et suites luxueuses à l'Hôtel Maison Blanche de Coyah. Confort, climatisation, Wi-Fi et services personnalisés pour un séjour inoubliable.",
}

export default function ChambresPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative h-64 sm:h-80 flex items-center justify-center bg-gradient-to-r from-[#0D3B3E] to-[#0D3B3E]/80">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-3 sm:mb-4">
            Chambres &amp; Suites
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            Découvrez le luxe et le confort de nos hébergements
          </p>
        </div>
      </section>

      {/* Room Listings */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-3">
              Hôtel Maison Blanche · Coyah
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-3 sm:mb-4">
              Nos Chambres
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Choisissez parmi notre sélection de chambres luxueuses.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:gap-10 max-w-5xl mx-auto">
            {rooms.map((room) => {
              const formattedPrice = room.price.toLocaleString('fr-FR')
              const images = roomImages[room.slug] || []
              const popularSlugs = ['suite-prestige', 'chambre-premium']
              const isPopular = popularSlugs.includes(room.slug)

              return (
                <div
                  key={room.slug}
                  id={`room-${room.slug}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mx-auto w-full"
                >
                  <div className="w-full">
                    <ImageSlider images={images} alt={room.imageAlt} className="w-full" />
                  </div>
                  <div className="p-5 sm:p-6 lg:p-8 w-full">
                    <div className="flex flex-row items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 leading-tight">
                          {room.name}
                        </h3>
                        <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-[#F9A03F]">
                          {formattedPrice} GNF
                          <span className="text-sm sm:text-base font-normal text-gray-500 ml-1">
                            /nuit
                          </span>
                        </div>
                      </div>
                      {isPopular && (
                        <div className="flex-shrink-0 px-2.5 py-1 text-xs sm:text-sm rounded-full bg-[#F9A03F]/10 text-[#F9A03F] font-semibold">
                          ★ Populaire
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                      {room.description}
                    </p>
                    <div className="mt-5 sm:mt-6">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
                        Équipements
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {room.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center text-xs sm:text-sm text-gray-700"
                          >
                            <span className="h-1.5 w-1.5 bg-[#F9A03F] rounded-full mr-2 flex-shrink-0" />
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                      <Link
                        href="/reservation"
                        className="flex-1 bg-[#F9A03F] hover:bg-[#e8911e] text-white text-center py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-colors shadow-md hover:shadow-lg"
                      >
                        Réserver
                      </Link>
                      <Link
                        href="/contact"
                        className="flex-1 border-2 border-gray-300 hover:border-[#F9A03F] text-gray-700 hover:text-[#F9A03F] text-center py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-colors"
                      >
                        Se renseigner
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Amenities */}
          <div className="mt-16 sm:mt-20 bg-gray-100 rounded-2xl p-6 sm:p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center text-[#0D3B3E] mb-8 sm:mb-12">
              Services de l&apos;hôtel
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: Wifi, title: 'Wi-Fi', desc: 'Connexion internet' },
                { icon: Waves, title: 'Piscine', desc: 'Piscine sur place' },
                { icon: Car, title: 'Parking', desc: 'Parking sécurisé' },
                {
                  icon: Thermometer,
                  title: 'Climatisation',
                  desc: 'Confort dans toutes les chambres',
                },
                { icon: Tv, title: 'TV écran plat', desc: 'Télévision moderne' },
                { icon: Utensils, title: 'Restaurant', desc: 'Cuisine sur place' },
              ].map((amenity, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 sm:p-6 rounded-xl text-center hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <amenity.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#F9A03F]" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1">{amenity.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">{amenity.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10 sm:mt-12">
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
