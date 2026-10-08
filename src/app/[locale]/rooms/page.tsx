import Link from 'next/link'
import { RoomCatalog } from '@/components/RoomCatalog'

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
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              Chambres &amp; Suites
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Hôtel Maison Blanche — Coyah · Hôtel Rama — Kissidougou
            </p>
          </div>

          <RoomCatalog />

          {/* Amenities Section */}
          <div className="mt-16 sm:mt-20 bg-gradient-to-r from-secondary to-primary rounded-2xl p-6 sm:p-8 md:p-10 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-3">Prêt à réserver ?</h2>
            <p className="text-gray-200 max-w-2xl mx-auto text-sm sm:text-base">
              Choisissez votre chambre et finalisez votre séjour en quelques clics.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/reservation"
                className="bg-white text-secondary hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                Réserver un séjour
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                Nous contacter
              </Link>
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
