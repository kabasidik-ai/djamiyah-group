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
    {/* ── Background Layer ── */}
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
      {/* Premium dark overlay - gradient from 60% to 85% */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/85" />
    </div>

    {/* ── Hero Content ── */}
    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
      {/* Main Title - Premium Impact */}
      <h1
        className="
          font-serif 
          text-5xl sm:text-6xl md:text-7xl lg:text-8xl 
          font-bold text-white 
          tracking-tight sm:tracking-normal
          leading-[1.05]
          mb-6
          text-shadow-[0_4px_20px_rgba(0,0,0,0.5)]
        "
      >
        Groupe Djamiyah
      </h1>

      {/* Hotels Subtitle */}
      <p
        className="
          text-lg sm:text-xl md:text-2xl lg:text-3xl 
          text-white/95 
          font-medium 
          tracking-wide
          mb-5
          text-shadow-[0_2px_12px_rgba(0,0,0,0.4)]
        "
      >
        Hôtel Maison Blanche – Coyah <span className="text-[#F9A03F]">&</span> Hôtel Rama –
        Kissidougou
      </p>

      {/* Decorative Divider */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/40" />
        <div className="w-2 h-2 rounded-full bg-[#F9A03F]" />
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/40" />
      </div>

      {/* Additional Line */}
      <p className="text-sm sm:text-base md:text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed text-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        {'Deux destinations, un même standard d\u0027excellence et d\u0027hospitalité.'}
      </p>

      {/* Tagline - Premium Accent */}
      <p
        className="
          text-xl sm:text-2xl md:text-3xl 
          text-[#F9A03F] 
          font-semibold 
          italic 
          mb-14
          tracking-wide
          text-shadow-[0_2px_16px_rgba(249,160,63,0.35)]
        "
      >
        {"Plus qu'un s\u00e9jour, une exp\u00e9rience."}
      </p>

      {/* CTA Buttons - Premium */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7">
        {/* Primary CTA */}
        <Link
          href="/reservation"
          className="
            group relative overflow-hidden
            w-full sm:w-auto
            inline-flex items-center justify-center
            px-10 py-4.5 lg:px-12 lg:py-5
            rounded-full
            bg-[#F9A03F] text-white
            font-bold text-base lg:text-lg
            shadow-[0_4px_24px_rgba(249,160,63,0.45)]
            transition-all duration-300 ease-out
            hover:bg-[#e8920f]
            hover:shadow-[0_8px_32px_rgba(249,160,63,0.6)]
            hover:scale-105
            active:scale-[1.02]
          "
        >
          <span className="relative z-10 flex items-center gap-3">
            Réserver à Coyah
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/hotels"
          className="
            group
            w-full sm:w-auto
            inline-flex items-center justify-center
            px-10 py-4.5 lg:px-12 lg:py-5
            rounded-full
            bg-white/10 backdrop-blur-md
            text-white
            font-semibold text-base lg:text-lg
            border-2 border-white/30
            transition-all duration-300 ease-out
            hover:bg-white/20 hover:border-white/50
            hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)]
            hover:scale-105
            active:scale-[1.02]
          "
        >
          <span className="flex items-center gap-3">
            Découvrir nos hôtels
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>

    {/* ── Scroll Indicator ── */}
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
      <div className="w-8 h-12 rounded-full border-2 border-white/30 bg-black/20 backdrop-blur-sm flex items-start justify-center p-2.5">
        <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
      </div>
    </div>
  </section>
)
