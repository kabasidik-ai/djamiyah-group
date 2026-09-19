// ============================================================
// Chambres standardisées — Hôtel Maison Blanche (Coyah)
//
// Module de données indépendant (aucun alias, aucune dépendance)
// afin que le schéma GroupRequest et-le test runner puissent
// l'importer directement. Source de vérité des noms de chambres
// utilisés dans le formulaire « Groupes & Séminaires ».
// content.ts ré-exporte ces valeurs pour compatibilité.
// ============================================================

export type Room = {
  id: number
  slug: string
  name: string
  description: string
  price: number
  totalUnits: number
  features: string[]
  imageAlt: string
}

export const rooms: Room[] = [
  {
    id: 1,
    slug: 'chambre-confort',
    name: 'Chambre Confort',
    description:
      'Chambre confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs recherchant qualité et sérénité.',
    price: 520000,
    totalUnits: 8,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat'],
    imageAlt: 'Chambre Confort - Hôtel Maison Blanche',
  },
  {
    id: 2,
    slug: 'chambre-premium',
    name: 'Chambre Premium',
    description:
      "Chambre spacieuse premium avec équipements haut de gamme, mini-bar et service personnalisé pour un séjour d'exception.",
    price: 720000,
    totalUnits: 5,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Service VIP'],
    imageAlt: 'Chambre Premium - Hôtel Maison Blanche',
  },
  {
    id: 3,
    slug: 'double-premium',
    name: 'Double Premium',
    description:
      "Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu'à 4 personnes.",
    price: 870000,
    totalUnits: 13,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Espace famille'],
    imageAlt: 'Double Premium - Hôtel Maison Blanche',
  },
  {
    id: 4,
    slug: 'suite-premium',
    name: 'Suite Premium',
    description:
      'Suite élégante avec salon séparé, espaces de vie distincts et services exclusifs. Le luxe accessible.',
    price: 1070000,
    totalUnits: 3,
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
    id: 5,
    slug: 'suite-prestige',
    name: 'Suite Prestige',
    description:
      "Notre suite la plus luxueuse avec grands volumes, jacuzzi et services sur mesure. L'expérience ultime du luxe absolu.",
    price: 1520000,
    totalUnits: 2,
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
]

/** Noms réels des chambres (source unique pour le formulaire & le schéma). */
export const roomNames = rooms.map((room) => room.name)
