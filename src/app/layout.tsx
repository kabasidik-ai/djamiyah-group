// Validation des variables d'environnement au boot — doit rester en premier import
import '@/lib/env'

import { Inter } from 'next/font/google'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

// Root layout — fournit <html> et <body> obligatoires pour Next.js 16.
// Le contenu spécifique (nav, footer, i18n) est dans les layouts enfants.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
