/**
 * Utilitaires pour le mapping des chambres
 * Source de vérité : src/data/content.ts
 */

import type { Database } from '@/types/database'

type RoomTypeEnum = Database['public']['Enums']['room_type_enum']

/**
 * Mapping nom de chambre → type enum Supabase
 * ATTENTION: Les noms doivent correspondre exactement à ceux de src/data/content.ts
 */
export const ROOM_NAME_TO_TYPE: Record<string, RoomTypeEnum> = {
  'Chambre Confort': 'premium',
  'Chambre Premium': 'premium',
  'Double Premium': 'premium',
  'Suite Premium': 'suite',
  'Suite Prestige': 'suite',
} as const

/**
 * Mapping slug → nom de chambre
 * Pour correspondance avec src/data/content.ts
 */
export const ROOM_SLUG_TO_NAME: Record<string, string> = {
  'chambre-confort': 'Chambre Confort',
  'chambre-premium': 'Chambre Premium',
  'double-premium': 'Double Premium',
  'suite-premium': 'Suite Premium',
  'suite-prestige': 'Suite Prestige',
} as const

/**
 * Mapping inverse : type enum → liste des noms de chambres
 */
export const ROOM_TYPE_TO_NAMES: Record<RoomTypeEnum, string[]> = {
  standard: [], // Aucune chambre standard actuellement
  premium: ['Chambre Confort', 'Chambre Premium', 'Double Premium'],
  suite: ['Suite Premium', 'Suite Prestige'],
} as const

/**
 * Obtenir le type enum Supabase à partir du nom de la chambre
 * @param roomName - Nom de la chambre (ex: "Chambre Confort")
 * @returns Type enum ou null si non trouvé
 */
export function getRoomTypeFromName(roomName: string): RoomTypeEnum | null {
  return ROOM_NAME_TO_TYPE[roomName] ?? null
}

/**
 * Obtenir le nom de la chambre à partir du slug
 * @param slug - Slug de la chambre (ex: "chambre-confort")
 * @returns Nom de la chambre ou null si non trouvé
 */
export function getRoomNameFromSlug(slug: string): string | null {
  return ROOM_SLUG_TO_NAME[slug] ?? null
}

/**
 * Vérifier si un nom de chambre est valide
 * @param roomName - Nom à vérifier
 * @returns true si le nom existe dans le mapping
 */
export function isValidRoomName(roomName: string): boolean {
  return roomName in ROOM_NAME_TO_TYPE
}

/**
 * Obtenir toutes les chambres d'un type donné
 * @param roomType - Type enum ('standard' | 'premium' | 'suite')
 * @returns Liste des noms de chambres de ce type
 */
export function getRoomNamesByType(roomType: RoomTypeEnum): string[] {
  return ROOM_TYPE_TO_NAMES[roomType] ?? []
}
