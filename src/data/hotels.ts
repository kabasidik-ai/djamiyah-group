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
  conference?: HotelConference
  restaurant?: HotelRestaurant
}

export interface RoomCategory {
  id: string
  name: string
  description: string
  priceRange: string
  features: string[]
  imageAlt: string
  /** Nombre d'unités disponibles (ex: 14 chambres) — optionnel */
  count?: number
}

export interface HotelConference {
  capacity: string
  halfDayPrice: string
  fullDayPrice: string
}

export interface HotelRestaurant {
  /** Libellé établissement (ex: "Hôtel Rama — Kissidougou") */
  label: string
  /** Horaires d'ouverture du restaurant */
  hours: string
  /**
   * Restaurant à menu structuré (Maison Blanche → la carte vit dans src/data/menu.ts)
   * ou à menu variable (Rama → message "menu du jour" + appel téléphone).
   */
  menuType: 'structured' | 'variable'
  /** Message affiché quand le menu est variable (Rama) */
  menuNote?: string
  /** Téléphone d'appel (affichage) */
  phone: string
  /** Lien tel: pour le CTA "Appeler le restaurant" */
  phoneHref: string
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
  email: 'contact@djamiyahgroup.com',
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
      priceRange: '1 520 000 GNF/nuit',
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
    lobby: '/images/logo-djamiyah.svg',
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
  tagline: 'Le même standing Djamiyah à Kissidougou',
  description:
    "À Kissidougou, l'Hôtel Rama reproduit fidèlement le standing, les équipements et la capacité des catégories équivalentes de la Maison Blanche : chambres Confort et Double Premium, salle de conférence de 70 personnes et restaurant.",
  location: 'Kissidougou, Guinée',
  address: 'Kissidougou, Guinée',
  phone: '611 65 53 19',
  email: 'À venir',
  features: [
    'Hébergements confortables',
    'Emplacement central à Kissidougou',
    'Salle de conférence — 70 personnes',
    'Restaurant ouvert de 08h00 à 22h45',
    'Parking',
  ],
  amenities: ['Wi-Fi', 'Petit-déjeuner', 'Salles de réunion', 'Blanchisserie', 'Réception'],
  roomCategories: [
    {
      id: 'confort',
      name: 'Confort',
      description:
        'Chambre confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs recherchant qualité et sérénité.',
      priceRange: '500 000 GNF / nuit',
      count: 14,
      features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Salle de bain privative', 'Bureau'],
      imageAlt: 'Chambre Confort - Hôtel Rama',
    },
    {
      id: 'double-premium',
      name: 'Double Premium',
      description:
        "Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu'à 4 personnes.",
      priceRange: '750 000 GNF / nuit',
      count: 4,
      features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Espace famille'],
      imageAlt: 'Double Premium - Hôtel Rama',
    },
  ],
  images: {
    hero: '/images/hotel-rama-kissidougou.webp',
    exterior: '/images/hotel-rama-kissidougou.webp',
    lobby: '/images/logo-djamiyah.svg',
    room: '/images/maison-blanche/chambre-premium.jpg',
    restaurant: '/images/restaurant-service.webp',
  },
  bookingLink: '/reservation?hotel=rama',
  googleMapsLink: 'https://maps.google.com/?q=Kissidougou+Guinea',
  conference: {
    capacity: '70 personnes',
    halfDayPrice: '1 000 000 GNF',
    fullDayPrice: '2 000 000 GNF',
  },
  restaurant: {
    label: 'Hôtel Rama — Kissidougou',
    hours: '08h00 – 22h45',
    menuType: 'variable',
    menuNote:
      'Menu du jour selon disponibilité. Pour connaître les plats disponibles, appelez le 611 65 53 19.',
    phone: '611 65 53 19',
    phoneHref: 'tel:611655319',
  },
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
