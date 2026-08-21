import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Espace Staff — Djamiyah Group',
  description: 'Administration des réservations Djamiyah Group',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 min-h-screen">{children}</div>
}
