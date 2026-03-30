import Link from "next/link";
import { Award, MapPin, HeartHandshake, UtensilsCrossed, Building2, Headphones } from "lucide-react";
import { hotels, hotelGroups } from "@/data/hotels";

export default function HotelsPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-primary to-accent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Nos hôtels
          </h1>
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
                Gastronomie
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
              <div key={hotel.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Hotel Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={hotel.images.exterior}
                    alt={`Vue extérieure - ${hotel.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow">{hotel.shortName}</h2>
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

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {hotel.description}
                  </p>

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

                  {/* Key Features */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-3">Points forts</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hotel.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-gray-700">
                          <span className="h-2 w-2 bg-primary rounded-full mr-2"></span>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
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
                        {hotel.phone === "À venir" ? (
                          <span className="text-gray-700 font-medium">À venir</span>
                        ) : (
                          <a
                            href={`tel:${hotel.phone}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {hotel.phone}
                          </a>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">E-mail</div>
                        {hotel.email === "À venir" ? (
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
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Section */}
          <div className="mt-20 bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Comparaison des hôtels
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Critère</th>
                    {hotels.map((hotel) => (
                      <th key={hotel.id} className="text-center py-4 px-4 font-semibold text-gray-900">
                        {hotel.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Localisation</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.location}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Tarifs chambres</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.roomCategories[0].priceRange}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
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
                  title: "Qualité premium",
                  description: "Un service d'exception et des hébergements soignés qui dépassent les attentes.",
                },
                {
                  icon: <MapPin className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: "Emplacements stratégiques",
                  description: "Des localisations clés en Guinée pour faciliter chacun de vos déplacements.",
                },
                {
                  icon: <HeartHandshake className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: "Service personnalisé",
                  description: "Un accompagnement sur mesure et une attention particulière pour chaque client.",
                },
                {
                  icon: <UtensilsCrossed className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: "Gastronomie raffinée",
                  description: "Une cuisine raffinée mêlant inspirations locales et internationales.",
                },
                {
                  icon: <Building2 className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: "Installations professionnelles",
                  description: "Des espaces adaptés aux besoins professionnels et aux événements d'affaires.",
                },
                {
                  icon: <Headphones className="w-7 h-7 text-[#0D3B3E]" strokeWidth={1.5} />,
                  title: "Assistance 24h/24",
                  description: "Une assistance continue pour répondre à vos besoins à tout moment.",
                },
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/50 transition-all">
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
  );
}