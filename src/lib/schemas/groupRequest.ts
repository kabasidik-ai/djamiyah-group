// ============================================================
// Schéma Zod & modèle typé — Demandes « Groupes & Séminaires »
// Hôtel Maison Blanche — Coyah (Groupe Djamiyah)
//
// Cette phase ne connecte PAS GHL : la demande est collectée et
// stockée (référence + clé d'idempotence) en attente de validation
// humaine. Aucune disponibilité ni tarif n'est certifié ici.
// ============================================================

import { z } from 'zod'

// ── Constantes métier ─────────────────────────────────────────

export const GROUP_REQUEST_SOURCES = ['site', 'djami'] as const

export const ESTABLISHMENTS = ['maison-blanche-coyah', 'rama-kissidougou'] as const

export const PREFERRED_CHANNELS = ['email', 'phone', 'whatsapp'] as const

/**
 * Types d'événements strictement professionnels. Volontairement
 * exclus : mariages, cérémonies familiales et appels d'offres
 * (un appel d'offres réel est qualifié manuellement par l'équipe).
 */
export const GROUP_EVENT_TYPES = [
  'seminar',
  'conference',
  'training',
  'meeting',
  'professional_group',
  'other',
] as const

/** Configurations de salle possibles. */
export const ROOM_CONFIGURATIONS = [
  'theatre',
  'classroom',
  'u_shape',
  'boardroom',
  'cabaret',
  'recommandee',
] as const

export const MEAL_TYPES = ['african', 'european', 'mixed', 'to_define'] as const

export const SERVICE_STYLES = ['buffet', 'table_service', 'to_define'] as const

// ── Helpers de validation ─────────────────────────────────────

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Utilisez le format AAAA-MM-JJ.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Date invalide.')

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide (format HH:MM).')

/** Champ date facultatif (chaîne vide autorisée). */
const optionalDate = dateOnlySchema.or(z.literal('')).optional()

const optionalTime = timeSchema.or(z.literal('')).optional()

const positiveInt = z.coerce.number().int('Nombre entier requis').nonnegative('Doit être ≥ 0')

// ── Sous-schémas ──────────────────────────────────────────────

const contactSchema = z.object({
  firstName: z.string().trim().min(2, 'Prénom trop court.').max(80),
  lastName: z.string().trim().min(2, 'Nom trop court.').max(80),
  jobTitle: z.string().trim().max(120).optional(),
  phone: z
    .string()
    .trim()
    .min(8, 'Téléphone trop court.')
    .max(30)
    .regex(/^[\d\s+()-]+$/, 'Numéro de téléphone invalide.'),
  email: z.string().trim().email('Adresse email invalide.').max(190),
  preferredChannel: z.enum(PREFERRED_CHANNELS),
})

const companySchema = z.object({
  name: z.string().trim().min(2, 'Nom de l’entreprise trop court.').max(160),
})

const eventSchema = z.object({
  type: z.enum(GROUP_EVENT_TYPES, { message: 'Type d’événement invalide.' }),
  name: z.string().trim().min(2, 'Nom de l’événement trop court.').max(200),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  flexibleDates: z.boolean(),
  desiredHours: z.string().trim().max(120).optional(),
  participants: z.coerce
    .number()
    .int('Nombre entier requis.')
    .positive('Doit être > 0')
    .max(10000, 'Maximum 10 000.'),
  requestedRoom: z.string().trim().min(1, 'Sélectionnez une salle ou « À recommander ».').max(160),
  configuration: z.enum(ROOM_CONFIGURATIONS, { message: 'Configuration invalide.' }),
})

const cateringSlotSchema = z.object({
  requested: z.boolean().default(false),
  time: optionalTime,
  covers: z.coerce.number().int().positive('Doit être > 0').optional(),
})

// Note : le modèle type chambres utilise des quantités par type réel.
const accommodationSchema = z.object({
  requested: z.boolean(),
  arrival: optionalDate,
  departure: optionalDate,
  roomQuantities: z
    .array(z.object({ type: z.string().min(1), count: positiveInt }))
    .optional()
    .default([]),
  hostedPeople: z.coerce.number().int().positive('Doit être > 0').optional(),
})

// ── Schéma principal ──────────────────────────────────────────

export const groupRequestSchema = z
  .object({
    source: z.enum(GROUP_REQUEST_SOURCES).default('site'),
    establishment: z.enum(ESTABLISHMENTS, { message: 'Établissement invalide.' }),
    contact: contactSchema,
    company: companySchema,
    event: eventSchema,
    accommodation: accommodationSchema,
    catering: z.object({
      morningBreak: cateringSlotSchema.optional().default({ requested: false }),
      lunch: cateringSlotSchema.optional().default({ requested: false }),
      afternoonBreak: cateringSlotSchema.optional().default({ requested: false }),
      mealType: z.enum(MEAL_TYPES).optional(),
      serviceStyle: z.enum(SERVICE_STYLES).optional(),
      dietaryConstraints: z.string().trim().max(1000).optional(),
    }),
    comments: z.string().trim().max(3000).optional(),
  })
  .superRefine((data, ctx) => {
    // Ordre des dates de l'événement
    if (data.event.endDate < data.event.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'La date de fin doit être postérieure ou égale à la date de début.',
        path: ['event', 'endDate'],
      })
    }

    // Hébergement : détails requis uniquement s'il est demandé
    if (data.accommodation.requested) {
      if (!data.accommodation.arrival) {
        ctx.addIssue({
          code: 'custom',
          message: 'Date d’arrivée requise lorsque l’hébergement est demandé.',
          path: ['accommodation', 'arrival'],
        })
      }
      if (!data.accommodation.departure) {
        ctx.addIssue({
          code: 'custom',
          message: 'Date de départ requise lorsque l’hébergement est demandé.',
          path: ['accommodation', 'departure'],
        })
      }
      if (
        data.accommodation.arrival &&
        data.accommodation.departure &&
        data.accommodation.departure <= data.accommodation.arrival
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'La date de départ doit être postérieure à la date d’arrivée.',
          path: ['accommodation', 'departure'],
        })
      }
    }

    // Hébergement : nombre de chambres + personnes hébergées
    if (data.accommodation.requested) {
      const totalRooms = (data.accommodation.roomQuantities ?? []).reduce(
        (sum, room) => sum + (room.count || 0),
        0
      )
      if (totalRooms < 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indiquez au moins une chambre lorsque l’hébergement est demandé.',
          path: ['accommodation', 'roomQuantities'],
        })
      }
      if (!data.accommodation.hostedPeople) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indiquez le nombre de personnes hébergées.',
          path: ['accommodation', 'hostedPeople'],
        })
      }
    }

    // Pauses : heure + couverts requis lorsqu'une pause est cochée
    const checkCatering = (
      slot: { requested: boolean; time?: string; covers?: number },
      name: 'morningBreak' | 'lunch' | 'afternoonBreak'
    ) => {
      if (slot.requested) {
        if (!slot.time) {
          ctx.addIssue({
            code: 'custom',
            message: 'Heure requise pour cette pause.',
            path: ['catering', name, 'time'],
          })
        }
        if (!slot.covers || slot.covers < 1) {
          ctx.addIssue({
            code: 'custom',
            message: 'Nombre de couverts requis pour cette pause.',
            path: ['catering', name, 'covers'],
          })
        }
      }
    }
    checkCatering(data.catering.morningBreak, 'morningBreak')
    checkCatering(data.catering.lunch, 'lunch')
    checkCatering(data.catering.afternoonBreak, 'afternoonBreak')
  })

// ── Types exportés ────────────────────────────────────────────

/** Payload envoyé par le formulaire (sans référence ni idempotence, générés serveur). */
export type GroupRequestInput = z.infer<typeof groupRequestSchema>

/**
 * Modèle complet d'une demande de groupe — conforme aux conventions
 * du projet : contient la référence de dossier et la clé d'idempotence.
 */
export type GroupRequest = GroupRequestInput & {
  id: string
  reference: string
  idempotencyKey: string
}

// ── Champs par étape (validation progressive du formulaire) ───
export const STEP_1_FIELDS: Array<keyof GroupRequestInput['contact']> = [
  'firstName',
  'lastName',
  'jobTitle',
  'phone',
  'email',
  'preferredChannel',
]
export const STEP_2_FIELDS: Array<keyof GroupRequestInput['event']> = [
  'type',
  'name',
  'startDate',
  'endDate',
  'flexibleDates',
  'desiredHours',
  'participants',
  'requestedRoom',
  'configuration',
]
