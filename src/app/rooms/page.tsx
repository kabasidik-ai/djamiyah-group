import Image from "next/image";
import Link from "next/link";
import { rooms, siteConfig } from "@/data/content";

export default function RoomsPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-secondary to-primary">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Our Rooms & Suites
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Experience luxury and comfort in our beautifully designed accommodations
          </p>
        </div>
      </section>

      {/* Room Listings */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Accommodation Options
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose from our selection of luxurious rooms and suites, each designed to provide 
              the perfect blend of comfort, style, and modern amenities.
            </p>
          </div>

          <div className="space-y-12">
            {rooms.map((room) => (
              <div 
                key={room.id} 
                id={`room-${room.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Room Image Placeholder */}
                  <div className="h-80 lg:h-auto bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <div className="text-center text-gray-700 p-8">
                      <div className="text-6xl mb-4">🏨</div>
                      <h3 className="text-2xl font-bold mb-2">{room.name}</h3>
                      <p className="text-sm">TODO: Replace with actual room photos</p>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-8 lg:p-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                          {room.name}
                        </h3>
                        <div className="text-primary font-bold text-2xl">
                          ${room.price}<span className="text-base font-normal text-gray-500 ml-1">/night</span>
                        </div>
                      </div>
                      <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                        Popular Choice
                      </div>
                    </div>

                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                      {room.description}
                    </p>

                    {/* Features */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-4">Room Features</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {room.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-gray-700">
                            <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href="/reservation"
                        className="flex-1 bg-primary hover:bg-amber-600 text-white text-center py-3.5 rounded-lg font-semibold transition-colors hover:shadow-lg"
                      >
                        Book Now
                      </Link>
                      <Link
                        href="#room-inquiry"
                        className="flex-1 border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary text-center py-3.5 rounded-lg font-semibold transition-colors"
                      >
                        Inquire
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Amenities Section */}
          <div className="mt-20 bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Hotel Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🛜", title: "Free Wi-Fi", desc: "High-speed internet throughout" },
                { icon: "🏊", title: "Swimming Pool", desc: "Heated outdoor pool" },
                { icon: "🏋️", title: "Fitness Center", desc: "24/7 gym access" },
                { icon: "🚗", title: "Parking", desc: "Secure parking available" },
                { icon: "☕", title: "Breakfast", desc: "Complimentary breakfast" },
                { icon: "🛎️", title: "Room Service", desc: "24-hour service" },
                { icon: "🧳", title: "Concierge", desc: "Personal assistance" },
                { icon: "💼", title: "Business Center", desc: "Work facilities" },
              ].map((amenity, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{amenity.icon}</div>
                  <h4 className="font-semibold mb-2">{amenity.title}</h4>
                  <p className="text-sm text-gray-600">{amenity.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inquiry Form */}
          <div id="room-inquiry" className="mt-20">
            <div className="bg-gradient-to-r from-secondary to-primary rounded-2xl p-8 md:p-12 text-white">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-center mb-6">
                  Have Questions About Our Rooms?
                </h2>
                <p className="text-gray-200 text-center mb-8">
                  Our team is ready to help you choose the perfect accommodation for your stay.
                </p>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                      placeholder="Tell us about your accommodation needs..."
                    />
                  </div>
                  
                  <div className="text-center">
                    <button
                      type="submit"
                      className="bg-white text-secondary hover:bg-gray-100 px-8 py-3.5 rounded-full font-semibold transition-colors"
                    >
                      Send Inquiry
                    </button>
                  </div>
                </form>
              </div>
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