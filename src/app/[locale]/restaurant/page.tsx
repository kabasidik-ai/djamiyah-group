import Link from 'next/link'
import { RestaurantSection } from '@/components/ui/RestaurantSection'
import { restaurant } from '@/data/content'

export default function RestaurantPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-accent to-primary">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {restaurant.name}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Une expérience culinaire exceptionelle à Coyah
          </p>
        </div>
      </section>

      {/* Restaurant Section avec vrai menu */}
      <RestaurantSection />

      {/* Private Dining */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
              <div className="text-center text-primary p-8">
                <h3 className="text-2xl font-bold mb-2">Repas privés</h3>
                <p className="text-sm opacity-80">Espace dédié aux événements</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                Repas privés et événements
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Organisez vos occasions spéciales dans notre espace dédié. Idéal pour les
                anniversaires, réunions d&apos;affaires et événements familiaux.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                  <span className="text-gray-700">Menus personnalisés</span>
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                  <span className="text-gray-700">Équipe de service dédiée</span>
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                  <span className="text-gray-700">Capacité jusqu&apos;à 50 personnes</span>
                </li>
                <li className="flex items-center">
                  <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                  <span className="text-gray-700">Service traiteur disponible</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center bg-primary hover:bg-amber-600 text-white px-6 py-3.5 rounded-full font-semibold transition-colors"
              >
                Se renseigner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Prêt à découvrir notre cuisine ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Réservez votre table pour une expérience gastronomique inoubliable chez{' '}
            {restaurant.name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="bg-white text-secondary hover:bg-gray-100 px-8 py-3.5 rounded-full font-semibold transition-colors"
            >
              Réserver une table
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold transition-colors"
            >
              Contacter le restaurant
            </Link>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="py-8 text-center bg-white">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
