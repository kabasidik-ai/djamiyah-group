'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { galleryImages } from '@/data/gallery'

const AUTOPLAY_MS = 6000

export default function GalleryCarousel() {
  const total = galleryImages.length
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  // Initialisation lazy (client-only → 'use client' garanti)
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const touchStartX = useRef<number>(0)

  /* ── Détection prefers-reduced-motion (changements dynamiques) ── */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total])
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total])

  /* ── Autoplay (pause si hover/focus/reduced-motion) ── */
  useEffect(() => {
    if (isPaused || reducedMotion) return
    const timer = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [isPaused, reducedMotion, next])

  /* ── Navigation clavier ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  /* ── Swipe tactile ── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 48) delta > 0 ? next() : prev()
  }

  const img = galleryImages[current]

  return (
    <section
      className="py-12 lg:py-16 bg-[#FCFDFD]"
      aria-roledescription="carousel"
      aria-label="Galerie photos de l'hôtel"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── En-tête ── */}
        <div className="text-center mb-8 md:mb-10">
          <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-3">
            Groupe Djamiyah
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-[#0D3B3E] leading-tight mb-4">
            Découvrez Notre Hôtel en Images
          </h2>
          <p className="text-[#0D3B3E]/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Explorez nos chambres, notre restaurant, nos espaces extérieurs et nos salles de
            conférences
          </p>
        </div>

        {/* ── Carrousel ── */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* ── Images ── */}
          <div className="relative h-64 sm:h-96 lg:h-[500px]">
            {galleryImages.map((image, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                aria-hidden={idx !== current}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={idx === 0}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  className="object-cover"
                />
              </div>
            ))}

            {/* ── Overlay dégradé ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-20 pointer-events-none" />

            {/* ── Légende ── */}
            <div className="absolute bottom-14 left-4 right-16 z-30 sm:bottom-16 sm:left-6">
              <p className="text-white text-sm md:text-base font-medium drop-shadow-md line-clamp-1">
                {img.alt}
              </p>
            </div>

            {/* ── Flèche gauche ── */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/45 backdrop-blur-sm text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1"
              aria-label="Image précédente"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* ── Flèche droite ── */}
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/45 backdrop-blur-sm text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1"
              aria-label="Image suivante"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* ── Indicateurs (dots) + compteur ── */}
          <div className="flex items-center justify-center gap-2 py-3 bg-white px-4">
            {galleryImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === current ? 'w-6 h-2 bg-[#F9A03F]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Aller à l'image ${idx + 1}`}
              />
            ))}
            <span className="ml-3 text-xs text-gray-400 tabular-nums">
              {current + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Indicateur pause autoplay ── */}
        {reducedMotion && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Défilement automatique désactivé (préférences système)
          </p>
        )}
      </div>
    </section>
  )
}
