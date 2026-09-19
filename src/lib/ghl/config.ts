// ============================================================
// Config GHL — synchronisation Groupes (STRICTEMENT SERVEUR).
// Ne jamais importer depuis des composants client.
// Identifiants validés fournis (base GHL La Maison Blanche).
// ============================================================

export const GHL_GROUP_CONFIG = {
  // Sous-compte
  locationId: 'a5wcdv6hapHNnLA9xnl4',

  // Custom Object « Dossier Groupe »
  dossierSchemaKey: 'custom_objects.dossier_groupe',
  dossierObjectId: '6aae365f3af3c470a99f2625',

  // Association Contact <-> Dossier
  contactAssociationId: '6aae464854eff21f459d195e',

  // Pipeline & étape
  pipelineId: 'QaX0Hz4lOLeXtwch4EDy',
  stageId: 'a836af56-72bc-4098-b068-30783a02682e',
} as const

export type GhlGroupConfig = typeof GHL_GROUP_CONFIG

/** Jeton canonique GHL (intégration privée) — Variable d'env, serveur uniquement. */
export function requireGhlIntegrationToken(): string {
  const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN
  if (!token || token.trim().length === 0) {
    throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN non défini.')
  }
  if (token !== token.trim()) {
    throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN contient des espaces en début ou fin.')
  }
  return token
}
