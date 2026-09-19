// ============================================================
// groupGhlSyncServer.ts — Assemblage SERVEUR de la synchro Groupe→GHL.
//
// Ne fait AUCUN appel GHL tant que GHL_GROUP_SYNC_ENABLED != 'true'
// (variable absente ou false pendant cette phase). Aucune écriture
// GHL réelle n'est déclenchée ici.
//
// Utilise uniquement le jeton canonique GHL_PRIVATE_INTEGRATION_TOKEN.
// ============================================================

import { createServiceRoleClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { GHL_GROUP_CONFIG } from '@/lib/ghl/config'
import { resolveAccessToken } from '@/lib/ghl/token-store'
import {
  claimAndSyncGroupRequest,
  GHL_SYNC_MAX_ATTEMPTS,
  buildContactSearchPayload,
  pickSingleContact,
  type GhlGroupConfig,
  type GhlTransport,
  type GroupGhlPersist,
  type GroupGhlDeps,
  type GroupGhlRow,
} from './groupGhlSync'

const BASE = 'https://services.leadconnectorhq.com'

const config: GhlGroupConfig = {
  locationId: GHL_GROUP_CONFIG.locationId,
  dossierSchemaKey: GHL_GROUP_CONFIG.dossierSchemaKey,
  contactAssociationId: GHL_GROUP_CONFIG.contactAssociationId,
  pipelineId: GHL_GROUP_CONFIG.pipelineId,
  stageId: GHL_GROUP_CONFIG.stageId,
}

// ── Persistance Supabase (service_role) ────────────────────────

const persist: GroupGhlPersist = {
  async claim(id) {
    const supabase = createServiceRoleClient()
    const { data: row, error: fetchError } = await supabase
      .from('group_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (fetchError || !row) return null
    if (row.ghl_sync_status === 'processing' || row.ghl_sync_status === 'synced') return null
    if (row.ghl_sync_attempts >= GHL_SYNC_MAX_ATTEMPTS) return null

    const nextAttempts = (row.ghl_sync_attempts ?? 0) + 1
    // CAS optimiste : passe à `processing` seulement si le statut
    // précédent est resté inchangé depuis la lecture (anti-course).
    const { data: claimed, error } = await supabase
      .from('group_requests')
      .update({ ghl_sync_status: 'processing', ghl_sync_attempts: nextAttempts })
      .eq('id', id)
      .eq('ghl_sync_status', row.ghl_sync_status)
      .select('*')
      .maybeSingle()

    if (error || !claimed) return null
    return {
      id: claimed.id,
      reference: claimed.reference,
      ghl_sync_status: claimed.ghl_sync_status as GroupGhlRow['ghl_sync_status'],
      ghl_sync_attempts: claimed.ghl_sync_attempts,
      ghl_contact_id: claimed.ghl_contact_id,
      ghl_dossier_id: claimed.ghl_dossier_id,
      ghl_opportunity_id: claimed.ghl_opportunity_id,
      contact: claimed.contact as GroupGhlRow['contact'],
      company: claimed.company as GroupGhlRow['company'],
      event: claimed.event as GroupGhlRow['event'],
    }
  },
  async patch(id, fields) {
    await createServiceRoleClient()
      .from('group_requests')
      .update(fields as unknown as Database['public']['Tables']['group_requests']['Update'])
      .eq('id', id)
  },
}

// ── Transport GHL (HTTP) — utilisé seulement si le flag est actif ──

async function ghlRaw<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await resolveAccessToken(config.locationId)
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: 'v3',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GHL ${init.method ?? 'GET'} ${path} -> ${res.status} ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

/**
 * Recherche avancée de contacts (contrat officiel POST /contacts/search, v3).
 * Strictement de lecture. Aucun contact créé/mis à jour.
 * Email normalisé en minuscules ; téléphone normalisé. Sélection déterministe.
 */
async function searchContactsByField(
  field: 'email' | 'phone',
  value: string
): Promise<{ id: string } | null> {
  const data = await ghlRaw<{ contacts?: Array<{ id: string }> }>('/contacts/search', {
    method: 'POST',
    body: buildContactSearchPayload(field, value, config.locationId),
  })
  return pickSingleContact(data?.contacts ?? [], value)
}

/**
 * Recherche d'enregistrements Custom Object (contrat officiel
 * POST /objects/{schemaKey}/records/search — lecture uniquement).
 */
async function searchDossierRecords(query: string): Promise<{ id: string } | null> {
  const res = await ghlRaw<{ records?: Array<{ id: string }> }>(
    `/objects/${config.dossierSchemaKey}/records/search`,
    {
      method: 'POST',
      body: {
        locationId: config.locationId,
        page: 1,
        pageLimit: 1,
        query,
        searchAfter: [],
      },
    }
  )
  return res.records?.[0] ?? null
}

const transport: GhlTransport = {
  async findContactByEmail(email) {
    return searchContactsByField('email', email)
  },
  async findContactByPhone(phone) {
    return searchContactsByField('phone', phone)
  },
  async createContact(payload) {
    const data = await ghlRaw<{ contact: { id: string } }>('/contacts/', {
      method: 'POST',
      body: payload,
    })
    return data.contact
  },
  async findDossier(filters) {
    const q = filters.identifiantSupabase || filters.referenceDossier || ''
    if (!q) return null
    return searchDossierRecords(q)
  },
  async createDossier(data) {
    const res = await ghlRaw<{ record: { id: string } }>(
      `/custom-objects/${config.dossierSchemaKey}/records`,
      { method: 'POST', body: data }
    )
    return res.record
  },
  async associateContactDossier(contactId, dossierId, associationId) {
    try {
      await ghlRaw<unknown>(
        `/custom-objects/${config.dossierSchemaKey}/records/${dossierId}/associations`,
        {
          method: 'POST',
          body: {
            associatedRecordId: dossierId,
            contactId,
            associationId,
            locationId: config.locationId,
          },
        }
      )
    } catch (err) {
      // Relation déjà existante : succès idempotent (aucun doublon).
      const msg = String(err instanceof Error ? err.message : err)
      if (/409|already exist|duplicate|exists/i.test(msg)) return
      throw err
    }
  },
  async findOpportunity(opts) {
    // Recherche officielle (GET /opportunities/search, camelCase, Version v3).
    const params = new URLSearchParams({
      locationId: config.locationId,
      pipelineId: opts.pipelineId,
      limit: '1',
    })
    const res = await ghlRaw<{ opportunities?: Array<{ id: string } & { contactId?: string }> }>(
      `/opportunities/search?${params.toString()}`
    )
    const list = res?.opportunities ?? []
    const matched = list.find((o) => o.contactId === opts.contactId) ?? list[0] ?? null
    return matched
  },
  async createOpportunity(payload) {
    const res = await ghlRaw<{ opportunity?: { id: string }; data?: { id: string } }>(
      '/opportunities/',
      { method: 'POST', body: payload }
    )
    const opp = res.opportunity ?? res.data
    if (!opp?.id) throw new Error('Création d’opportunité GHL : réponse sans id.')
    return opp
  },
}

const deps: GroupGhlDeps = { persist, transport, config }

export function isGroupGhlSyncEnabled(): boolean {
  return process.env.GHL_GROUP_SYNC_ENABLED === 'true'
}

export async function runGroupGhlSync(id: string) {
  return claimAndSyncGroupRequest(id, deps)
}
