// Configuration des logos du Groupe Djamiyah
// Logos SVG importés

export const logoConfig = {
  // Logos du Groupe Djamiyah
  logos: {
    groupeDjamiyah: "/images/corporate/logo-groupe-djamiyah.png",
    maisonBlanche: "/images/corporate/logo-maison-blanche.png",
    favicon: "/images/corporate/favicon-djamiyah.png",
  },
  
  // Dimensions recommandées
  dimensions: {
    navigation: {
      width: 140,
      height: 48,
    },
    footer: {
      width: 160,
      height: 55,
    },
    hero: {
      width: 280,
      height: 96,
    },
  },
  
  // Textes alternatifs
  altText: {
    groupeDjamiyah: "Logo Groupe Djamiyah",
    maisonBlanche: "Logo Hôtel Maison Blanche",
  },
};

// Logo SVG du Groupe Djamiyah (officiel)
export const logoGroupeDjamiyahSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 60" fill="none">
  <circle cx="30" cy="30" r="25" fill="#0D5C63"/>
  <circle cx="30" cy="30" r="20" fill="#F4A460"/>
  <text x="110" y="28" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0D5C63">GROUPE</text>
  <text x="110" y="48" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0D5C63">DJAMIYAH</text>
  <path d="M95 35 Q100 20, 105 35" stroke="#0D5C63" stroke-width="2" fill="none"/>
</svg>`;

// Logos SVG temporaires (versions alternatives)
export const svgLogos = {
  groupeDjamiyah: logoGroupeDjamiyahSvg,
  
  maisonBlanche: `
    <svg width="150" height="50" viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="50" rx="10" fill="white" stroke="#0D5C63" strokeWidth="2"/>
      <rect x="30" y="10" width="90" height="30" rx="6" fill="#0D5C63"/>
      <text x="75" y="33" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">MAISON BLANCHE</text>
      <text x="75" y="45" text-anchor="middle" fill="#F4A460" font-family="Arial, sans-serif" font-size="10">HÔTEL</text>
    </svg>
  `,
  
  simpleLogo: `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0D5C63"/>
      <circle cx="20" cy="20" r="10" fill="#F4A460"/>
      <path d="M20 10 L20 30 M10 20 L30 20" stroke="white" stroke-width="2"/>
    </svg>
  `,
};

// URL des logos pour le composant Image de Next.js
export const logoUrls = {
  groupeDjamiyah: "/images/corporate/logo-groupe-djamiyah.png",
  maisonBlanche: "/images/corporate/logo-maison-blanche.png",
  favicon: "/images/corporate/favicon-djamiyah.png",
};

// Export de la configuration par défaut
export default logoConfig;
