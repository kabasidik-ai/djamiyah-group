// Hotels configuration for Groupe Djamiyah
// Contains information for both hotels: Maison Blanche and Rama

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

// Hotel Maison Blanche
export const maisonBlanche: Hotel = {
  id: "maison-blanche",
  name: "Hôtel Maison Blanche",
  shortName: "Maison Blanche",
  tagline: "Luxury Redefined in Coyah",
  description: "Experience unparalleled luxury at Hôtel Maison Blanche, where modern elegance meets traditional Guinean hospitality. Our 5-star hotel offers exquisite accommodations, fine dining, and state-of-the-art conference facilities in the heart of Coyah.",
  location: "Coyah, Guinée",
  address: "Route Nationale, Coyah, Guinea",
  phone: "+224 123 456 789",
  email: "reservations@maisonblanche.coyah.gn",
  features: [
    "5-Star Luxury Accommodations",
    "Fine Dining Restaurant",
    "Conference & Event Facilities",
    "Swimming Pool",
    "Fitness Center",
    "Spa Services",
    "Business Center",
    "24/7 Concierge"
  ],
  amenities: [
    "Free High-Speed WiFi",
    "Complimentary Breakfast",
    "Airport Transportation",
    "Valet Parking",
    "Room Service 24/7",
    "Laundry & Dry Cleaning",
    "Meeting Rooms",
    "Tour Desk"
  ],
  roomCategories: [
    {
      id: "standard",
      name: "Standard Room",
      description: "Comfortable room with essential amenities, perfect for short stays.",
      priceRange: "$120 - $150/night",
      features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "TV", "Mini-fridge"],
      imageAlt: "Standard Room - Hotel Maison Blanche"
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      description: "Spacious room with additional amenities and beautiful city views.",
      priceRange: "$180 - $220/night",
      features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "Mini-bar", "City view", "Work desk"],
      imageAlt: "Deluxe Room - Hotel Maison Blanche"
    },
    {
      id: "executive",
      name: "Executive Suite",
      description: "Luxurious suite with separate living area and premium services.",
      priceRange: "$280 - $350/night",
      features: ["King-size bed", "Separate living area", "Wi-Fi", "Air conditioning", "Private bathroom", "Mini-bar", "Balcony", "Priority service"],
      imageAlt: "Executive Suite - Hotel Maison Blanche"
    },
    {
      id: "presidential",
      name: "Presidential Suite",
      description: "The ultimate luxury experience with exclusive amenities and butler service.",
      priceRange: "$450 - $550/night",
      features: ["King-size bed", "Living & dining area", "Wi-Fi", "Air conditioning", "Private bathroom with jacuzzi", "Mini-bar", "Private balcony", "Butler service", "Kitchenette"],
      imageAlt: "Presidential Suite - Hotel Maison Blanche"
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

// Hotel Rama
export const rama: Hotel = {
  id: "rama",
  name: "Hôtel Rama",
  shortName: "Rama",
  tagline: "Modern Comfort in Conakry",
  description: "Located in the vibrant capital of Conakry, Hôtel Rama offers contemporary comfort with excellent business facilities. Perfect for business travelers and tourists alike, our hotel combines modern amenities with warm Guinean hospitality.",
  location: "Conakry, Guinée",
  address: "Boulevard du Commerce, Conakry, Guinea",
  phone: "+224 987 654 321",
  email: "reservations@rama.conakry.gn",
  features: [
    "4-Star Business Hotel",
    "Central Location in Conakry",
    "Business Center",
    "Conference Rooms",
    "Restaurant & Bar",
    "Fitness Facility",
    "Free Parking",
    "Airport Shuttle"
  ],
  amenities: [
    "Free High-Speed WiFi",
    "Complimentary Breakfast",
    "Business Center Access",
    "Meeting Facilities",
    "Laundry Service",
    "24/7 Front Desk",
    "Tour Assistance",
    "Car Rental Service"
  ],
  roomCategories: [
    {
      id: "standard",
      name: "Standard Room",
      description: "Comfortable and functional room ideal for business travelers.",
      priceRange: "$90 - $120/night",
      features: ["Queen-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "TV", "Work desk", "Coffee maker"],
      imageAlt: "Standard Room - Hotel Rama"
    },
    {
      id: "business",
      name: "Business Room",
      description: "Enhanced room with additional workspace and business amenities.",
      priceRange: "$130 - $160/night",
      features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "Spacious work desk", "Mini-bar", "City view"],
      imageAlt: "Business Room - Hotel Rama"
    },
    {
      id: "suite",
      name: "Executive Suite",
      description: "Spacious suite with separate living area for extended stays.",
      priceRange: "$200 - $250/night",
      features: ["King-size bed", "Separate living area", "Wi-Fi", "Air conditioning", "Private bathroom", "Mini-bar", "Kitchenette", "Balcony"],
      imageAlt: "Executive Suite - Hotel Rama"
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
  googleMapsLink: "https://maps.google.com/?q=Conakry+Guinea"
};

// All hotels
export const hotels: Hotel[] = [maisonBlanche, rama];

// Hotel groups
export const hotelGroups = {
  djamiyah: {
    name: "Groupe Djamiyah",
    description: "A premier hospitality group offering luxury accommodations across Guinea.",
    hotels: [maisonBlanche, rama]
  }
};

export default hotels;