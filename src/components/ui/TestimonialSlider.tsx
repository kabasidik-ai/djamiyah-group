import { useState, useEffect, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sliderVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-white',
      dark: 'bg-gray-900 text-white',
      gradient: 'bg-gradient-to-r from-amber-50 to-orange-50',
    },
    size: {
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export interface Testimonial {
  id: string
  name: string
  role: string
  company?: string
  avatar?: string
  content: string
  rating?: number
  date?: string
}

export interface TestimonialSliderProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof sliderVariants> {
  testimonials: Testimonial[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showNavigation?: boolean
  showPagination?: boolean
  showRating?: boolean
}

export function TestimonialSlider({
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  showNavigation = true,
  showPagination = true,
  showRating = true,
  variant,
  size,
  className,
  ...props
}: TestimonialSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!autoPlay || isPaused || testimonials.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, isPaused, testimonials.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (testimonials.length === 0) {
    return null
  }

  const current = testimonials[currentIndex]

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Témoignages clients"
      className={cn(sliderVariants({ variant, size }), 'relative overflow-hidden', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...props}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Live region for screen readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Témoignage {currentIndex + 1} sur {testimonials.length}: {current.name}, {current.role}
        </div>

        {/* Quote Icon */}
        <div className="mb-6 flex justify-center">
          <svg
            className="h-12 w-12 text-amber-400"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* Testimonial Content */}
        <div className="relative">
          <div className="text-center">
            {showRating && current.rating && (
              <div
                className="mb-4 flex justify-center"
                role="img"
                aria-label={`Note de ${current.rating} sur 5 étoiles`}
              >
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < current.rating! ? 'text-amber-400' : 'text-gray-300'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}

            <blockquote className="text-lg font-medium leading-relaxed text-gray-900 sm:text-xl sm:leading-relaxed">
              &ldquo;{current.content}&rdquo;
            </blockquote>

            {current.date && <p className="mt-4 text-sm text-gray-500">{current.date}</p>}
          </div>

          {/* Author Info */}
          <div className="mt-8 flex items-center justify-center">
            <div className="flex-shrink-0">
              {current.avatar ? (
                <img
                  className="h-14 w-14 rounded-full object-cover"
                  src={current.avatar}
                  alt={current.name}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  <span className="text-lg font-semibold text-amber-600">
                    {current.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4 text-center sm:text-left">
              <div className="text-base font-semibold text-gray-900">{current.name}</div>
              <div className="text-sm text-gray-500">
                {current.role}
                {current.company && ` at ${current.company}`}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {showNavigation && testimonials.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Témoignage précédent"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Témoignage suivant"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {showPagination && testimonials.length > 1 && (
          <div
            className="mt-8 flex justify-center space-x-2"
            role="tablist"
            aria-label="Navigation des témoignages"
          >
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                role="tab"
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                )}
                aria-selected={index === currentIndex}
                aria-label={`Témoignage ${index + 1} sur ${testimonials.length}`}
                tabIndex={index === currentIndex ? 0 : -1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
