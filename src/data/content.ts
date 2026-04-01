// Contenu centralisé pour le site du Groupe Djamiyah - Hôtel Maison Blanche
export const siteConfig = {
  hotelName: 'Hôtel Maison Blanche – Coyah',
  groupName: 'Groupe Djamiyah',
  location: 'Coyah, Guinée',
  tagline: "Plus qu'un séjour, une expérience.",
  description:
    "Découvrez l'excellence hôtelière avec Groupe Djamiyah. Hôtel Maison Blanche et Hôtel Rama vous offrent un séjour mémorable avec des services premium, une gastronomie raffinée et des installations de conférence de classe mondiale.",
}

export const navigation = {
  main: [
    { name: 'Accueil', href: '/' },
    { name: 'Nos Hôtels', href: '/hotels' },
    { name: 'Chambres', href: '/rooms' },
    { name: 'Restaurant', href: '/restaurant' },
    { name: 'Conférences', href: '/conferences' },
    { name: 'Réservation', href: '/reservation' },
    { name: 'Contact', href: '/contact' },
  ],
  contact: {
    phone: '+224 610 75 90 90',
    email: 'contact@djamiyah.com',
    address: 'Coyah, Guinée',
    googleMapsLink: 'https://maps.google.com/?q=Coyah+Guinea',
  },
}

export const heroContent = {
  title: 'Groupe Djamiyah',
  subtitle: 'Hôtel Maison Blanche – Coyah',
  description: "Plus qu'un séjour, une expérience.",
  ctaButton: 'Réserver maintenant',
  secondaryButton: 'Découvrir les chambres',
}

// ─── Chambres avec unités ────────────────────────────────────────────────────────

export const rooms = [
  {
    id: 1,
    name: 'Chambre Éco Confort',
    description:
      'Chambre économique et confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs soucieux de leur budget.',
    price: 280000,
    totalUnits: 8,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat'],
    imageAlt: 'Chambre Éco Confort - Hôtel Maison Blanche',
  },
  {
    id: 2,
    name: 'Chambre Confort Jardin',
    description:
      "Chambre confortable avec vue sur jardin, climatisation et équipements de qualité. Profitez d'un séjour reposant dans un cadre verdoyant.",
    price: 520000,
    totalUnits: 8,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Vue jardin'],
    imageAlt: 'Chambre Confort Jardin - Hôtel Maison Blanche',
  },
  {
    id: 3,
    name: 'Chambre Premium VIP',
    description:
      "Chambre spacieuse premium VIP avec équipements haut de gamme et service personnalisé pour un séjour d'exception.",
    price: 720000,
    totalUnits: 5,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Service VIP'],
    imageAlt: 'Chambre Premium VIP - Hôtel Maison Blanche',
  },
  {
    id: 4,
    name: 'Double Premium',
    description:
      "Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu'à 4 personnes.",
    price: 870000,
    totalUnits: 13,
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Espace famille'],
    imageAlt: 'Double Premium - Hôtel Maison Blanche',
  },
  {
    id: 5,
    name: 'Grande Suite Prestige',
    description:
      "Notre suite la plus luxueuse avec grands volumes, salon séparé et services exclusifs. L'expérience ultime du luxe.",
    price: 1620000,
    totalUnits: 3,
    features: [
      'Climatisation',
      'Wi-Fi',
      'TV écran plat',
      'Salon séparé',
      'Service concierge',
      'Jacuzzi',
    ],
    imageAlt: 'Grande Suite Prestige - Hôtel Maison Blanche',
  },
]

// ─── Restaurant ────────────────────────────────────────────────────────────────

export const restaurant = {
  name: 'Restaurant Gastronomique',
  description:
    'Découvrez une cuisine raffinée avec un mélange de saveurs internationales et locales dans un cadre élégant.',
  highlights: [
    'Cuisine internationale et locale',
    'Ingrédients frais provenant de sources locales',
    'Ambiance de repas élégante',
  ],
  hours: {
    breakfast: '06:30 - 10:30',
    lunch: '12:00 - 15:00',
    dinner: '18:30 - 22:30',
  },
  imageAlt: 'Restaurant Gastronomique - Hôtel Maison Blanche',
}

// ─── Conférences ────────────────────────────────────────────────────────────────

export const conferences = {
  title: 'Espaces événementiels',
  description:
    'Organisez vos réunions professionnelles, conférences, mariages et événements spéciaux dans nos installations de dernière génération.',
  facilities: [
    {
      name: 'Wonkifon',
      capacity: '20 places',
      description: 'Salle intimiste pour réunions et séminaires restreints. 1 500 000 GNF/jour',
      features: ['Équipement audio-visuel', 'Service de restauration'],
    },
    {
      name: 'Somayah',
      capacity: '50 places',
      description: 'Espace polyvalent pour conférences de taille moyenne. 2 000 000 GNF/jour',
      features: ['Équipement audio-visuel', 'Service de restauration'],
    },
    {
      name: 'Maneah',
      capacity: '75 places',
      description: 'Grande salle équipée pour événements professionnels. 2 500 000 GNF/jour',
      features: ['Équipement audio-visuel', 'Service de restauration'],
    },
    {
      name: 'Soumbouyah',
      capacity: '150 places',
      description:
        'Notre plus grande salle pour congrès, mariages et grands événements. 5 000 000 GNF/jour',
      features: ['Équipement audio-visuel', 'Service de restauration'],
    },
  ],
  services: [
    "Assistance à la planification d'événements",
    'Services de restauration',
    "Location d'équipement audio-visuel",
    'Services de décoration',
  ],
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export const contactInfo = {
  title: 'Contactez-nous',
  description:
    'Nous sommes là pour vous aider avec votre séjour, vos réservations et toute demande.',
  details: [
    {
      icon: 'phone',
      title: 'Téléphone',
      value: '+224 610 75 90 90',
      link: 'tel:+224610759090',
    },
    {
      icon: 'email',
      title: 'Adresse email',
      value: 'contact@djamiyah.com',
      link: 'mailto:contact@djamiyah.com',
    },
    {
      icon: 'location',
      title: 'Adresse',
      value: 'Coyah, Guinée',
      link: 'https://maps.google.com/?q=Coyah+Guinea',
    },
    {
      icon: 'clock',
      title: 'Heures de réception',
      value: '24/7',
      link: null,
    },
  ],
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export const footerContent = {
  description:
    "L'Hôtel Maison Blanche du Groupe Djamiyah vous offre un séjour mémorable avec des services premium et une gastronomie raffinée à Coyah, Guinée.",
  quickLinks: [
    { name: 'À propos', href: '/about' },
    { name: 'Politique de confidentialité', href: '/privacy' },
    { name: "Conditions d'utilisation", href: '/terms' },
    { name: 'Emplois', href: '/careers' },
  ],
  social: [
    { name: 'Facebook', href: 'https://www.facebook.com/groupedjamiyah', icon: 'facebook' },
    { name: 'Instagram', href: '#', icon: 'instagram' },
    { name: 'Twitter', href: '#', icon: 'twitter' },
    { name: 'LinkedIn', href: '#', icon: 'linkedin' },
  ],
  copyright: `© ${new Date().getFullYear()} Groupe Djamiyah - Hôtel Maison Blanche. Tous droits réservés.`,
}
