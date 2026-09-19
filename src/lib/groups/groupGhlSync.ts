// ============================================================
// Cœur de synchronisation Groupe → GHL (testable, sans réseau).
//
// `claimAndSyncGroupRequest` orchestre la synchro avec uniquement
// des dépendances injectées (persistance + transport GHL + config).
// Aucun import d'environnement/Next : testable via node:test avec
// un transport mémoire. Aucune écriture GHL réelle ici.
// ============================================================

export const GHL_SYNC_MAX_ATTEMPTS = 3

export const GHL_SYNC_STATUSES = ['pending', 'processing', 'partial', 'synced', 'failed'] as const
export type GhlSyncStatus = (typeof GHL_SYNC_STATUSES)[number]

/** Ligne `group_requests` vue par la synchronisation (champs GHL). */
export type GroupGhlRow = {
  id: string
  reference: string
  ghl_sync_status: GhlSyncStatus
  ghl_sync_attempts: number
  ghl_contact_id: string | null
  ghl_dossier_id: string | null
  ghl_opportunity_id: string | null
  contact?: { firstName?: string; lastName?: string; email?: string; phone?: string } | null
  company?: { name?: string } | null
  event?: { name?: string } | null
}

/** Persistance (Supabase en prod, mémoire en test). */
export type GroupGhlPersist = {
  /** CAS atomique : passe à `processing` si éligible (pas synced/processing, < 3 tentatives). */
  claim(id: string): Promise<GroupGhlRow | null>
  patch(id: string, fields: Record<string, unknown>): Promise<void>
}

/** Transport GHL (HTTP en prod, mémoire en test). */
export type GhlTransport = {
  findContactByEmail(email: string, locationId: string): Promise<{ id: string } | null>
  findContactByPhone(phone: string, locationId: string): Promise<{ id: string } | null>
  createContact(payload: Record<string, unknown>, locationId: string): Promise<{ id: string }>
  findDossier(
    filters: { identifiantSupabase?: string; referenceDossier?: string },
    locationId: string
  ): Promise<{ id: string } | null>
  createDossier(data: Record<string, unknown>, locationId: string): Promise<{ id: string }>
  associateContactDossier(
    contactId: string,
    dossierId: string,
    associationId: string,
    locationId: string
  ): Promise<void>
  findOpportunity(
    opts: {
      contactId: string
      pipelineId: string
      stageId: string
      referenceDossier?: string
    },
    locationId: string
  ): Promise<{ id: string } | null>
  createOpportunity(payload: Record<string, unknown>, locationId: string): Promise<{ id: string }>
}

export type GhlGroupConfig = {
  locationId: string
  dossierSchemaKey: string
  contactAssociationId: string
  pipelineId: string
  stageId: string
}

export type GroupGhlDeps = {
  persist: GroupGhlPersist
  transport: GhlTransport
  config: GhlGroupConfig
  now?: () => string
  cleanError?: (err: unknown) => string
}

export type GhlSyncOutcome = { outcome: 'skipped' | 'synced' | 'partial' | 'failed' }

/**
 * Levé par le transport quand la relation (association) existe déjà côté GHL.
 * Traité par l'orchestrateur comme un succès idempotent (aucun doublon).
 */
export class GhlRelationExistsError extends Error {
  constructor(message = 'La relation Contact↔Dossier existe déjà côté GHL.') {
    super(message)
    this.name = 'GhlRelationExistsError'
  }
}

/** Levé quand plusieurs contacts correspondent à un même email/téléphone. */
export class MultipleContactsError extends Error {
  readonly criteria: string

  constructor(criteria: string) {
    super(`Plusieurs contacts correspondent à « ${criteria} ».`)
    this.name = 'MultipleContactsError'
    this.criteria = criteria
  }
}

/** Email normalisé : minuscules + espaces supprimés aux bornes. */
export function normalizeContactEmail(email?: string): string {
  return (email ?? '').trim().toLowerCase()
}

/** Téléphone normalisé au format de l'application (garde `+` et chiffres). */
export function normalizeContactPhone(phone?: string): string {
  return (phone ?? '').replace(/[^\d+]/g, '')
}

/** Payload de recherche contact (contrat v3) — champ email ou téléphone. */
export function buildContactSearchPayload(
  field: 'email' | 'phone',
  value: string,
  locationId: string,
  pageLimit = 1
): Record<string, unknown> {
  const safe = field === 'email' ? normalizeContactEmail(value) : normalizeContactPhone(value)
  const base: Record<string, unknown> = { locationId, pageLimit }
  if (safe) base.query = field === 'email' ? `email:${safe}` : `phone:${safe}`
  return base
}

/**
 * Sélection strictement déterministe : jamais de choix arbitraire.
 * 0 → null · 1 → l'unique · >1 → erreur contrôlée (pas de création).
 */
export function pickSingleContact(
  contacts: Array<{ id: string }>,
  criteria: string
): { id: string } | null {
  if (contacts.length > 1) throw new MultipleContactsError(criteria)
  return contacts[0] ?? null
}

// ── Constructeurs de payloads (source unique, testables sans envoi) ──

export function buildContactSearchKeys(row: GroupGhlRow): { email?: string; phone?: string } {
  return { email: row.contact?.email, phone: row.contact?.phone }
}

export function buildContactCreatePayload(
  row: GroupGhlRow,
  cfg: GhlGroupConfig
): Record<string, unknown> {
  return {
    firstName: row.contact?.firstName ?? '',
    lastName: row.contact?.lastName ?? '',
    email: row.contact?.email ?? '',
    phone: row.contact?.phone ?? '',
    locationId: cfg.locationId,
  }
}

export function buildDossierSearchFilters(row: GroupGhlRow): {
  identifiantSupabase: string
  referenceDossier: string
} {
  return { identifiantSupabase: row.id, referenceDossier: row.reference }
}

export function buildDossierDataPayload(
  row: GroupGhlRow,
  cfg: GhlGroupConfig
): Record<string, unknown> {
  return {
    schemaKey: cfg.dossierSchemaKey,
    locationId: cfg.locationId,
    data: {
      identifiant_supabase: row.id,
      reference_du_dossier: row.reference,
      entreprise: row.company?.name ?? '',
      evenement: row.event?.name ?? '',
    },
  }
}

export function buildRelationPayload(
  contactId: string,
  dossierId: string,
  associationId: string,
  cfg: GhlGroupConfig
): Record<string, unknown> {
  return { associatedRecordId: dossierId, contactId, associationId, locationId: cfg.locationId }
}

export function buildOpportunitySearchOpts(
  contactId: string,
  row: GroupGhlRow,
  cfg: GhlGroupConfig
): { contactId: string; pipelineId: string; stageId: string; referenceDossier?: string } {
  return {
    contactId,
    pipelineId: cfg.pipelineId,
    stageId: cfg.stageId,
    referenceDossier: row.reference,
  }
}

/** Le nom contient la référence du dossier → clé de recherche stable. */
export function buildOpportunityName(row: GroupGhlRow): string {
  return row.event?.name ? `${row.event.name} — ${row.reference}` : row.reference
}

export function buildOpportunityPayload(
  row: GroupGhlRow,
  contactId: string,
  cfg: GhlGroupConfig
): Record<string, unknown> {
  return {
    contactId,
    pipelineId: cfg.pipelineId,
    stageId: cfg.stageId,
    name: buildOpportunityName(row),
    locationId: cfg.locationId,
  }
}

/**
 * Orchestrateur idempotent. Respecte :
 *  - refus si déjà processing/synced (ou ≥3 tentatives) ;
 *  - recherche-avant-création (contact, dossier, opportunité) ;
 *  - enregistrement immédiat de chaque ID ;
 *  - `partial` si une étape échoue après une création, sinon `failed` ;
 *  - démarrage limité à 3 tentatives automatiques.
 */
export async function claimAndSyncGroupRequest(
  id: string,
  deps: GroupGhlDeps
): Promise<GhlSyncOutcome> {
  const row = await deps.persist.claim(id)
  if (!row) return { outcome: 'skipped' }

  const cfg = deps.config
  const now = deps.now ?? (() => new Date().toISOString())
  const clean =
    deps.cleanError ?? ((err: unknown) => String(err instanceof Error ? err.message : err))

  const created = { contact: false, dossier: false, opportunity: false }

  try {
    // ── 0. Contact ────────────────────────────────────────────────
    let contactId = row.ghl_contact_id
    if (!contactId) {
      const keys = buildContactSearchKeys(row)
      let found = keys.email
        ? await deps.transport.findContactByEmail(keys.email, cfg.locationId)
        : null
      if (!found && keys.phone)
        found = await deps.transport.findContactByPhone(keys.phone, cfg.locationId)
      if (!found) {
        const createdContact = await deps.transport.createContact(
          buildContactCreatePayload(row, cfg),
          cfg.locationId
        )
        found = createdContact
        created.contact = true
      }
      contactId = found.id
      await deps.persist.patch(id, { ghl_contact_id: contactId })
    }

    // ── 1. Dossier Groupe ─────────────────────────────────────────
    let dossierId = row.ghl_dossier_id
    if (!dossierId) {
      const foundDossier = await deps.transport.findDossier(
        buildDossierSearchFilters(row),
        cfg.locationId
      )
      let d = foundDossier
      if (!d) {
        d = await deps.transport.createDossier(buildDossierDataPayload(row, cfg), cfg.locationId)
        created.dossier = true
      }
      dossierId = d.id
      await deps.persist.patch(id, { ghl_dossier_id: dossierId })
    }

    // ── 2. Association Contact <-> Dossier ────────────────────────
    try {
      await deps.transport.associateContactDossier(
        contactId,
        dossierId,
        cfg.contactAssociationId,
        cfg.locationId
      )
    } catch (assocErr) {
      // La relation peut déjà exister (reprise partielle / doublon distant) :
      // on la traite comme un succès idempotent — jamais de doublon.
      if (assocErr instanceof GhlRelationExistsError) {
        // Relation déjà liée : succès idempotent, on continue (aucune création).
      } else {
        throw assocErr
      }
    }

    // ── 3. Opportunité ────────────────────────────────────────────
    let opportunityId = row.ghl_opportunity_id
    if (!opportunityId) {
      const foundOpp = await deps.transport.findOpportunity(
        buildOpportunitySearchOpts(contactId, row, cfg),
        cfg.locationId
      )
      let o = foundOpp
      if (!o) {
        o = await deps.transport.createOpportunity(
          buildOpportunityPayload(row, contactId, cfg),
          cfg.locationId
        )
        created.opportunity = true
      }
      opportunityId = o.id
      await deps.persist.patch(id, { ghl_opportunity_id: opportunityId })
    }

    await deps.persist.patch(id, {
      ghl_sync_status: 'synced',
      ghl_last_error: null,
      ghl_last_synced_at: now(),
    })
    return { outcome: 'synced' }
  } catch (err) {
    const anyCreated = created.contact || created.dossier || created.opportunity
    const status: GhlSyncStatus = anyCreated ? 'partial' : 'failed'
    await deps.persist.patch(id, {
      ghl_sync_status: status,
      ghl_last_error: clean(err).slice(0, 1000),
      ghl_last_synced_at: null,
    })
    return { outcome: status }
  }
}
