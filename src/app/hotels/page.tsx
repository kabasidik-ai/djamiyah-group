import Link from "next/link";
import { hotels, hotelGroups } from "@/data/hotels";
import { siteConfig } from "@/data/content";

export default function HotelsPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-primary to-accent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Our Hotels
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Discover the luxury and comfort of Groupe Djamiyah hotels across Guinea
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
              {hotelGroups.djamiyah.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Luxury Accommodations
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Fine Dining
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Conference Facilities
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                Premium Services
              </div>
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Hotel Image Placeholder */}
                <div className="h-64 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="text-center text-gray-700 p-8">
                    <div className="text-6xl mb-4">🏨</div>
                    <h2 className="text-3xl font-bold mb-2">{hotel.shortName}</h2>
                    <p className="text-sm">TODO: Replace with {hotel.name} exterior photo</p>
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
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                      {hotel.id === "maison-blanche" ? "5-Star" : "4-Star"}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {hotel.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Location</h4>
                    <div className="flex items-center text-gray-700">
                      <span className="mr-2">📍</span>
                      <p>{hotel.location}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{hotel.address}</p>
                  </div>

                  {/* Key Features */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-3">Key Features</h4>
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
                      Book Now
                    </Link>
                    <Link
                      href={`/contact?hotel=${hotel.id}`}
                      className="flex-1 border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary text-center py-3.5 rounded-lg font-semibold transition-colors"
                    >
                      Contact Hotel
                    </Link>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Phone</div>
                        <a 
                          href={`tel:${hotel.phone}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {hotel.phone}
                        </a>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Email</div>
                        <a 
                          href={`mailto:${hotel.email}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {hotel.email}
                        </a>
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
              Hotel Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                    {hotels.map((hotel) => (
                      <th key={hotel.id} className="text-center py-4 px-4 font-semibold text-gray-900">
                        {hotel.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Star Rating</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.id === "maison-blanche" ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐⭐"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Location</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.location}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Room Price Range</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.roomCategories[0].priceRange}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Swimming Pool</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.id === "maison-blanche" ? "✅" : "❌"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Spa Services</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        {hotel.id === "maison-blanche" ? "✅" : "❌"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">Business Center</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        ✅
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Airport Shuttle</td>
                    {hotels.map((hotel) => (
                      <td key={hotel.id} className="text-center py-4 px-4">
                        ✅
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
              Why Choose Groupe Djamiyah Hotels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🌟",
                  title: "Premium Quality",
                  description: "Exceptional service and luxurious accommodations that exceed expectations.",
                },
                {
                  icon: "📍",
                  title: "Strategic Locations",
                  description: "Prime locations in key cities across Guinea for your convenience.",
                },
                {
                  icon: "🤝",
                  title: "Personalized Service",
                  description: "Tailored experiences and attention to detail for every guest.",
                },
                {
                  icon: "🍽️",
                  title: "Exquisite Dining",
                  description: "Fine dining restaurants featuring local and international cuisine.",
                },
                {
                  icon: "💼",
                  title: "Business Facilities",
                  description: "State-of-the-art conference and meeting facilities for corporate needs.",
                },
                {
                  icon: "🛎️",
                  title: "24/7 Support",
                  description: "Round-the-clock concierge and support services for all your needs.",
                },
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/50 transition-all">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 bg-gradient-to-r from-secondary to-primary rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">
              Ready for an Unforgettable Stay?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Experience the best of Guinean hospitality with Groupe Djamiyah. 
              Book your stay at either of our luxurious hotels today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-white text-secondary hover:bg-gray-100 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Book Your Stay
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}