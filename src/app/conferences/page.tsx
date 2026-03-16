import Link from "next/link";
import { conferences, siteConfig } from "@/data/content";

export default function ConferencesPage() {
  const eventTypes = [
    {
      name: "Business Meetings",
      description: "Corporate meetings, board meetings, and team workshops",
      icon: "💼",
    },
    {
      name: "Conferences",
      description: "Industry conferences, seminars, and professional gatherings",
      icon: "🎤",
    },
    {
      name: "Weddings",
      description: "Elegant wedding ceremonies and receptions",
      icon: "💒",
    },
    {
      name: "Social Events",
      description: "Birthdays, anniversaries, and celebration parties",
      icon: "🎉",
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-secondary to-accent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {conferences.title}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Premier venue for conferences, weddings, and corporate events in Coyah
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
              Your Perfect Event Venue
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {conferences.description}
            </p>
          </div>

          {/* Facilities Grid */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Our Facilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {conferences.facilities.map((facility, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl flex items-center justify-center">
                    <div className="text-center text-gray-700">
                      <div className="text-5xl mb-3">{idx === 0 ? "🎪" : idx === 1 ? "💼" : "📚"}</div>
                      <p className="text-sm">TODO: {facility.name} Photos</p>
                    </div>
                  </div>
                  <div className="p-8">
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
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Event Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {conferences.services.map((service, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">
                    {idx === 0 ? "📅" : idx === 1 ? "🍽️" : idx === 2 ? "📹" : "🎨"}
                  </div>
                  <h4 className="font-semibold mb-2">{service}</h4>
                  <p className="text-sm text-gray-600">
                    {idx === 0 
                      ? "Expert planning from concept to execution"
                      : idx === 1
                      ? "Customized menus for any occasion"
                      : idx === 2
                      ? "State-of-the-art AV equipment"
                      : "Professional decoration services"
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Types */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Types of Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventTypes.map((event, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/50 transition-all">
                  <div className="text-4xl mb-4">{event.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Packages */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 mb-20 text-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-center mb-8">
                Event Packages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Standard Package",
                    price: "From $1,200",
                    description: "Perfect for small meetings and workshops",
                    features: ["Up to 50 guests", "Basic AV equipment", "Coffee break service"],
                  },
                  {
                    name: "Premium Package",
                    price: "From $2,500",
                    description: "Ideal for conferences and corporate events",
                    features: ["Up to 150 guests", "Full AV setup", "Catering included", "Event coordinator"],
                    popular: true,
                  },
                  {
                    name: "Custom Package",
                    price: "Contact Us",
                    description: "Tailored solutions for large or specialized events",
                    features: ["Flexible capacity", "Customized services", "Full planning support", "VIP treatment"],
                  },
                ].map((pkg, idx) => (
                  <div key={idx} className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 ${pkg.popular ? 'ring-2 ring-white' : ''}`}>
                    {pkg.popular && (
                      <div className="text-center mb-4">
                        <span className="bg-white text-primary px-3 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                    <div className="text-2xl font-bold mb-3">{pkg.price}</div>
                    <p className="text-gray-200 mb-4">{pkg.description}</p>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center text-sm">
                          <span className="h-2 w-2 bg-white rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-200 mt-8">
                All packages include basic setup and cleaning. Additional services available upon request.
              </p>
            </div>
          </div>

          {/* Event Inquiry Form */}
          <div className="mb-20">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-serif font-bold text-center mb-8">
                Plan Your Event
              </h2>
              <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                Tell us about your event requirements and our team will contact you 
                with personalized recommendations and a detailed proposal.
              </p>

              <form className="space-y-6 max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Person</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Company or organization"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+224 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Type</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select event type</option>
                      <option value="meeting">Business Meeting</option>
                      <option value="conference">Conference</option>
                      <option value="wedding">Wedding</option>
                      <option value="social">Social Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Expected Guests</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Number of attendees"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Event Details</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us about your event requirements, preferred dates, and any special requests..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-amber-600 text-white px-8 py-3.5 rounded-full font-semibold transition-colors"
                  >
                    Request Proposal
                  </button>
                  <p className="text-gray-500 text-sm mt-4">
                    We'll respond within 24 hours with a detailed proposal
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">
              Client Testimonials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The perfect venue for our annual conference. Professional staff and excellent facilities.",
                  author: "Marie Diop",
                  position: "Event Manager, TechCorp Africa",
                },
                {
                  quote: "Our wedding was absolutely magical thanks to the Hotel Maison Blanche team.",
                  author: "Amadou & Fatoumata",
                  position: "Wedding Couple",
                },
                {
                  quote: "Top-notch AV equipment and seamless event coordination for our product launch.",
                  author: "David Johnson",
                  position: "Marketing Director, Global Brands",
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-primary text-2xl mb-4">"</div>
                  <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.position}</p>
                  </div>
                </div>
              ))}
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