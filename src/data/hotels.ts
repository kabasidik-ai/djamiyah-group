// Configuration des hôtels du Groupe Djamiyah
// Informations pour les deux hôtels : Maison Blanche et Rama

export interface Hotel {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  features: string[];
  amenities: string[];
  roomCategories: RoomCategory[];
  images: HotelImages;
  bookingLink: string;
  googleMapsLink: string;
}

export interface RoomCategory {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  features: string[];
  imageAlt: string;
}

export interface HotelImages {
  hero: string;
  exterior: string;
  lobby: string;
  room: string;
  restaurant: string;
  pool?: string;
}

// Hôtel Maison Blanche
export const maisonBlanche: Hotel = {
  id: "maison-blanche",
  name: "Hôtel Maison Blanche",
  shortName: "Maison Blanche",
  tagline: "L'élégance au cœur de Coyah",
  description: "Vivez une expérience haut de gamme à l'Hôtel Maison Blanche, où l'élégance moderne rencontre l'hospitalité guinéenne.",
  location: "Coyah, Guinée",
  address: "Route Nationale, Coyah, Guinée",
  phone: "+224 610 75 90 90",
  email: "contact@djamiyah.com",
  features: [
    "Hébergements de qualité",
    "Restaurant gastronomique",
    "Espaces conférences et événements",
    "Piscine",
    "Salle de sport",
    "Service de conciergerie 24h/24"
  ],
  amenities: [
    "Wi-Fi haut débit gratuit",
    "Petit-déjeuner inclus",
    "Parking",
    "Service en chambre",
    "Blanchisserie",
    "Salles de réunion"
  ],
  roomCategories: [
    {
      id: "standard",
      name: "Chambre Standard",
      description: "Chambre confortable avec équipements essentiels, idéale pour les courts séjours.",
      priceRange: "520 000 - 1 620 000 GNF/nuit",
      features: ["Lit king-size", "Wi-Fi", "Climatisation", "Salle de bain privative", "Télévision", "Mini-réfrigérateur"],
      imageAlt: "Chambre Standard - Hôtel Maison Blanche"
    },
    {
      id: "deluxe",
      name: "Chambre Deluxe",
      description: "Chambre spacieuse avec équipements supplémentaires et belle vue.",
      priceRange: "520 000 - 1 620 000 GNF/nuit",
      features: ["Lit king-size", "Wi-Fi", "Climatisation", "Salle de bain privative", "Mini-bar", "Vue dégagée", "Bureau"],
      imageAlt: "Chambre Deluxe - Hôtel Maison Blanche"
    },
    {
      id: "executive",
      name: "Suite Exécutive",
      description: "Suite élégante avec espace salon séparé et services premium.",
      priceRange: "520 000 - 1 620 000 GNF/nuit",
      features: ["Lit king-size", "Salon séparé", "Wi-Fi", "Climatisation", "Salle de bain privative", "Mini-bar", "Balcon", "Service prioritaire"],
      imageAlt: "Suite Exécutive - Hôtel Maison Blanche"
    },
    {
      id: "presidential",
      name: "Suite Présidentielle",
      description: "L'expérience la plus exclusive avec prestations dédiées.",
      priceRange: "520 000 - 1 620 000 GNF/nuit",
      features: ["Lit king-size", "Salon et salle à manger", "Wi-Fi", "Climatisation", "Salle de bain privative", "Mini-bar", "Balcon privé", "Service dédié", "Kitchenette"],
      imageAlt: "Suite Présidentielle - Hôtel Maison Blanche"
    }
  ],
  images: {
    hero: "/images/hotels/maison-blanche/hero.jpg",
    exterior: "/images/hotels/maison-blanche/exterior.jpg",
    lobby: "/images/hotels/maison-blanche/lobby.jpg",
    room: "/images/hotels/maison-blanche/room.jpg",
    restaurant: "/images/hotels/maison-blanche/restaurant.jpg",
    pool: "/images/hotels/maison-blanche/pool.jpg"
  },
  bookingLink: "/reservation?hotel=maison-blanche",
  googleMapsLink: "https://maps.google.com/?q=Coyah+Guinea"
};

// Hôtel Rama
export const rama: Hotel = {
  id: "rama",
  name: "Hôtel Rama",
  shortName: "Rama",
  tagline: "Confort et simplicité à Kissidougou",
  description: "Situé à Kissidougou, l'Hôtel Rama propose un cadre accueillant, pratique et confortable pour les voyageurs.",
  location: "Kissidougou, Guinée",
  address: "Kissidougou, Guinée",
  phone: "À venir",
  email: "À venir",
  features: [
    "Hébergements confortables",
    "Emplacement central à Kissidougou",
    "Salles de conférence",
    "Restaurant",
    "Parking"
  ],
  amenities: [
    "Wi-Fi",
    "Petit-déjeuner",
    "Salles de réunion",
    "Blanchisserie",
    "Réception"
  ],
  roomCategories: [
    {
      id: "standard",
      name: "Chambre Standard",
      description: "Chambre confortable et fonctionnelle.",
      priceRange: "À venir",
      features: ["Lit queen-size", "Wi-Fi", "Climatisation", "Salle de bain privative", "Télévision", "Bureau"],
      imageAlt: "Chambre Standard - Hôtel Rama"
    },
    {
      id: "business",
      name: "Chambre Confort",
      description: "Chambre améliorée avec plus d'espace.",
      priceRange: "À venir",
      features: ["Lit king-size", "Wi-Fi", "Climatisation", "Salle de bain privative", "Grand bureau", "Mini-bar"],
      imageAlt: "Chambre Confort - Hôtel Rama"
    },
    {
      id: "suite",
      name: "Suite",
      description: "Suite spacieuse avec espace salon séparé.",
      priceRange: "À venir",
      features: ["Lit king-size", "Salon séparé", "Wi-Fi", "Climatisation", "Salle de bain privative", "Mini-bar", "Kitchenette", "Balcon"],
      imageAlt: "Suite - Hôtel Rama"
    }
  ],
  images: {
    hero: "/images/hotels/rama/hero.jpg",
    exterior: "/images/hotels/rama/exterior.jpg",
    lobby: "/images/hotels/rama/lobby.jpg",
    room: "/images/hotels/rama/room.jpg",
    restaurant: "/images/hotels/rama/restaurant.jpg"
  },
  bookingLink: "/reservation?hotel=rama",
  googleMapsLink: "https://maps.google.com/?q=Kissidougou+Guinea"
};

// Tous les hôtels
export const hotels: Hotel[] = [maisonBlanche, rama];

// Groupes hôteliers
export const hotelGroups = {
  djamiyah: {
    name: "Groupe Djamiyah",
    description: "Un groupe hôtelier d'excellence offrant des hébergements de qualité en Guinée.",
    hotels: [maisonBlanche, rama]
  }
};

export default hotels;