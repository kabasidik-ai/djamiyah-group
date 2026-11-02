// Validation des variables d'environnement au boot — doit rester en premier import
import '@/lib/env'

import { Cormorant_Garamond, Manrope } from 'next/font/google'

// Identité typographique premium : Cormorant Garamond (titres) + Manrope (UI).
// Chargées au ROOT layout pour couvrir les pages publiques ET l'administration.
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
})

// Root layout — fournit <html> et <body> obligatoires pour Next.js 16.
// Les variables next/font sont posées sur <html> (scope :root) : les tokens
// Tailwind `--font-*` calculés à :root peuvent alors résoudre var(--font-*).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${manrope.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
