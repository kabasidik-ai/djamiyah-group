import Link from "next/link";
import Image from "next/image";
import { restaurant, conferences, siteConfig } from "@/data/content";
import { createServerClient } from "@/lib/supabase";
import { Home as HomeIcon, UtensilsCrossed, BookOpen, ArrowRight } from "lucide-react";

const roomImages: Record<string, string> = {
  "Chambre Confort": "/images/maison-blanche/chambre-confort.jpg",
  "Chambre Premium": "/images/maison-blanche/chambre-premium.jpg",
  "Double Premium": "/images/maison-blanche/double-premium.jpg",
  "Suite Premium": "/images/maison-blanche/suite-premium.jpg",
  "Suite Prestige": "/images/maison-blanche/suite-prestige.jpg",
};

type HomeRoom = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

const canonicalHomeRooms = [
  {
    name: "Chambre Confort",
    description: "Chambre confortable avec climatisation, TV écran plat et Wi-Fi.",
    price: 520000,
  },
  {
    name: "Chambre Premium",
    description: "Chambre spacieuse avec équipements haut de gamme.",
    price: 720000,
  },
  {
    name: "Double Premium",
    description: "Chambre double avec espace généreux, idéale pour couples ou familles.",
    price: 870000,
  },
  {
    name: "Suite Premium",
    description: "Suite élégante avec salon séparé et services premium.",
    price: 1070000,
  },
  {
    name: "Suite Prestige",
    description: "Notre suite la plus luxueuse avec service personnalisé.",
    price: 1620000,
  },
] as const;

async function getRoomsForHomepage(): Promise<HomeRoom[]> {
  const fallbackRooms: HomeRoom[] = canonicalHomeRooms.map((room) => ({
    id: room.name,
    name: room.name,
    description: room.description,
    price: room.price,
    image: roomImages[room.name] || "/images/corporate/suite-premium.jpg",
  }));

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, description, price_per_night, images, is_available")
      .eq("is_available", true);

    if (error || !data?.length) return fallbackRooms;

    return canonicalHomeRooms.map((room) => {
      const dbRoom = data.find((item) => item.name === room.name);
      return {
        id: dbRoom?.id ?? room.name,
        name: room.name,
        description: dbRoom?.description || room.description,
        price: dbRoom?.price_per_night ?? room.price,
        image: dbRoom?.images?.[0] || roomImages[room.name] || "/images/corporate/suite-premium.jpg",
      };
    });
  } catch {
    return fallbackRooms;
  }
}

export default async function Home() {
  const homeRooms = await getRoomsForHomepage();
  const heroLayoutOrder = ["Suite Prestige", "Suite Premium", "Double Premium"];
  const lowerLayoutOrder = ["Chambre Confort", "Chambre Premium"];

  const topRooms = heroLayoutOrder
    .map((name) => homeRooms.find((room) => room.name === name))
    .filter((room): room is HomeRoom => Boolean(room));

  const bottomRooms = lowerLayoutOrder
    .map((name) => homeRooms.find((room) => room.name === name))
    .filter((room): room is HomeRoom => Boolean(room));

  const renderRoomCard = (room: HomeRoom, className?: string) => {
    const formattedPrice = room.price.toLocaleString("fr-FR");

    return (
      <article
        key={room.id}
        className={`group relative rounded-2xl overflow-hidden min-h-[18rem] ${className || ""}`}
      >
        <Image
          src={room.image}
          alt={room.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-white">
          <h3 className="font-serif text-2xl md:text-3xl leading-tight">{room.name}</h3>
          <p className="mt-2 text-[#F9A03F] font-semibold text-lg">{formattedPrice} GNF/nuit</p>
          <p className="mt-2 text-white/90 text-sm md:text-base max-w-xl">{room.description}</p>
          <Link
            href="/reservation"
            className="inline-flex mt-4 px-5 py-2.5 rounded-full bg-white/90 text-[#0D3B3E] font-semibold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            Réserver
          </Link>
        </div>
      </article>
    );
  };

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
          <Image
            src="/images/corporate/suite-premium.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-0.5 bg-[#F9A03F]"></div>
              <span className="text-xs tracking-[3px] uppercase text-[#F9A03F] font-semibold">Nos services</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="group relative bg-white rounded-2xl p-7 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F9A03F] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-[#F0F7F7] text-[#0D3B3E]">
                <HomeIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chambres de luxe</h3>
              <p className="text-gray-600">Chambres élégantes avec équipements haut de gamme.</p>
              <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-[#F9A03F] opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-400">
                <span>Découvrir</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            <div className="group relative bg-white rounded-2xl p-7 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F9A03F] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-[#FFF4E6] text-[#F9A03F]">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Restaurant gastronomique</h3>
              <p className="text-gray-600">Cuisine raffinée mêlant saveurs internationales et locales.</p>
              <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-[#F9A03F] opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-400">
                <span>Découvrir</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            <div className="group relative bg-white rounded-2xl p-7 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F9A03F] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-[#F0F7F7] text-[#0D3B3E]">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Espaces événementiels</h3>
              <p className="text-gray-600">Installations modernes pour conférences, mariages et événements.</p>
              <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-[#F9A03F] opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-400">
                <span>Découvrir</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 bg-[#FCFDFD]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-0.5 bg-[#F9A03F]"></div>
                <span className="text-xs tracking-[3px] uppercase text-[#F9A03F] font-semibold">Hébergements</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#0D3B3E]">
                Nos chambres <span className="italic text-[#F9A03F]">& suites</span>
              </h2>
            </div>
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center self-start md:self-auto px-6 py-3 rounded-full border border-[#0D3B3E]/20 text-[#0D3B3E] hover:bg-[#0D3B3E] hover:text-white transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              Voir toutes les chambres
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6">
            {topRooms[0] && renderRoomCard(topRooms[0], "lg:col-span-2 lg:row-span-2 min-h-[30rem]")}
            {topRooms[1] && renderRoomCard(topRooms[1], "min-h-[14rem]")}
            {topRooms[2] && renderRoomCard(topRooms[2], "min-h-[14rem]")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {bottomRooms.map((room) => renderRoomCard(room, "min-h-[18rem]"))}
          </div>
        </div>
      </section>

      {/* Restaurant Preview */}
      <section className="relative py-20 bg-gradient-to-r from-[#FFF8F0] to-[#FFF4E6]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-[#0D3B3E]">
                {restaurant.name}
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                {restaurant.description}
              </p>
              <ul className="space-y-3 mb-8">
                {restaurant.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center text-gray-600">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    {highlight}
                  </li>
                ))}
              </ul>
              <Link
                href="/restaurant"
                className="inline-flex items-center bg-[#0D3B3E] text-white hover:bg-[#164B4F] px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Découvrir notre carte
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/images/gastronimque-accueil.webp"
                alt="Restaurant gastronomique - Terrasse sur la rivière"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white font-serif text-lg italic">Terrasse avec vue sur la rivière</p>
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
