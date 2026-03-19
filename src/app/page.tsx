import Link from "next/link";
import Image from "next/image";
import { rooms, restaurant, conferences, siteConfig } from "@/data/content";

function LuxuryBedIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="w-12 h-12 text-primary">
      <path d="M10 40V24a6 6 0 0 1 6-6h13a7 7 0 0 1 7 7v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 30h13a5 5 0 0 1 5 5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 40h52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 40v8M54 40v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 22h8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function MichelinStarIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="w-12 h-12 text-primary">
      <path d="M32 8v14M32 42v14M8 32h14M42 32h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 15l10 10M39 39l10 10M49 15 39 25M25 39 15 49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 20l3.6 7.3 8.1 1.2-5.9 5.8 1.4 8.2L32 38.7l-7.2 3.8 1.4-8.2-5.9-5.8 8.1-1.2L32 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="2.5" fill="currentColor" />
    </svg>
  );
}

function PrestigeDiamondIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="w-12 h-12 text-primary">
      <path d="M18 22h28l-14 24-14-24Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m18 22 8-8h12l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 14 32 22 38 14M32 22v24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 52h20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

const roomImages: Record<string, string> = {
  "Chambre Confort": "/images/maison-blanche/chambre-confort.jpg",
  "Chambre Premium": "/images/maison-blanche/chambre-premium.jpg",
  "Double Premium": "/images/maison-blanche/double-premium.jpg",
  "Suite Premium": "/images/maison-blanche/suite-premium.jpg",
  "Suite Prestige": "/images/maison-blanche/suite-prestige.jpg",
};

export default function Home() {
  const featuredRooms = rooms.slice(0, 3);
  const faqItems = [
    {
      question: "Comment réserver une chambre ?",
      answer:
        "Vous pouvez réserver directement sur notre site ou nous contacter par WhatsApp au +224 610 75 90 90.",
    },
    {
      question: "Quels modes de paiement acceptez-vous ?",
      answer:
        "Orange Money, MTN Mobile Money, cartes bancaires via Chap Chap Pay, et paiement sur place.",
    },
    {
      question: "L'hôtel dispose-t-il d'un parking ?",
      answer:
        "Oui, parking sécurisé et surveillé 24h/24, gratuit pour nos clients.",
    },
    {
      question: "Proposez-vous des salles de conférence ?",
      answer:
        "Oui, 4 salles de 20 à 150 places pour vos séminaires et événements professionnels.",
    },
    {
      question: "Comment accéder à l'hôtel depuis Conakry ?",
      answer:
        "L'hôtel est à Coyah, environ 50 km de Conakry sur la Route Nationale. Transfert sur demande.",
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/corporate/suite-premium.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/corporate/hero-fallback.jpg"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/images/corporate/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              Bienvenue à l&apos;Hôtel Maison Blanche
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              Plus qu&apos;un séjour, une expérience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-primary hover:bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl transform hover:-translate-y-1"
              >
                Réserver maintenant
              </Link>
              <Link
                href="/rooms"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 rounded-full text-lg font-semibold transition-all"
              >
                Découvrir les chambres
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
              Bienvenue à {siteConfig.hotelName}
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
              <div className="mb-4">
                <LuxuryBedIcon />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chambres de luxe</h3>
              <p className="text-gray-600">Chambres élégantes avec équipements haut de gamme.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <MichelinStarIcon />
              </div>
              <h3 className="text-xl font-semibold mb-3">Restaurant gastronomique</h3>
              <p className="text-gray-600">Cuisine raffinée mêlant saveurs internationales et locales.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <PrestigeDiamondIcon />
              </div>
              <h3 className="text-xl font-semibold mb-3">Espaces événementiels</h3>
              <p className="text-gray-600">Installations modernes pour conférences, mariages et événements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Hébergements en vedette
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez le confort et le luxe de nos chambres et suites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRooms.map((room) => {
              const formattedPrice = room.price.toLocaleString("fr-FR");
              return (
                <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={roomImages[room.name]}
                      alt={room.imageAlt}
                      fill
                      className="object-contain"
                      quality={85}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold">{room.name}</h3>
                      <div className="text-primary font-bold text-lg">
                        {formattedPrice} GNF<span className="text-sm font-normal text-gray-500">/nuit</span>
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
                      Voir les détails
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/rooms"
              className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
            >
              Voir toutes les chambres
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
                Découvrir notre carte
              </Link>
            </div>
            <div className="h-80 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🍴</div>
                <p className="text-xl">Notre restaurant</p>
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
              Organisez votre événement
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 text-center mb-10">
              Questions fréquentes
            </h2>

            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <details
                  key={idx}
                  className="group bg-white border border-gray-200 rounded-xl shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="list-none cursor-pointer flex items-center justify-between px-6 py-5">
                    <span className="text-lg font-semibold text-gray-900 pr-4">{item.question}</span>
                    <span className="text-2xl text-primary leading-none group-open:hidden">+</span>
                    <span className="text-2xl text-primary leading-none hidden group-open:inline">−</span>
                  </summary>
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100">
                    <p className="pt-4">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
