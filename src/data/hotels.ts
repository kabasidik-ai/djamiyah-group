// Configuration des hôtels du Groupe Djamiyah
// Informations pour les deux hôtels : Maison Blanche et Rama

export interface Hotel {
  id: string
  name: string
  shortName: string
  tagline: string
  description: string
  location: string
  address: string
  phone: string
  email: string
  features: string[]
  amenities: string[]
  roomCategories: RoomCategory[]
  images: HotelImages
  bookingLink: string
  googleMapsLink: string
}

export interface RoomCategory {
  id: string
  name: string
  description: string
  priceRange: string
  features: string[]
  imageAlt: string
}

export interface HotelImages {
  hero: string
  exterior: string
  lobby: string
  room: string
  restaurant: string
  pool?: string
}

// Hôtel Maison Blanche
export const maisonBlanche: Hotel = {
  id: 'maison-blanche',
  name: 'Hôtel Maison Blanche',
  shortName: 'Maison Blanche',
  tagline: "L'élégance au cœur de Coyah",
  description:
    "Vivez une expérience haut de gamme à l'Hôtel Maison Blanche, où l'élégance moderne rencontre l'hospitalité guinéenne.",
  location: 'Coyah, Guinée',
  address: 'Route Nationale, Coyah, Guinée',
  phone: '+224 610 75 90 90',
  email: 'contact@djamiyah.com',
  features: [
    'Hébergements de qualité',
    'Restaurant gastronomique',
    'Espaces conférences et événements',
    'Piscine',
    'Salle de sport',
    'Service de conciergerie 24h/24',
  ],
  amenities: [
    'Wi-Fi haut débit gratuit',
    'Petit-déjeuner inclus',
    'Parking',
    'Service en chambre',
    'Blanchisserie',
    'Salles de réunion',
  ],
  roomCategories: [
    {
      id: 'chambre-confort',
      name: 'Chambre Confort',
      description:
        'Chambre confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs recherchant qualité et sérénité.',
      priceRange: '520 000 GNF/nuit',
      features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Salle de bain privative'],
      imageAlt: 'Chambre Confort - Hôtel Maison Blanche',
    },
    {
      id: 'chambre-premium',
      name: 'Chambre Premium',
      description:
        'Chambre spacieuse premium avec équipements haut de gamme, mini-bar et service personnalisé.',
      priceRange: '720 000 GNF/nuit',
      features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Service VIP'],
      imageAlt: 'Chambre Premium - Hôtel Maison Blanche',
    },
    {
      id: 'double-premium',
      name: 'Double Premium',
      description:
        "Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu'à 4 personnes.",
      priceRange: '870 000 GNF/nuit',
      features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Espace famille'],
      imageAlt: 'Double Premium - Hôtel Maison Blanche',
    },
    {
      id: 'suite-premium',
      name: 'Suite Premium',
      description:
        'Suite élégante avec salon séparé, espaces de vie distincts et services exclusifs.',
      priceRange: '1 070 000 GNF/nuit',
      features: [
        'Climatisation',
        'Wi-Fi',
        'TV écran plat',
        'Salon séparé',
        'Mini-bar',
        'Service concierge',
      ],
      imageAlt: 'Suite Premium - Hôtel Maison Blanche',
    },
    {
      id: 'suite-prestige',
      name: 'Suite Prestige',
      description:
        'Notre suite la plus luxueuse avec grands volumes, jacuzzi et services sur mesure.',
      priceRange: '1 620 000 GNF/nuit',
      features: [
        'Climatisation',
        'Wi-Fi',
        'TV écran plat',
        'Salon séparé',
        'Jacuzzi',
        'Service concierge 24h/24',
        'Terrasse privée',
      ],
      imageAlt: 'Suite Prestige - Hôtel Maison Blanche',
    },
  ],
  images: {
    hero: '/images/corporate/hotel-maison-blanche-aerien.webp',
    exterior: '/images/corporate/hotel-maison-blanche-aerien.webp',
    lobby: '/images/corporate/logo-maison-blanche.png',
    room: '/images/maison-blanche/suite-premium.jpg',
    restaurant: '/images/restaurant-service.webp',
    pool: '/images/corporate/hero-fallback.jpg',
  },
  bookingLink: '/reservation?hotel=maison-blanche',
  googleMapsLink: 'https://maps.google.com/?q=Coyah+Guinea',
}

// Hôtel Rama
export const rama: Hotel = {
  id: 'rama',
  name: 'Hôtel Rama',
  shortName: 'Rama',
  tagline: 'Confort et simplicité à Kissidougou',
  description:
    "Situé à Kissidougou, l'Hôtel Rama propose un cadre accueillant, pratique et confortable pour les voyageurs.",
  location: 'Kissidougou, Guinée',
  address: 'Kissidougou, Guinée',
  phone: 'À venir',
  email: 'À venir',
  features: [
    'Hébergements confortables',
    'Emplacement central à Kissidougou',
    'Salles de conférence',
    'Restaurant',
    'Parking',
  ],
  amenities: ['Wi-Fi', 'Petit-déjeuner', 'Salles de réunion', 'Blanchisserie', 'Réception'],
  roomCategories: [
    {
      id: 'standard',
      name: 'Chambre Standard',
      description: 'Chambre confortable et fonctionnelle.',
      priceRange: 'À venir',
      features: [
        'Lit queen-size',
        'Wi-Fi',
        'Climatisation',
        'Salle de bain privative',
        'Télévision',
        'Bureau',
      ],
      imageAlt: 'Chambre Standard - Hôtel Rama',
    },
    {
      id: 'business',
      name: 'Chambre Confort',
      description: "Chambre améliorée avec plus d'espace.",
      priceRange: 'À venir',
      features: [
        'Lit king-size',
        'Wi-Fi',
        'Climatisation',
        'Salle de bain privative',
        'Grand bureau',
        'Mini-bar',
      ],
      imageAlt: 'Chambre Confort - Hôtel Rama',
    },
    {
      id: 'suite',
      name: 'Suite',
      description: 'Suite spacieuse avec espace salon séparé.',
      priceRange: 'À venir',
      features: [
        'Lit king-size',
        'Salon séparé',
        'Wi-Fi',
        'Climatisation',
        'Salle de bain privative',
        'Mini-bar',
        'Kitchenette',
        'Balcon',
      ],
      imageAlt: 'Suite - Hôtel Rama',
    },
  ],
  images: {
    hero: '/images/hotel-rama-kissidougou.webp',
    exterior: '/images/hotel-rama-kissidougou.webp',
    lobby: '/images/corporate/logo-groupe-djamiyah.png',
    room: '/images/maison-blanche/chambre-premium.jpg',
    restaurant: '/images/restaurant-service.webp',
  },
  bookingLink: '/reservation?hotel=rama',
  googleMapsLink: 'https://maps.google.com/?q=Kissidougou+Guinea',
}

// Tous les hôtels
export const hotels: Hotel[] = [maisonBlanche, rama]

// Groupes hôteliers
export const hotelGroups = {
  djamiyah: {
    name: 'Groupe Djamiyah',
    description: "Un groupe hôtelier d'excellence offrant des hébergements de qualité en Guinée.",
    hotels: [maisonBlanche, rama],
  },
}

export default hotels
