'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageSliderProps {
  images: string[]
  alt: string
  className?: string
}

export function ImageSlider({ images, alt, className = '' }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={`relative h-80 bg-gray-200 rounded-xl ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Aucune image disponible
        </div>
      </div>
    )
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '380px' }}>
      {/* Main Image */}
      <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`${alt} - ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs sm:text-sm rounded-full">
          {currentIndex + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails - Hidden on mobile, visible on tablet+ */}
      {images.length > 1 && (
        <div className="hidden sm:flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-amber-500 shadow-md'
                  : 'border-gray-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
