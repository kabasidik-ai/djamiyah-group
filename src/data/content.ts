// Centralized content for Groupe Djamiyah Hotel Maison Blanche website
// TODO: Replace placeholder content with real hotel information, images, and details

export const siteConfig = {
  hotelName: "Hotel Maison Blanche",
  groupName: "Groupe Djamiyah",
  location: "Coyah, Guinée",
  tagline: "Plus qu'un séjour, une expérience.",
  description: "Découvrez l'excellence hôtelière avec Groupe Djamiyah. Hôtel Maison Blanche et Hôtel Rama vous offrent un séjour mémorable avec des services premium, une gastronomie raffinée et des installations de conférence de classe mondiale.",
};

export const navigation = {
  main: [
    { name: "Home", href: "/" },
    { name: "Rooms", href: "/rooms" },
    { name: "Restaurant", href: "/restaurant" },
    { name: "Conferences", href: "/conferences" },
    { name: "Reservation", href: "/reservation" },
    { name: "Contact", href: "/contact" },
  ],
  contact: {
    phone: "+224 123 456 789",
    email: "reservations@maisonblanche.coyah.gn",
    address: "Coyah, Guinea",
    googleMapsLink: "https://maps.google.com/?q=Coyah+Guinea",
  },
};

export const heroContent = {
  title: "Bienvenue à l'Hôtel Maison Blanche",
  subtitle: "Groupe Djamiyah - Excellence Hôtelière",
  description: "Découvrez un mélange parfait de confort moderne et de charme traditionnel au cœur de Coyah, Guinée.",
  ctaButton: "Réserver Maintenant",
  secondaryButton: "Découvrir les Chambres",
};

export const rooms = [
  {
    id: 1,
    name: "Standard Room",
    description: "Comfortable room with essential amenities, perfect for short stays.",
    price: 120,
    features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom"],
    imageAlt: "Standard Room - Hotel Maison Blanche",
  },
  {
    id: 2,
    name: "Deluxe Room",
    description: "Spacious room with additional amenities and beautiful views.",
    price: 180,
    features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "Mini-bar", "City view"],
    imageAlt: "Deluxe Room - Hotel Maison Blanche",
  },
  {
    id: 3,
    name: "Executive Suite",
    description: "Luxurious suite with separate living area and premium services.",
    price: 280,
    features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "Mini-bar", "Living area", "Balcony", "Priority service"],
    imageAlt: "Executive Suite - Hotel Maison Blanche",
  },
  {
    id: 4,
    name: "Presidential Suite",
    description: "The ultimate luxury experience with exclusive amenities and services.",
    price: 450,
    features: ["King-size bed", "Wi-Fi", "Air conditioning", "Private bathroom", "Mini-bar", "Living & dining area", "Private balcony", "Butler service", "Jacuzzi"],
    imageAlt: "Presidential Suite - Hotel Maison Blanche",
  },
];

export const restaurant = {
  name: "Le Blanc Restaurant",
  description: "Experience gourmet cuisine with a blend of international and local flavors in an elegant setting.",
  highlights: [
    "International & local cuisine",
    "Fresh ingredients sourced locally",
    "Elegant dining atmosphere",
    "Extensive wine selection",
  ],
  hours: {
    breakfast: "6:30 AM - 10:30 AM",
    lunch: "12:00 PM - 3:00 PM",
    dinner: "6:30 PM - 10:30 PM",
  },
  imageAlt: "Le Blanc Restaurant - Hotel Maison Blanche",
};

export const conferences = {
  title: "Conference & Event Facilities",
  description: "Host your business meetings, conferences, weddings, and special events in our state-of-the-art facilities.",
  facilities: [
    {
      name: "Grand Ballroom",
      capacity: "Up to 500 guests",
      description: "Perfect for large conferences, weddings, and gala events.",
      features: ["Stage", "Audio-visual equipment", "Catering kitchen"],
    },
    {
      name: "Executive Boardroom",
      capacity: "Up to 30 guests",
      description: "Ideal for corporate meetings and presentations.",
      features: ["Conference table", "Projector", "Video conferencing"],
    },
    {
      name: "Seminar Rooms",
      capacity: "Up to 100 guests each",
      description: "Flexible spaces for workshops and training sessions.",
      features: ["Flexible seating", "Whiteboards", "Audio equipment"],
    },
  ],
  services: [
    "Event planning assistance",
    "Catering services",
    "Audio-visual equipment rental",
    "Decoration services",
  ],
};

export const contactInfo = {
  title: "Get in Touch",
  description: "We're here to assist you with your stay, reservations, and any inquiries.",
  details: [
    {
      icon: "phone",
      title: "Phone",
      value: "+224 123 456 789",
      link: "tel:+224123456789",
    },
    {
      icon: "email",
      title: "Email",
      value: "info@maisonblanche.coyah.gn",
      link: "mailto:info@maisonblanche.coyah.gn",
    },
    {
      icon: "location",
      title: "Address",
      value: "Coyah, Guinea",
      link: "https://maps.google.com/?q=Coyah+Guinea",
    },
    {
      icon: "clock",
      title: "Reception Hours",
      value: "24/7",
      link: null,
    },
  ],
};

export const footerContent = {
  description: "Hotel Maison Blanche by Groupe Djamiyah offers luxury accommodations, fine dining, and exceptional event facilities in Coyah, Guinea.",
  quickLinks: [
    { name: "About Us", href: "/about" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Careers", href: "/careers" },
  ],
  social: [
    { name: "Facebook", href: "#", icon: "facebook" },
    { name: "Instagram", href: "#", icon: "instagram" },
    { name: "Twitter", href: "#", icon: "twitter" },
    { name: "LinkedIn", href: "#", icon: "linkedin" },
  ],
  copyright: `© ${new Date().getFullYear()} Groupe Djamiyah - Hotel Maison Blanche. All rights reserved.`,
};