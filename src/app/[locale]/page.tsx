import Link from 'next/link'
import Image from 'next/image'
import { restaurant, conferences, siteConfig, rooms, roomImages } from '@/data/content'
import { createServerClient } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'
import { VideoHero } from '@/components/VideoHero'

type HomeRoom = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  image: string
}

// Canonical room names for homepage ordering
const heroLayoutOrder = ['suite-prestige', 'chambre-premium', 'double-premium']
const lowerLayoutOrder = ['chambre-confort', 'suite-premium']

async function getRoomsForHomepage(): Promise<HomeRoom[]> {
  // Fallback rooms from canonical data
  const fallbackRooms: HomeRoom[] = rooms.map((room) => ({
    id: room.slug,
    slug: room.slug,
    name: room.name,
    description: room.description,
    price: room.price,
    image: roomImages[room.slug]?.[0] || '/images/corporate/suite-premium.jpg',
  }))

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('rooms')
      .select('id, slug, name, description, price_per_night, images, is_available')
      .eq('is_available', true)

    if (error || !data?.length) return fallbackRooms

    // Map database rooms to expected format
    return rooms.map((room) => {
      const dbRoom = data.find((item) => item.slug === room.slug || item.name === room.name)
      return {
        id: dbRoom?.id ?? room.slug,
        slug: dbRoom?.slug ?? room.slug,
        name: dbRoom?.name ?? room.name,
        description: dbRoom?.description || room.description,
        price: dbRoom?.price_per_night ?? room.price,
        image:
          dbRoom?.images?.[0] ||
          roomImages[room.slug]?.[0] ||
          '/images/corporate/suite-premium.jpg',
      }
    })
  } catch {
    return fallbackRooms
  }
}

export default async function Home() {
  const homeRooms = await getRoomsForHomepage()

  const topRooms = heroLayoutOrder
    .map((slug) => homeRooms.find((room) => room.slug === slug))
    .filter((room): room is HomeRoom => Boolean(room))

  const bottomRooms = lowerLayoutOrder
    .map((slug) => homeRooms.find((room) => room.slug === slug))
    .filter((room): room is HomeRoom => Boolean(room))

  const renderRoomCard = (room: HomeRoom, className?: string) => {
    const formattedPrice = room.price.toLocaleString('fr-FR')

    return (
      <article
        key={room.id}
        className={`group relative rounded-2xl overflow-hidden min-h-[18rem] ${className || ''}`}
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
    )
  }

  const faqItems = [
    {
      question: 'Comment réserver une chambre ?',
      answer:
        'Vous pouvez réserver directement sur notre site ou nous contacter par WhatsApp au +224 610 75 90 90.',
    },
    {
      question: 'Quels modes de paiement acceptez-vous ?',
      answer:
        'Orange Money, MTN Mobile Money, cartes bancaires via Chap Chap Pay, et paiement sur place.',
    },
    {
      question: "L'hotel dispose-t-il d'un parking ?",
      answer: 'Oui, parking sécurisé et surveillé 24h/24, gratuit pour nos clients.',
    },
    {
      question: 'Proposez-vous des salles de conference ?',
      answer: 'Oui, 4 salles de 20 à 150 places pour vos séminaires et événements professionnels.',
    },
    {
      question: "Comment accéder à l'hôtel depuis Conakry ?",
      answer:
        "L'hotel est a Coyah, environ 50 km de Conakry sur la Route Nationale. Transfert sur demande.",
    },
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <VideoHero
        videoSrc="/images/corporate/hero-video.mp4"
        poster="/images/corporate/hero-fallback.jpg"
        fallbackImage="/images/corporate/suite-premium.jpg"
        alt="Hotel hero"
      />

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Bienvenue à {siteConfig.hotelName}
            </h2>
            <p className="text-lg text-gray-600">{siteConfig.description}</p>
            <div className="mt-6 text-gray-500">
              <p>{siteConfig.location}</p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-0.5 bg-[#F9A03F]"></div>
              <span className="text-xs tracking-[3px] uppercase text-[#F9A03F] font-semibold">
                Nos services
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="group relative bg-white rounded-2xl p-7 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F9A03F] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <h3 className="text-xl font-semibold mb-3">Chambres</h3>
              <p className="text-gray-600">Chambres élégantes avec équipements haut de gamme.</p>
              <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-[#F9A03F] opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-400">
                <Link href="/rooms" className="flex items-center gap-1.5">
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="group relative bg-white rounded-2xl p-7 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F9A03F] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <h3 className="text-xl font-semibold mb-3">Restaurant</h3>
              <p className="text-gray-600">
                Cuisine raffinée mêlant saveurs internationales et locales.
              </p>
              <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-[#F9A03F] opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-400">
                <Link href="/restaurant" className="flex items-center gap-1.5">
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="group relative bg-white rounded-2xl p-7 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F9A03F] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <h3 className="text-xl font-semibold mb-3">Événementiel</h3>
              <p className="text-gray-600">
                Installations modernes pour conferences, mariages et evenements.
              </p>
              <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-[#F9A03F] opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-400">
                <Link href="/conferences" className="flex items-center gap-1.5">
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
                <span className="text-xs tracking-[3px] uppercase text-[#F9A03F] font-semibold">
                  Chambres
                </span>
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
            {topRooms[0] &&
              renderRoomCard(topRooms[0], 'lg:col-span-2 lg:row-span-2 min-h-[30rem]')}
            {topRooms[1] && renderRoomCard(topRooms[1], 'min-h-[14rem]')}
            {topRooms[2] && renderRoomCard(topRooms[2], 'min-h-[14rem]')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {bottomRooms.map((room) => renderRoomCard(room, 'min-h-[18rem]'))}
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
              <p className="text-gray-600 text-lg mb-6">{restaurant.description}</p>
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
                Decouvrir notre carte
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl h-[260px] sm:h-[360px] lg:h-[420px]">
              <Image
                src="/images/corporate/gastroaccueil.jpeg"
                alt="Restaurant gastronomique - Terrasse sur la riviere"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white font-serif text-lg italic">
                  Terrasse avec vue sur la mangrove
                </p>
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
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              {conferences.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {conferences.facilities.map((facility, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary/30 transition-all"
              >
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
              className="inline-flex items-center bg-[#0D3B3E] hover:bg-[#164B4F] text-white px-8 py-4 rounded-full font-semibold transition-colors"
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
                    <span className="text-lg font-semibold text-gray-900 pr-4">
                      {item.question}
                    </span>
                    <span className="text-2xl text-primary leading-none group-open:hidden">+</span>
                    <span className="text-2xl text-primary leading-none hidden group-open:inline">
                      -
                    </span>
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
  )
}
