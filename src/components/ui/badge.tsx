import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-amber-100 text-amber-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        outline: 'border border-current bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

/** Payment status badges for reservations */
export function PaymentBadge({ status }: { status: 'pending' | 'paid' | 'failed' | 'refunded' }) {
  const map = {
    pending: { variant: 'warning', label: 'En attente' },
    paid: { variant: 'success', label: 'Payé' },
    failed: { variant: 'danger', label: 'Échoué' },
    refunded: { variant: 'info', label: 'Remboursé' },
  } as const

  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

/** Reservation status badges */
export function ReservationBadge({
  status,
}: {
  status: 'confirmed' | 'cancelled' | 'completed'
}) {
  const map = {
    confirmed: { variant: 'primary', label: 'Confirmée' },
    cancelled: { variant: 'danger', label: 'Annulée' },
    completed: { variant: 'success', label: 'Terminée' },
  } as const

  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
