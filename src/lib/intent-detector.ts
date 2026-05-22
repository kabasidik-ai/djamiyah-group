/**
 * intent-detector.ts
 *
 * Analyse le message utilisateur et retourne une intention sémantique.
 * Utilisé côté API pour préfixer le payload envoyé à GHL avec un hint de routage,
 * afin de guider le Conversation AI Agent vers la bonne branche de réponse.
 *
 * Le préfixe doit être injecté UNIQUEMENT dans le message transmis à GHL —
 * jamais affiché dans l'interface utilisateur.
 */

export type DetectedIntent = 'ROOM' | 'CONFERENCE' | 'RESTAURANT' | 'GENERAL'

export function detectIntent(message: string): DetectedIntent {
  const msg = message.toLowerCase().trim()

  // ── CONFÉRENCE — prioritaire (mots-clés exclusifs) ────────
  // Aligné sur FLUX 2 du prompt GHL : corporate uniquement
  const conferenceKeywords = [
    'conférence',
    'séminaire',
    'formation',
    'réunion professionnelle',
    "réunion d'entreprise",
    'réunion de travail',
    'wonkifon',
    'somayah',
    'maneah',
    'soumbouyah',
    'salle de conférence',
    'salle événementielle',
    'espace événementiel',
    'corporate',
    'entreprise',
    'team building',
    'workshop',
    'atelier professionnel',
  ]
  if (conferenceKeywords.some((k) => msg.includes(k))) return 'CONFERENCE'

  // ── RESTAURANT — aligné sur FLUX 3 du prompt GHL ─────────
  const restaurantKeywords = [
    'menu',
    'carte',
    'restaurant',
    'déjeuner',
    'dîner',
    'petit-déjeuner',
    'manger',
    'plat',
    'gastronomique',
    'horaires repas',
    'horaire restaurant',
    'petit déjeuner',
  ]
  if (restaurantKeywords.some((k) => msg.includes(k))) return 'RESTAURANT'

  // ── CHAMBRE — uniquement indicateurs non-ambigus ──────────
  // NB: "réserver" seul est exclu car ambigu (chambre vs salle)
  // Le GHL ANTI-CONFUSION rule gère les cas ambigus via clarification
  const roomKeywords = [
    'chambre',
    'hébergement',
    'disponibilité chambre',
    'confort',
    'suite prestige',
    'suite premium',
    'tarif nuit',
    'tarif chambre',
    "nuit d'hôtel",
    'nuitée',
    'séjour',
    'dormir',
    'check-in',
    'check-out',
    'arrivée',
  ]
  if (roomKeywords.some((k) => msg.includes(k))) return 'ROOM'

  return 'GENERAL'
}

/**
 * Ajoute un mot-clé de contexte au début du message.
 * Approche légère qui guide GHL sans surcharger le message.
 */
export function prependIntentHint(message: string, intent: DetectedIntent): string {
  switch (intent) {
    case 'CONFERENCE':
      return `[Salle conférence] ${message}`
    case 'ROOM':
      return `[Chambre hôtel] ${message}`
    case 'RESTAURANT':
      return `[Restaurant] ${message}`
    case 'GENERAL':
    default:
      return message
  }
}
