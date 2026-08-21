import { z } from 'zod'

export const ACTIVE_CONFERENCE_RESERVATION_STATUSES = [
  'pending',
  'awaiting_confirmation',
  'confirmed',
] as const

export const CONFERENCE_EVENT_TYPES = [
  'seminar',
  'conference',
  'training',
  'meeting',
  'other',
] as const

const eventDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit être au format AAAA-MM-JJ')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Date invalide')

export const conferenceAvailabilitySchema = z.object({
  conferenceRoomId: z.string().uuid('Salle invalide'),
  eventDate: eventDateSchema,
  participants: z.coerce.number().int().positive().max(10_000).optional(),
})

export const conferenceReservationSchema = conferenceAvailabilitySchema.extend({
  firstName: z.string().trim().min(2, 'Prénom trop court').max(80),
  lastName: z.string().trim().min(2, 'Nom trop court').max(80),
  email: z.string().trim().email('Adresse email invalide').max(190),
  phone: z
    .string()
    .trim()
    .min(8, 'Téléphone trop court')
    .max(30)
    .regex(/^[\d\s+()-]+$/, 'Numéro de téléphone invalide'),
  participants: z.coerce.number().int().positive().max(10_000),
  eventType: z.enum(CONFERENCE_EVENT_TYPES),
  specialRequests: z.string().trim().max(1_000).optional().default(''),
})

export function isDateTodayOrLater(value: string, now = new Date()): boolean {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const eventDate = new Date(`${value}T00:00:00Z`)

  return !Number.isNaN(eventDate.getTime()) && eventDate >= today
}

export type ConferenceAvailabilityInput = z.infer<typeof conferenceAvailabilitySchema>
export type ConferenceReservationInput = z.infer<typeof conferenceReservationSchema>
