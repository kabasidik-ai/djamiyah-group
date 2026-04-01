import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// URL Supabase extraite de la variable d'env pour les remotePatterns
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : 'gwmdgkhhkyydzqjiqkxh.supabase.co'

const nextConfig: NextConfig = {
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
    ]
  },
}

export default withNextIntl(nextConfig)
