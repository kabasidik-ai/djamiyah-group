'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  galleryImages as defaultImages,
  categoryLabels,
  hotelLabels,
  type GalleryImage,
} from '@/data/gallery'

// 1×1 transparent pixel for blur placeholder
const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPkEliSYQAAAABJRU5ErkJggg=='

type CategoryFilter = GalleryImage['category'] | 'all'
type HotelFilter = 'maison-blanche' | 'rama' | 'all'

interface GalleryProps {
  images?: GalleryImage[]
  defaultCategory?: string
  defaultHotel?: HotelFilter
}

// ── Category tabs ──────────────────────────────────────────────
const categories: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'chambres', label: categoryLabels.chambres },
  { key: 'restaurant', label: categoryLabels.restaurant },
  { key: 'exterieur', label: categoryLabels.exterieur },
  { key: 'conferences', label: categoryLabels.conferences },
]

const hotelOptions: { key: HotelFilter; label: string }[] = [
  { key: 'all', label: hotelLabels.all },
  { key: 'maison-blanche', label: hotelLabels['maison-blanche'] },
  { key: 'rama', label: hotelLabels.rama },
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
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95" onClick={onClose} aria-hidden="true" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Fermer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>

        {/* Prev */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Image precedente"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Next */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Image suivante"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Image */}
        <motion.div
          key={img.src}
          className="relative z-10 max-w-[90vw] max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            width={1200}
            height={900}
            className="object-contain max-h-[90vh] w-auto rounded-lg"
            sizes="90vw"
            priority
          />
          <p className="text-center text-white/70 text-sm mt-3 font-sans">
            {img.alt} — {index + 1}/{images.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Gallery Component ──────────────────────────────────────────
export default function Gallery({
  images = defaultImages,
  defaultCategory = 'all',
  defaultHotel = 'all',
}: GalleryProps) {
  const [category, setCategory] = useState<CategoryFilter>(defaultCategory as CategoryFilter)
  const [hotel, setHotel] = useState<HotelFilter>(defaultHotel)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = images.filter((img) => {
    const catMatch = category === 'all' || img.category === category
    const hotelMatch = hotel === 'all' || img.hotel === hotel || img.hotel === 'both'
    return catMatch && hotelMatch
  })

  // Lock body scroll when lightbox is open
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

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx)
  }

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + filtered.length) % filtered.length : null
    )
  }, [filtered.length])

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filtered.length : null))
  }, [filtered.length])

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-0.5 bg-[#F9A03F]" />
            <span className="text-xs tracking-[3px] uppercase text-[#F9A03F] font-semibold">
              Galerie
            </span>
            <div className="w-10 h-0.5 bg-[#F9A03F]" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#0D3B3E]">
            Nos espaces en images
          </h2>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                category === c.key
                  ? 'bg-[#0D3B3E] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label}
              {category === c.key && (
                <span className="block h-[2px] bg-[#F9A03F] mt-1 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Hotel toggle */}
        <div className="flex justify-center gap-2 mb-10">
          {hotelOptions.map((h) => (
            <button
              key={h.key}
              onClick={() => setHotel(h.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                hotel === h.key
                  ? 'border-[#0D3B3E] bg-[#0D3B3E]/5 text-[#0D3B3E]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((img, idx) => (
              <motion.div
                key={img.src}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(idx)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="absolute inset-0 bg-[#0D3B3E]/0 group-hover:bg-[#0D3B3E]/30 transition-colors duration-200" />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-sm font-sans">{img.alt}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 mt-12 font-sans">
            Aucune image pour cette selection.
          </p>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={filtered}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </section>
  )
}
