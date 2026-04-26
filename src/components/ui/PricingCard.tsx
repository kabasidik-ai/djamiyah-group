import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const pricingVariants = cva('rounded-2xl p-6 sm:p-8', {
  variants: {
    variant: {
      default: 'bg-white border border-gray-200',
      popular: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white relative',
      basic: 'bg-gray-50 border border-gray-100',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export interface PricingCardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof pricingVariants> {
  title: string
  price: string | number
  period?: string
  description?: string
  features?: string[]
  buttonText?: string
  isPopular?: boolean
  isLoading?: boolean
  badge?: string
}

export function PricingCard({
  title,
  price,
  period = 'month',
  description,
  features = [],
  buttonText = 'Get Started',
  isPopular = false,
  isLoading = false,
  badge,
  variant,
  size,
  className,
  ...props
}: PricingCardProps) {
  const formattedPrice = typeof price === 'number' ? `$${price}` : price

  return (
    <div
      role="article"
      aria-label={`Offre ${title}: ${formattedPrice} par ${period}`}
      className={cn(
        pricingVariants({ variant: isPopular ? 'popular' : variant, size }),
        'flex flex-col',
        className
      )}
      {...props}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span
            className="rounded-full bg-white px-4 py-1 text-sm font-semibold text-amber-600 shadow-sm"
            aria-label="Offre la plus populaire"
          >
            Most Popular
          </span>
        </div>
      )}

      {/* Custom Badge */}
      {badge && !isPopular && (
        <div className="mb-4">
          <span
            className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
            aria-label={`Badge: ${badge}`}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className={cn('font-bold text-gray-900', isPopular ? 'text-white' : '')}>{title}</h3>
        {description && (
          <p className={cn('mt-2 text-gray-600', isPopular ? 'text-amber-100' : '')}>
            {description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="mb-6" aria-label={`Prix: ${formattedPrice} par ${period}`}>
        <div className="flex items-baseline">
          <span
            className={cn(
              'font-bold tracking-tight',
              isPopular ? 'text-white' : 'text-gray-900',
              size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-2xl' : 'text-3xl'
            )}
            aria-hidden="true"
          >
            {formattedPrice}
          </span>
          <span
            className={cn('ml-1', isPopular ? 'text-amber-200' : 'text-gray-500')}
            aria-hidden="true"
          >
            /{period}
          </span>
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <ul className="mb-6 flex-1 space-y-3" role="list" aria-label="Fonctionnalités incluses">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start" role="listitem">
              <svg
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isPopular ? 'text-amber-200' : 'text-green-500'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className={cn(isPopular ? 'text-amber-50' : 'text-gray-600')}>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA Button */}
      <button
        disabled={isLoading}
        aria-disabled={isLoading}
        aria-busy={isLoading}
        className={cn(
          'w-full rounded-lg px-4 py-3 font-semibold transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isPopular
            ? 'bg-white text-amber-600 hover:bg-amber-50 focus:ring-amber-500'
            : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center" role="status">
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Chargement en cours...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  )
}
