import { z } from 'zod'
import { ROOM_TYPES, HOTELS } from './reservation'

/**
 * Schéma Zod v4 de validation SERVEUR pour les réservations de chambres.
 *
 * Différences avec le schéma client (reservation.ts) :
 * - Pas de validation "date >= aujourd'hui" (la RPC PostgreSQL s'en charge)
 * - totalPrice est explicitement ignoré (accepté mais non utilisé)
 * - phone peut être vide (certains parcours ne le requièrent pas)
 */

const hotelValues = HOTELS.map((h) => h.value) as [string, ...string[]]

export const reservationServerSchema = z.object({
  firstName: z.string('Prénom requis.').min(2, 'Prénom trop court.').max(50, 'Prénom trop long.'),
  lastName: z.string('Nom requis.').min(2, 'Nom trop court.').max(50, 'Nom trop long.'),
  email: z.string('Email requis.').email('Email invalide.'),
  phone: z.string().max(30).default(''),
  checkIn: z
    .string("Date d'arrivée requise.")
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Format de date invalide (YYYY-MM-DD).'),
  checkOut: z
    .string('Date de départ requise.')
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Format de date invalide (YYYY-MM-DD).'),
  adults: z.coerce.number("Nombre d'adultes requis.").int().min(1, 'Au moins 1 adulte.').max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  roomType: z
    .string('Type de chambre requis.')
    .refine((val) => (ROOM_TYPES as readonly string[]).includes(val), {
      message: 'Type de chambre invalide.',
    }),
  hotelName: z.enum(hotelValues, "Nom d'hôtel invalide."),
  // Champs acceptés mais ignorés côté serveur
  specialRequests: z.string().max(500).optional(),
  paymentMethod: z.string().optional(),
  totalPrice: z.unknown().optional(), // Explicitement ignoré
})

export type ReservationServerData = z.infer<typeof reservationServerSchema>
