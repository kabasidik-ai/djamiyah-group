// ============================================================
// Tarification des salles de conférence selon la durée.
// Source UNIQUE du calcul tarifaire (utilisée par le serveur).
// Le montant est TOUJOURS calculé côté serveur — jamais confiance
// au navigateur.
// ============================================================

export type ConferenceDuration = 'half_day' | 'full_day'

export const CONFERENCE_DURATIONS: readonly ConferenceDuration[] = ['half_day', 'full_day']

export class ConferencePricingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConferencePricingError'
  }
}

/**
 * Prix unitaire d'une salle pour la durée choisie.
 * - full_day → price_per_day
 * - half_day → price_half_day (doit exister, sinon erreur : salle sans demi-journée)
 * @throws ConferencePricingError si la durée n'est pas disponible pour la salle.
 */
export function computeConferenceUnitPrice(
  pricePerDay: number,
  priceHalfDay: number | null | undefined,
  duration: ConferenceDuration
): number {
  if (typeof pricePerDay !== 'number' || pricePerDay < 0) {
    throw new ConferencePricingError('Tarif salle invalide.')
  }

  if (duration === 'half_day') {
    if (typeof priceHalfDay !== 'number' || priceHalfDay < 0) {
      throw new ConferencePricingError('Cette salle ne propose pas de location à la demi-journée.')
    }
    return priceHalfDay
  }

  // full_day (défaut)
  return pricePerDay
}
