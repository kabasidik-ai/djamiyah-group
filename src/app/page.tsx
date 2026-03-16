import Image from "next/image";
import Link from "next/link";
import { heroContent, rooms, restaurant, conferences, siteConfig } from "@/data/content";

export default function Home() {
  const featuredRooms = rooms.slice(0, 3);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-primary/40"></div>
          <div className="h-full w-full bg-gray-900">
            {/* Placeholder for hero image - TODO: Replace with actual hotel image */}
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🏨</div>
                <p className="text-xl">Hotel Maison Blanche - Hero Image</p>
                <p className="text-sm text-gray-300 mt-2">TODO: Replace with high-quality hotel exterior photo</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              {heroContent.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              {heroContent.subtitle}
            </p>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              {heroContent.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-primary hover:bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl transform hover:-translate-y-1"
              >
                {heroContent.ctaButton}
              </Link>
              <Link
                href="/rooms"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 rounded-full text-lg font-semibold transition-all"
              >
                {heroContent.secondaryButton}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="h-8 w-0.5 bg-white/50 mx-auto"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Welcome to {siteConfig.hotelName}
            </h2>
            <p className="text-lg text-gray-600">
              {siteConfig.description}
            </p>
            <div className="mt-6 text-gray-500">
              <p>{siteConfig.location}</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🛏️</div>
              <h3 className="text-xl font-semibold mb-3">Luxury Rooms</h3>
              <p className="text-gray-600">Elegantly designed rooms with premium amenities for ultimate comfort.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold mb-3">Fine Dining</h3>
              <p className="text-gray-600">Exquisite cuisine blending international flavors with local ingredients.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-xl font-semibold mb-3">Event Spaces</h3>
              <p className="text-gray-600">State-of-the-art facilities for conferences, weddings, and special events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Featured Accommodations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience comfort and luxury in our beautifully designed rooms and suites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="text-center text-gray-700">
                    <div className="text-4xl mb-2">🛏️</div>
                    <p className="text-sm">{room.name} Image</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{room.name}</h3>
                    <div className="text-primary font-bold text-lg">
                      ${room.price}<span className="text-sm font-normal text-gray-500">/night</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{room.description}</p>
                  <ul className="space-y-2 mb-6">
                    {room.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-500">
                        <span className="h-2 w-2 bg-primary rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/rooms#room-${room.id}`}
                    className="block w-full text-center bg-gray-100 hover:bg-primary hover:text-white text-gray-800 py-3 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/rooms"
              className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
            >
              View All Rooms
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Restaurant Preview */}
      <section className="py-20 bg-secondary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                {restaurant.name}
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                {restaurant.description}
              </p>
              <ul className="space-y-3 mb-8">
                {restaurant.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    {highlight}
                  </li>
                ))}
              </ul>
              <Link
                href="/restaurant"
                className="inline-flex items-center bg-primary hover:bg-amber-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Explore Our Menu
              </Link>
            </div>
            <div className="h-80 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🍴</div>
                <p className="text-xl">Restaurant Interior</p>
                <p className="text-sm text-gray-300 mt-2">TODO: Replace with actual restaurant photos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conference Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              {conferences.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {conferences.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {conferences.facilities.map((facility, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary/30 transition-all">
                <h3 className="text-xl font-semibold mb-3">{facility.name}</h3>
                <p className="text-primary font-medium mb-4">{facility.capacity}</p>
                <p className="text-gray-600 mb-4">{facility.description}</p>
                <ul className="space-y-2">
                  {facility.features.map((feature, fIdx) => (
                    <li key={fIdx} className="text-sm text-gray-500 flex items-center">
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/conferences"
              className="inline-flex items-center bg-secondary hover:bg-blue-900 text-white px-8 py-4 rounded-full font-semibold transition-colors"
            >
              Plan Your Event
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
