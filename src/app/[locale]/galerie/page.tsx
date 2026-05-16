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
            Galerie photo
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Nos hotels, chambres, restaurant et espaces evenementiels en images
          </p>
        </div>
      </section>

      {/* Full gallery */}
      <Gallery />
    </div>
  )
}
