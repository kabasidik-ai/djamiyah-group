import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { routing } from '@/i18n/routing'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { ContactButton } from '@/components/ContactButton'
import '../globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Groupe Djamiyah | Hôtel Maison Blanche Coyah',
  description:
    "Découvrez l'Hôtel Maison Blanche à Coyah, une expérience unique de confort et de sérénité signée Groupe Djamiyah.",
  openGraph: {
    title: 'Groupe Djamiyah',
    description: 'Hôtel Maison Blanche – Coyah',
    type: 'website',
    siteName: 'Groupe Djamiyah',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Groupe Djamiyah',
    description: 'Hôtel Maison Blanche – Coyah',
  },
  icons: {
    icon: '/images/corporate/favicon-djamiyah.png',
    apple: '/images/corporate/favicon-djamiyah-192.png',
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ContactButton />
        </NextIntlClientProvider>

        {/* GoHighLevel Chat Widget - Configuration */}
        <Script
          id="ghl-widget-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.GHL_WIDGET_CONFIG = {
                locationId: 'a5wcdv6hapHNnLA9xnl4',
                businessId: 'ORWCLXIGJ8k42yscyNzt',
                snapshotId: '67ebbd1e30e269d99774a4a0',
                userNicheId: 'PY4tPIs4Efs5ox3Z7dGZ',
                hidden: true
              };
              console.log('⚙️ GHL Widget config initialisée');
            `,
          }}
        />

        {/* GoHighLevel Chat Widget Loader */}
        <Script
          id="ghl-chat-widget"
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-location-id="a5wcdv6hapHNnLA9xnl4"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('🚀 GHL Widget script chargé')
          }}
          onError={(e) => {
            console.error('❌ Erreur chargement GHL Widget:', e)
          }}
        />
      </body>
    </html>
  )
}
