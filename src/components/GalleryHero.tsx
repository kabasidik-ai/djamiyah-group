'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { galleryImages as defaultImages, categoryLabels, type GalleryImage } from '@/data/gallery'

// ── Types ──────────────────────────────────────────────────────
type CategoryFilter = GalleryImage['category'] | 'all'

interface GalleryHeroProps {
  images?: GalleryImage[]
  defaultCategory?: CategoryFilter
  autoplayMs?: number
}

const HOTEL_DISPLAY: Record<string, string> = {
  'maison-blanche': 'Hotel Maison Blanche · Coyah',
  rama: 'Hotel Rama · Kissidougou',
  both: 'Groupe Djamiyah',
}

const FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'chambres', label: categoryLabels.chambres },
  { key: 'restaurant', label: categoryLabels.restaurant },
  { key: 'exterieur', label: categoryLabels.exterieur },
  { key: 'conferences', label: categoryLabels.conferences },
]

// ── Lightbox ───────────────────────────────────────────────────
function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const img = images[index]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-black/95" onClick={onClose} aria-hidden="true" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Fermer"
        >
          <X size={24} color="white" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#F9A03F] hover:scale-110 transition-all duration-200"
          aria-label="Image precedente"
        >
          <ChevronLeft size={20} color="white" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#F9A03F] hover:scale-110 transition-all duration-200"
          aria-label="Image suivante"
        >
          <ChevronRight size={20} color="white" />
        </button>

        <motion.div
          key={img.src}
          className="relative z-10 max-w-[90vw] max-h-[90vh]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            width={1400}
            height={1050}
            className="object-contain max-h-[90vh] w-auto rounded-lg"
            sizes="90vw"
            priority
          />
          <p className="text-center text-white/60 text-sm mt-3 font-sans">
            {img.alt} — {index + 1}/{images.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── GalleryHero ────────────────────────────────────────────────
export default function GalleryHero({
  images = defaultImages,
  defaultCategory = 'all',
  autoplayMs = 7500,
}: GalleryHeroProps) {
  const [category, setCategory] = useState<CategoryFilter>(defaultCategory)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [progressKey, setProgressKey] = useState(0)

  // ── Filtered images ──
  const filtered = images.filter((img) => category === 'all' || img.category === category)

  // ── Reduced motion (subscribe to external system) ──
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setPrefersReducedMotion(mq.matches)
    handler() // Sync initial value within subscription callback
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Category change handler ──
  const handleCategoryChange = useCallback((newCategory: CategoryFilter) => {
    setCategory(newCategory)
    setCurrentIndex(0)
    setProgressKey((k) => k + 1)
  }, [])

  // ── Autoplay ──
  useEffect(() => {
    if (prefersReducedMotion || isPaused || filtered.length <= 1 || lightboxIndex !== null) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filtered.length)
      setProgressKey((k) => k + 1)
    }, autoplayMs)
    return () => clearInterval(timer)
  }, [autoplayMs, isPaused, filtered.length, prefersReducedMotion, lightboxIndex])

  // ── Preload next image ──
  useEffect(() => {
    if (filtered.length <= 1) return
    const nextIdx = (currentIndex + 1) % filtered.length
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = filtered[nextIdx].src
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [currentIndex, filtered])

  // ── Body scroll lock for lightbox ──
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightboxIndex])

  // ── Navigation ──
  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setProgressKey((k) => k + 1)
  }, [])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
    setProgressKey((k) => k + 1)
  }, [filtered.length])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filtered.length)
    setProgressKey((k) => k + 1)
  }, [filtered.length])

  const handleMouseEnter = () => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    resumeTimeout.current = setTimeout(() => setIsPaused(false), 2000)
  }

  // ── Lightbox handlers ──
  const openLightbox = () => setLightboxIndex(currentIndex)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const lbPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + filtered.length) % filtered.length : null
    )
  }, [filtered.length])
  const lbNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filtered.length : null))
  }, [filtered.length])

  const activeImage = filtered[currentIndex]
  if (!activeImage) return null

  const kenBurnsAnimate = prefersReducedMotion ? {} : { scale: 1.04 }

  const kenBurnsTransition = prefersReducedMotion
    ? undefined
    : { duration: 12, ease: 'linear' as const }

  return (
    <>
      <section className="relative w-full my-16 md:my-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* ── Filter bar ── */}
          <div className="relative z-20 flex items-center justify-center gap-0 py-4 mb-8 md:mb-10">
            {FILTERS.map((f, idx) => (
              <button
                key={f.key}
                onClick={() => handleCategoryChange(f.key)}
                className={`relative px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
                  category === f.key
                    ? 'text-[#F9A03F]'
                    : 'text-[#0D3B3E]/50 hover:text-[#0D3B3E]/80'
                }`}
              >
                {f.label}
                {category === f.key && (
                  <motion.span
                    layoutId="gallery-filter-underline"
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#F9A03F]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {idx < FILTERS.length - 1 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2 bg-[#0D3B3E]/20" />
                )}
              </button>
            ))}
          </div>

          {/* ── Carousel viewport ── */}
          <div
            className="relative h-[45vh] md:h-[55vh] max-h-[600px] w-full overflow-hidden rounded-2xl shadow-2xl shadow-[#0D3B3E]/20 cursor-pointer group/carousel"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={openLightbox}
            role="region"
            aria-roledescription="carousel"
            aria-label="Galerie photo"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage.src}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1 }}
                  animate={kenBurnsAnimate}
                  transition={kenBurnsTransition}
                >
                  <Image
                    src={activeImage.src}
                    alt={activeImage.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={currentIndex === 0}
                    loading={currentIndex === 0 ? 'eager' : 'lazy'}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* ── Caption overlay ── */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-12 pointer-events-none">
              <div className="max-w-4xl mx-auto" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage.src + '-caption'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    <span className="block font-sans text-xs uppercase tracking-[0.2em] text-[#F9A03F] mb-2">
                      {categoryLabels[activeImage.category]}
                    </span>
                    <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
                      {activeImage.alt}
                    </h3>
                    <p className="font-sans text-sm text-white/80 mt-1">
                      {HOTEL_DISPLAY[activeImage.hotel] ?? 'Groupe Djamiyah'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ── Nav arrows ── */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(13,59,62,0.4)] backdrop-blur-sm opacity-60 group-hover/carousel:opacity-100 hover:bg-[#F9A03F] hover:scale-110 transition-all duration-300"
              aria-label="Image precedente"
            >
              <ChevronLeft size={20} color="white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(13,59,62,0.4)] backdrop-blur-sm opacity-60 group-hover/carousel:opacity-100 hover:bg-[#F9A03F] hover:scale-110 transition-all duration-300"
              aria-label="Image suivante"
            >
              <ChevronRight size={20} color="white" />
            </button>
          </div>

          {/* ── Progress indicators ── */}
          <div className="relative z-20 flex items-center justify-center gap-2 pt-6 pb-2">
            {filtered.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`relative h-1 w-10 rounded-full overflow-hidden bg-[#0D3B3E]/20 ${idx === currentIndex ? 'shadow-sm shadow-[#F9A03F]/50' : ''}`}
                aria-label={`Aller a l'image ${idx + 1}`}
              >
                {idx === currentIndex && !prefersReducedMotion && (
                  <motion.span
                    key={progressKey}
                    className="absolute inset-y-0 left-0 bg-[#F9A03F] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: isPaused ? 99999 : autoplayMs / 1000,
                      ease: 'linear',
                    }}
                  />
                )}
                {idx === currentIndex && prefersReducedMotion && (
                  <span className="absolute inset-0 bg-[#F9A03F] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={filtered}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={lbPrev}
          onNext={lbNext}
        />
      )}
    </>
  )
}
