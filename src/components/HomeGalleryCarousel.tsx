'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'

type Item = { src: string; alt: string }

const AUTOPLAY_MS = 5000
const CARD_GAP = 16

export default function HomeGalleryCarousel({ items }: { items: Item[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(0)
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const touchStartX = useRef<number>(0)

  // Détection prefers-reduced-motion (dynamique)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Mesure la largeur d'une carte (responsive : change selon breakpoint via classes)
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current?.querySelector('[data-card]')
      if (el) setCardWidth((el as HTMLElement).getBoundingClientRect().width)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const total = items.length
  const maxIndex = total - 1

  useEffect(() => {
    if (!trackRef.current || cardWidth === 0) return
    trackRef.current.style.transform = `translateX(-${index * (cardWidth + CARD_GAP)}px)`
  }, [index, cardWidth])

  const prev = useCallback(() => setIndex((c) => (c <= 0 ? maxIndex : c - 1)), [maxIndex])
  const next = useCallback(() => setIndex((c) => (c >= maxIndex ? 0 : c + 1)), [maxIndex])

  // Autoplay lent (pause si hover/focus/reduced-motion)
  useEffect(() => {
    if (isPaused || reducedMotion || total <= 1) return
    const timer = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [isPaused, reducedMotion, next, total])

  // Swipe tactile mobile
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 48) {
      if (delta > 0) next()
      else prev()
    }
  }

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Galerie photos du Groupe Djamiyah"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={trackRef}
        className="flex overflow-hidden"
        style={{
          transform: `translateX(0px)`,
          transition: 'transform 700ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {items.map((g, i) => (
          <div
            key={g.src}
            data-card
            className="flex-none w-[68%] xs:w-[68%] sm:w-[52%] md:w-[40%] lg:w-[33%] xl:w-[25%] aspect-[4/3] rounded-xl overflow-hidden shadow-[0_6px_18px_rgba(17,24,39,0.08)] shrink-0"
            style={{ marginRight: i === items.length - 1 ? 0 : CARD_GAP }}
          >
            <Image
              src={g.src}
              alt={g.alt}
              fill
              sizes="(max-width: 640px) 68vw, (max-width: 1024px) 40vw, 25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Flèches discrètes */}
      <button
        type="button"
        onClick={prev}
        aria-label="Image précédente"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white/85 hover:bg-white text-[#0D3B3E] shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Image suivante"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white/85 hover:bg-white text-[#0D3B3E] shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ›
      </button>
    </div>
  )
}
