import { z } from 'zod'

// ─── Webhook ChapChap ────────────────────────────────────────────────────────────

export const chapchapWebhookSchema = z.object({
  transaction_id: z.string().min(1),
  payment_reference: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default('GNF'),
  status: z.enum(['pending', 'success', 'failed', 'cancelled', 'expired']),
  payment_method: z
    .enum(['orange_money', 'mtn_momo', 'card', 'cash', 'wave', 'paycard', 'cc', 'bank_transfer'])
    .optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().nullable().optional(),
  customer_phone: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

// ─── Payment Request ─────────────────────────────────────────────────────────────

export const chapchapPaymentRequestSchema = z.object({
  amount: z.number().positive().min(100, 'Montant minimum 100 GNF'),
  currency: z.string().length(3).default('GNF'),
  customer_name: z.string().min(2).max(100),
  customer_email: z.string().email().nullable().optional(),
  customer_phone: z
    .string()
    .min(8)
    .regex(/^\+?[\d\s-()]+$/),
  description: z.string().max(500).optional(),
  order_id: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ─── Payment Status ──────────────────────────────────────────────────────────────

export const chapchapStatusSchema = z.object({
  transaction_id: z.string(),
  payment_reference: z.string(),
  status: z.enum(['pending', 'success', 'failed', 'cancelled', 'expired']),
  amount: z.number(),
  currency: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

// ─── Types inférés ──────────────────────────────────────────────────────────────

export type ChapchapWebhookData = z.infer<typeof chapchapWebhookSchema>
export type ChapchapPaymentRequest = z.infer<typeof chapchapPaymentRequestSchema>
export type ChapchapStatus = z.infer<typeof chapchapStatusSchema>

// ─── Helpers ────────────────────────────────────────────────────────────────────

export const CHAPCHAP_STATUS_LABELS: Record<ChapchapStatus['status'], string> = {
  pending: 'En attente de paiement',
  success: 'Paiement confirmé',
  failed: 'Paiement échoué',
  cancelled: 'Paiement annulé',
  expired: 'Paiement expiré',
}

export const CHAPCHAP_PAYMENT_METHODS = [
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_momo', label: 'MTN MoMo' },
  { value: 'wave', label: 'Wave' },
  { value: 'card', label: 'Carte bancaire (Visa/Mastercard)' },
  { value: 'paycard', label: 'PayCard' },
  { value: 'cc', label: 'Carte de crédit (CC)' },
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement Bancaire' },
] as const
