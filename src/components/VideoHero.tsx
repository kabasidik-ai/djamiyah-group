import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

type VideoHeroProps = {
  videoSrc: string
  poster: string
  fallbackImage: string
  alt?: string
}

export const VideoHero: React.FC<VideoHeroProps> = ({
  videoSrc,
  poster,
  fallbackImage,
  alt = '',
}) => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
    {/* Background Layer */}
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={fallbackImage}
        alt={alt}
        fill
        priority
        className="absolute inset-0 w-full h-full object-cover"
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
      <div className="absolute inset-0 bg-black/20" />
    </div>

    {/* Hero Content */}
    <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {/* Main Title */}
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 tracking-tight">
        Groupe Djamiyah
      </h1>

      {/* Hotels Subtitle */}
      <p className="text-lg sm:text-xl md:text-2xl text-white/95 font-medium mb-4">
        Hôtel Maison Blanche – Coyah & Hôtel Rama – Kissidougou
      </p>

      {/* Additional Line */}
      <p className="text-sm sm:text-base md:text-lg text-white/75 mb-8 max-w-2xl mx-auto">
        Deux destinations, un m&#234;me standard d&#39;excellence et d&#39;hospitalit&#233;.
      </p>

      {/* Tagline */}
      <p className="text-base sm:text-lg md:text-xl text-[#F9A03F] font-semibold italic mb-10">
        Plus qu&#39;un s&#233;jour, une exp&#233;rience.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <Link
          href="/reservation"
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#F9A03F] text-white font-semibold text-base transition-all duration-300 hover:bg-[#e08f2e] hover:scale-105 hover:shadow-lg shadow-[#F9A03F]/30"
        >
          Réserver à Coyah
        </Link>
        <Link
          href="/hotels"
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold text-base border-2 border-white/40 transition-all duration-300 hover:bg-white/20 hover:border-white/60 hover:scale-105"
        >
          Découvrir nos hôtels
        </Link>
      </div>
    </div>

    {/* Scroll Indicator */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
        <div className="w-1.5 h-3 bg-white/60 rounded-full" />
      </div>
    </div>
  </section>
)
