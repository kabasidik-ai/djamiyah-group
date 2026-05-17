// ── Galerie photo — Groupe Djamiyah ──────────────────────────────────────────

export type GalleryImage = {
  src: string
  alt: string
  category: 'chambres' | 'restaurant' | 'exterieur' | 'conferences'
  hotel: 'maison-blanche' | 'rama' | 'both'
}

export const categoryLabels: Record<GalleryImage['category'], string> = {
  chambres: 'Chambres & Suites',
  restaurant: 'Restaurant',
  exterieur: 'Extérieur',
  conferences: 'Salles de conférence',
}

export const galleryImages: GalleryImage[] = [
  // ── Chambres & Suites — Maison Blanche ──
  {
    src: '/images/maison-blanche/suite-prestige.jpg',
    alt: 'Suite Prestige — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/suite-premium.jpg',
    alt: 'Suite Premium — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/double-premium.jpg',
    alt: 'Chambre Double Premium — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/chambre-premium.jpg',
    alt: 'Chambre Premium — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/maison-blanche/chambre-confort.jpg',
    alt: 'Chambre Confort — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/salon-suite-prestige.jpg',
    alt: 'Salon Suite Prestige — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/salon-suite-premium.jpeg',
    alt: 'Salon Suite Premium — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/Chambre-confort2.jpeg',
    alt: 'Chambre Confort — vue 2 — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/chambres-double-premium.jpeg',
    alt: 'Chambre Double Premium — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/toilette-confort.jpeg',
    alt: 'Salle de bain Confort — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/toilette-double-premiun.jpeg',
    alt: 'Salle de bain Double Premium — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  // ── Restaurant ──
  {
    src: '/images/corporate/gastronimque-accueil.webp',
    alt: 'Restaurant gastronomique — accueil',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/gastroaccueil.jpeg',
    alt: 'Salle de restaurant — Hôtel Maison Blanche',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/restaurant-service.webp',
    alt: 'Service en salle — Groupe Djamiyah',
    category: 'restaurant',
    hotel: 'both',
  },
  // ── Extérieur ──
  {
    src: '/images/corporate/hotel-maison-blanche-aerien.webp',
    alt: 'Vue aérienne — Hôtel Maison Blanche, Coyah',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/hotel-rama-kissidougou.webp',
    alt: 'Hôtel Rama — Kissidougou',
    category: 'exterieur',
    hotel: 'rama',
  },
  // ── Conférences ──
  {
    src: '/images/conference-maneah.webp',
    alt: 'Salle Maneah — Espace conférence',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/conference-soumbouya.webp',
    alt: 'Salle Soumbouya — Espace séminaire',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/Maneah.webp',
    alt: 'Maneah — configuration banquet',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/images/corporate/soumbouya.webp',
    alt: 'Soumbouya — configuration théâtre',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
]
