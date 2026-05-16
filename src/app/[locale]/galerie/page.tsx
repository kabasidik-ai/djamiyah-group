import Link from 'next/link'
import Gallery from '@/components/Gallery'

export const metadata = {
  title: 'Galerie | Groupe Djamiyah',
  description:
    'Decouvrez en images les chambres, le restaurant, les espaces exterieurs et les salles de conference du Groupe Djamiyah.',
}

export default function GaleriePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0D3B3E] py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Galerie — Groupe Djamiyah
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-6">
            Nos hotels, chambres, restaurant et espaces evenementiels en images
          </p>
          <Link
            href="/#galerie"
            className="inline-flex items-center gap-2 text-[#F9A03F] hover:text-white text-sm font-medium transition-colors duration-200"
          >
            Voir le diaporama immersif
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 12l4-4-4-4" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Full gallery grid */}
      <Gallery />
    </div>
  )
}
