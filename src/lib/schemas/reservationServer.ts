import { z } from 'zod'
import { rooms, ramaRooms } from '@/data/content'
import { HOTELS } from './reservation'

/**
 * Schéma Zod v4 de validation SERVEUR pour les réservations de chambres.
 *
 * Différences avec le schéma client (reservation.ts) :
 * - Pas de validation "date >= aujourd'hui" (la RPC PostgreSQL s'en charge)
 * - totalPrice est explicitement ignoré (accepté mais non utilisé)
 * - phone peut être vide (certains parcours ne le requièrent pas)
 */

const hotelValues = HOTELS.map((h) => h.value) as [string, ...string[]]

/**
 * Chambres réservables par hôtel — dérivées de src/data/content.ts (source de vérité).
 * Les noms doivent correspondre exactement à rooms.name en base (RPC reserve_room).
 */
export const ROOMS_BY_HOTEL: Readonly<Record<string, readonly string[]>> = {
  'Hôtel Maison Blanche': rooms.map((room) => room.name),
  'Hôtel Rama': ramaRooms.map((room) => room.name),
}

const ALL_ROOM_NAMES: readonly string[] = Object.values(ROOMS_BY_HOTEL).flat()

export const reservationServerSchema = z
  .object({
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
    roomType: z.string('Type de chambre requis.').refine((val) => ALL_ROOM_NAMES.includes(val), {
      message: 'Type de chambre invalide.',
    }),
    hotelName: z.enum(hotelValues, "Nom d'hôtel invalide."),
    // Champs acceptés mais ignorés côté serveur
    specialRequests: z.string().max(500).optional(),
    paymentMethod: z.string().optional(),
    totalPrice: z.unknown().optional(), // Explicitement ignoré
  })
  .refine((data) => ROOMS_BY_HOTEL[data.hotelName]?.includes(data.roomType) ?? false, {
    message: "Cette chambre n'est pas proposée dans l'hôtel sélectionné.",
    path: ['roomType'],
  })

export type ReservationServerData = z.infer<typeof reservationServerSchema>
