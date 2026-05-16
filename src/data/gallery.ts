export type GalleryImage = {
  src: string
  alt: string
  category: 'chambres' | 'restaurant' | 'exterieur' | 'conferences'
  hotel: 'maison-blanche' | 'rama' | 'both'
}

export const galleryImages: GalleryImage[] = [
  // ── Chambres ──────────────────────────────────────────────────
  {
    src: '/images/maison-blanche/chambre-confort.jpg',
    alt: 'Chambre Confort — Hotel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/chambre-premium.jpg',
    alt: 'Chambre Premium — Hotel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/double-premium.jpg',
    alt: 'Double Premium — Hotel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/suite-premium.jpg',
    alt: 'Suite Premium — Hotel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/suite-prestige.jpg',
    alt: 'Suite Prestige — Hotel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/Chambre-confort2.jpeg',
    alt: 'Chambre Confort — vue alternative',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/chambres-double-premium.jpeg',
    alt: 'Double Premium — salle de bain',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/salon-suite-premium.jpeg',
    alt: 'Suite Premium — salon',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/salon-suite-prestige.jpg',
    alt: 'Suite Prestige — salon',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/toilette-confort.jpeg',
    alt: 'Salle de bain — Chambre Confort',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/toilette-double-premiun.jpeg',
    alt: 'Salle de bain — Double Premium',
    category: 'chambres',
    hotel: 'maison-blanche',
  },

  // ── Restaurant ────────────────────────────────────────────────
  {
    src: '/images/corporate/restaurant-service.webp',
    alt: 'Service au restaurant — Hotel Maison Blanche',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/gastroaccueil.jpeg',
    alt: 'Accueil gastronomique — terrasse',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/gastronimque-accueil.webp',
    alt: 'Espace gastronomique — vue riviere',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },

  // ── Exterieur ─────────────────────────────────────────────────
  {
    src: '/images/corporate/hotel-maison-blanche-aerien.webp',
    alt: 'Hotel Maison Blanche — vue aerienne',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/hero-fallback.jpg',
    alt: 'Hotel Maison Blanche — facade principale',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/hotel-ramakissidougou.webp',
    alt: 'Hotel Rama — Kissidougou',
    category: 'exterieur',
    hotel: 'rama',
  },

  // ── Salles de conference ──────────────────────────────────────
  {
    src: '/images/corporate/Maneah.webp',
    alt: 'Salle de conference Maneah',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/soumbouya.webp',
    alt: 'Salle de conference Soumbouya',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/heroevent.png',
    alt: 'Espace evenementiel — Hotel Maison Blanche',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
]

export const categoryLabels: Record<GalleryImage['category'], string> = {
  chambres: 'Chambres',
  restaurant: 'Restaurant',
  exterieur: 'Exterieur',
  conferences: 'Salles de conference',
}

export const hotelLabels: Record<string, string> = {
  all: 'Tous',
  'maison-blanche': 'Maison Blanche',
  rama: 'Rama',
}
