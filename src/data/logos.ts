// Logo configuration for Groupe Djamiyah
// Temporary placeholders until final logos are provided

export const logoConfig = {
  // Temporary placeholder logos (to be replaced with final logos)
  placeholders: {
    groupeDjamiyah: "/images/corporate/logo-groupe-djamiyah.png",
    maisonBlanche: "/images/corporate/logo-maison-blanche.png 2(600x150).png",
    maisonBlancheSvg: "/images/corporate/logo-maison-blanche.SGV (600x150).svg",
    favicon: "/images/corporate/favicon-djamiyah.png",
  },
  
  // Logo variants
  variants: {
    light: {
      groupeDjamiyah: "/logos/groupe-djamiyah-light.svg",
      maisonBlanche: "/logos/maison-blanche-light.svg",
    },
    dark: {
      groupeDjamiyah: "/logos/groupe-djamiyah-dark.svg",
      maisonBlanche: "/logos/maison-blanche-dark.svg",
    },
  },
  
  // Dimensions
  dimensions: {
    navigation: {
      width: 120,
      height: 40,
    },
    footer: {
      width: 160,
      height: 50,
    },
    hero: {
      width: 200,
      height: 60,
    },
  },
  
  // Alt text
  altText: {
    groupeDjamiyah: "Groupe Djamiyah Logo",
    maisonBlanche: "Hotel Maison Blanche Logo",
  },
};

// SVG placeholder logos (simple colored versions)
export const svgLogos = {
  groupeDjamiyah: `
    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="#0D3B3E"/>
      <text x="60" y="25" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">DJAMIYAH</text>
      <text x="60" y="35" textAnchor="middle" fill="#F9A03F" fontFamily="Arial, sans-serif" fontSize="10">GROUP</text>
    </svg>
  `,
  
  maisonBlanche: `
    <svg width="150" height="50" viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="50" rx="10" fill="white" stroke="#0D3B3E" strokeWidth="2"/>
      <rect x="30" y="10" width="90" height="30" rx="6" fill="#0D3B3E"/>
      <text x="75" y="33" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">MAISON BLANCHE</text>
      <text x="75" y="45" textAnchor="middle" fill="#F9A03F" fontFamily="Arial, sans-serif" fontSize="10">HOTEL</text>
    </svg>
  `,
  
  simpleLogo: `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0D3B3E"/>
      <circle cx="20" cy="20" r="10" fill="#F9A03F"/>
      <path d="M20 10 L20 30 M10 20 L30 20" stroke="white" strokeWidth="2"/>
    </svg>
  `,
};

// Logo URLs for Next.js Image component
export const logoUrls = {
  // Using actual logo files from corporate folder
  groupeDjamiyah: "/images/corporate/logo-groupe-djamiyah.png",
  maisonBlanche: "/images/corporate/logo-maison-blanche.png 2(600x150).png",
  favicon: "/images/corporate/favicon-djamiyah.png",
};

// Export default configuration
export default logoConfig;