// ── Galerie photo — Groupe Djamiyah ──────────────────────────────────────────
// Source : public/2Djamiyahgalleryphoto/
// ORDRE STRICT : [0] bateau1-lagune  [1] couloir  [2] suite-salon  …

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
  // Label UI : "Conférences" — clé interne conservée : 'conferences'
  conferences: 'Conférences',
}

export const galleryImages: GalleryImage[] = [
  // ── [0] Image d'ouverture — bateau Maison Blanche sur la lagune ──
  {
    src: '/2Djamiyahgalleryphoto/bateau-vue-lagune-maison-blanche-01-gallery.webp',
    alt: 'Vue lagune avec bateau1 — Hôtel Maison Blanche',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  // ── [1] Couloir Djamiyah ──
  {
    src: '/2Djamiyahgalleryphoto/djamiyah-corridor-01-gallery.webp',
    alt: 'Couloir Djamiyah — Hôtel Maison Blanche',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  // ── [2] Suite Prestige — salon ──
  {
    src: '/2Djamiyahgalleryphoto/suite-prestige-salon-02-gallery.webp',
    alt: 'Suite Prestige — salon',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  // ── Chambres & Suites (suite) ──
  {
    src: '/2Djamiyahgalleryphoto/chambre-suite-prestige-01-gallery.webp',
    alt: 'Chambre Suite Prestige',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/chambre-ambiance-petit-dejeuner-01-gallery.webp',
    alt: 'Chambre — ambiance petit-déjeuner',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/chambre-lifestyle-detente-01-gallery.webp',
    alt: 'Chambre — lifestyle et détente',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/suite-prestige-salon-cuisine-01-gallery.webp',
    alt: 'Suite Prestige — salon et cuisine',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/suite-salon-cuisine-02-gallery.webp',
    alt: 'Suite — salon et cuisine',
    category: 'chambres',
    hotel: 'maison-blanche',
  },
  // ── Restaurant ──
  {
    src: '/2Djamiyahgalleryphoto/restaurant-diner-chandelle-01-gallery.webp',
    alt: 'Restaurant — dîner aux chandelles',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/restaurant-fruits-buffet-01-gallery.webp',
    alt: 'Restaurant — buffet de fruits',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/restaurant-petit-dejeuner-lagune-01-gallery.webp',
    alt: 'Restaurant — petit-déjeuner vue sur lagune',
    category: 'restaurant',
    hotel: 'maison-blanche',
  },
  // ── Conférences & Événements (clé interne : conferences) ──
  {
    src: '/2Djamiyahgalleryphoto/conference-terrasse-lagune-01-gallery.webp',
    alt: 'Conférence — terrasse vue lagune',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/evenement-babyfoot-groupe-01-gallery.webp',
    alt: 'Événement groupe — baby-foot',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/evenement-babyfoot-nuit-01-gallery.webp',
    alt: 'Événement nuit — baby-foot',
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/evenement-independance-groupe-01-gallery.webp',
    alt: "Événement groupe — fête de l'indépendance",
    category: 'conferences',
    hotel: 'maison-blanche',
  },
  // ── Extérieur & Espaces ──
  {
    src: '/2Djamiyahgalleryphoto/exterieur-facade-hotel-01-gallery.webp',
    alt: "Façade de l'Hôtel Maison Blanche",
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/exterieur-jardin-parking-01-gallery.webp',
    alt: 'Jardin et parking — Hôtel Maison Blanche',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-piscine-exterieur-01-gallery.webp',
    alt: 'Piscine extérieure',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-piscine-terrasse-01-gallery.webp',
    alt: 'Piscine — terrasse',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-piscine-cocotiers-01-gallery.webp',
    alt: 'Piscine — cocotiers et détente',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/piscine-detente-boisson-01-gallery.webp',
    alt: 'Piscine — détente et boisson',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-lagune-belvedere-01-gallery.webp',
    alt: 'Espace lagune — belvédère',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
  {
    src: '/2Djamiyahgalleryphoto/espace-lagune-passerelle-01-gallery.webp',
    alt: 'Espace lagune — passerelle',
    category: 'exterieur',
    hotel: 'maison-blanche',
  },
]
