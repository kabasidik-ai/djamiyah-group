import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// URL Supabase extraite de la variable d'env pour les remotePatterns
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : 'gwmdgkhhkyydzqjiqkxh.supabase.co'

const nextConfig: NextConfig = {
  // Force cache-bust pour update chatbot
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Images distantes autorisées (Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ── Redirections permanentes (308) ──────────────────────────────────────────
  async redirects() {
    return [
      // Routes anglaises → équivalents français
      { source: '/rooms', destination: '/chambres', permanent: true },
      { source: '/rooms/:path*', destination: '/chambres/:path*', permanent: true },
      { source: '/conferences', destination: '/evenementiel', permanent: true },
      { source: '/conferences/:path*', destination: '/evenementiel/:path*', permanent: true },
      // Avec préfixe de locale
      { source: '/:locale(fr|en)/rooms', destination: '/:locale/chambres', permanent: true },
      {
        source: '/:locale(fr|en)/conferences',
        destination: '/:locale/evenementiel',
        permanent: true,
      },
    ]
  },

  // En-têtes de sécurité globaux
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://chapchappay.com https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://chapchappay.com;
              img-src 'self' data: https: blob:;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' https://chapchappay.com https://api.chapchappay.com https://${supabaseHostname};
              frame-src 'self' https://chapchappay.com https://www.google.com https://maps.google.com;
            `
              .replace(/\s{2,}/g, ' ')
              .trim(),
          },
        ],
      },
      // Désactive le cache pour les API du chatbot (force refresh mobile)
      {
        source: '/api/chat/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
