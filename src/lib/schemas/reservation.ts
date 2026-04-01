import { z } from 'zod'

// ─── Réservation ────────────────────────────────────────────────────────────────

export const reservationSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court').max(50),
  lastName: z.string().min(2, 'Nom trop court').max(50),
  email: z.string().email('Email invalide'),
  phone: z
    .string()
    .min(8, 'Téléphone trop court')
    .regex(/^[\d\s+()-]+$/, 'Numéro de téléphone invalide'),
  checkIn: z.string().refine((date) => {
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }, "La date d'arrivee doit etre aujourd'hui ou plus tard"),
  checkOut: z.string().refine((date) => {
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }, 'La date de départ doit être dans le futur'),
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10),
  roomType: z.string().min(1, 'Sélectionnez une chambre'),
  specialRequests: z.string().max(500).optional(),
  hotelName: z.enum(['Hôtel Maison Blanche', 'Hôtel Rama']),
  paymentMethod: z.enum(['chapchap', 'hotel']),
})

// ─── Validation dates ────────────────────────────────────────────────────────────

reservationSchema.refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: "La date de départ doit être après la date d'arrivée",
  path: ['checkOut'],
})

// ─── Types inférés ──────────────────────────────────────────────────────────────

export type ReservationFormData = z.infer<typeof reservationSchema>

// ─── Helpers ────────────────────────────────────────────────────────────────────

export const ROOM_TYPES = [
  'Chambre Standard',
  'Chambre Confort',
  'Chambre Premium',
  'Double Premium',
  'Suite Junior',
  'Suite Premium',
  'Suite Exécutive',
  'Suite Prestige',
] as const

export const PAYMENT_METHODS = [
  { value: 'chapchap', label: 'Chap Chap Pay (paiement immédiat)' },
  { value: 'hotel', label: "Paiement à l'hôtel" },
] as const

export const HOTELS = [
  { value: 'Hôtel Maison Blanche', label: 'Hôtel Maison Blanche - Coyah' },
  { value: 'Hôtel Rama', label: 'Hôtel Rama - Kissidougou' },
] as const
