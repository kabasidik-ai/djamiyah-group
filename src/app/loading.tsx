import Image from 'next/image'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        {/* Logo SVG net — préchargé */}
        <Image
          src="/images/logo-djamiyah.svg"
          alt="Groupe Djamiyah"
          width={160}
          height={70}
          className="object-contain"
          priority
        />
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        <p className="text-sm text-gray-400 tracking-wide">Chargement en cours…</p>
      </div>
    </div>
  )
}
