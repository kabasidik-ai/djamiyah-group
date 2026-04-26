'use client'

import { useState, useMemo, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { z } from 'zod'

const widgetVariants = cva('', {
  variants: {
    variant: {
      default: 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm',
      compact: 'rounded-xl border border-gray-100 bg-gray-50 p-4',
      minimal: 'rounded-lg bg-transparent p-0',
      card: 'rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6',
    },
    theme: {
      light: '',
      dark: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white',
    },
  },
  defaultVariants: {
    variant: 'default',
    theme: 'light',
  },
})

export type PaymentProvider = 'chapchap' | 'stripe' | 'paypal' | 'wave' | 'bank_transfer' | 'cash'

export interface PaymentWidgetProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof widgetVariants> {
  amount: number
  currency?: 'GNF' | 'USD' | 'EUR' | 'XOF'
  provider?: PaymentProvider
  showAmount?: boolean
  showCurrency?: boolean
  compact?: boolean
}

const providerConfig: Record<PaymentProvider, { name: string; icon: string; color: string }> = {
  chapchap: {
    name: 'Chap Chap Pay',
    icon: '',
    color: 'bg-orange-500',
  },
  stripe: {
    name: 'Stripe',
    icon: '',
    color: 'bg-indigo-500',
  },
  paypal: {
    name: 'PayPal',
    icon: '',
    color: 'bg-blue-500',
  },
  wave: {
    name: 'Wave',
    icon: '',
    color: 'bg-cyan-500',
  },
  bank_transfer: {
    name: 'Virement bancaire',
    icon: '',
    color: 'bg-gray-600',
  },
  cash: {
    name: 'Espèces',
    icon: '',
    color: 'bg-green-600',
  },
}

const currencySymbols: Record<string, string> = {
  GNF: 'GNF',
  USD: '$',
  EUR: '€',
  XOF: 'CFA',
}

export function PaymentWidget({
  amount,
  currency = 'GNF',
  provider = 'chapchap',
  showAmount = true,
  showCurrency = true,
  variant,
  theme,
  className,
  ...props
}: PaymentWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formattedAmount = useMemo(() => {
    const symbol = currencySymbols[currency] || currency
    if (currency === 'GNF' || currency === 'XOF') {
      return `${amount.toLocaleString('fr-FR')} ${symbol}`
    }
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }, [amount, currency])

  const providerInfo = providerConfig[provider]

  const handlePayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Simulate payment initiation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In production, this would redirect to the payment provider
      console.log(`Initiating ${provider} payment for ${formattedAmount}`)

      // Here you would typically:
      // 1. Call your API to create a payment session
      // 2. Redirect to the payment provider's checkout
      // 3. Handle the callback
    } catch (err) {
      setError('Le paiement a échoué. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn(widgetVariants({ variant, theme }), className)} {...props}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paiement sécurisé</h3>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium text-white',
            providerInfo.color
          )}
        >
          {providerInfo.name}
        </span>
      </div>

      {/* Amount Display */}
      {showAmount && (
        <div
          className={cn(
            'mb-6 rounded-xl p-4',
            variant === 'card' ? 'bg-white/70' : 'bg-gray-50 dark:bg-gray-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Montant total</span>
            <span className="text-2xl font-bold text-primary">{formattedAmount}</span>
          </div>
        </div>
      )}

      {/* Provider Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
          <span className="text-3xl">{providerInfo.icon}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || amount <= 0}
        className={cn(
          'w-full rounded-xl px-5 py-3.5 font-semibold transition-colors',
          'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
          variant === 'card' ? 'bg-primary' : 'bg-primary'
        )}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            Traitement en cours...
          </span>
        ) : (
          `Payer ${formattedAmount}`
        )}
      </button>

      {/* Security Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Paiement 100% sécurisé</span>
      </div>
    </div>
  )
}

// Variant: PaymentButton (minimal inline button)
export interface PaymentButtonProps extends HTMLAttributes<HTMLButtonElement> {
  provider?: PaymentProvider
  amount: number
  currency?: 'GNF' | 'USD' | 'EUR' | 'XOF'
}

export function PaymentButton({
  provider = 'chapchap',
  amount,
  currency = 'GNF',
  children,
  className,
  ...props
}: PaymentButtonProps) {
  const providerInfo = providerConfig[provider]
  const symbol = currencySymbols[currency] || currency

  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
        'bg-primary text-white hover:opacity-90',
        className
      )}
      {...props}
    >
      <span>{providerInfo.icon}</span>
      <span>{children || `Payer ${symbol}${amount}`}</span>
    </button>
  )
}
