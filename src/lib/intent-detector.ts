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
  const conferenceKeywords = [
    'conférence',
    'séminaire',
    'formation',
    'réunion professionnelle',
    'wonkifon',
    'somayah',
    'maneah',
    'soumbouyah',
    'salle de conférence',
    'espace événementiel',
    'corporate',
    'entreprise',
    'team building',
  ]
  if (conferenceKeywords.some((k) => msg.includes(k))) return 'CONFERENCE'

  // ── RESTAURANT ────────────────────────────────────────────
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
  ]
  if (restaurantKeywords.some((k) => msg.includes(k))) return 'RESTAURANT'

  // ── CHAMBRE — uniquement si pas de mot salle/conférence ───
  const roomKeywords = [
    'chambre',
    'hébergement',
    'réserver',
    'disponibilité',
    'confort',
    'premium',
    'suite',
    'tarif nuit',
    'séjour',
    'hôtel',
    'dormir',
  ]
  if (roomKeywords.some((k) => msg.includes(k))) return 'ROOM'

  return 'GENERAL'
}

export function prependIntentHint(message: string, intent: DetectedIntent): string {
  return `[INTENTION: ${intent}] ${message}`
}
