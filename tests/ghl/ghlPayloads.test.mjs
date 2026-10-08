// ============================================================
// Validation des payloads GHL (sans aucun envoi réseau).
// Vérifie les constructeurs exportés de l'adaptateur Groupe.
// ============================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildContactSearchKeys,
  buildContactCreatePayload,
  buildDossierSearchFilters,
  buildDossierDataPayload,
  buildRelationPayload,
  buildOpportunitySearchOpts,
  buildOpportunityName,
  buildOpportunityPayload,
} from '../../src/lib/groups/groupGhlSync.ts'

const cfg = {
  locationId: 'a5wcdv6hapHNnLA9xnl4',
  dossierSchemaKey: 'custom_objects.dossier_groupe',
  contactAssociationId: '6aae464854eff21f459d195e',
  pipelineId: 'QaX0Hz4lOLeXtwch4EDy',
  stageId: 'a836af56-72bc-4098-b068-30783a02682e',
}

const row = {
  id: 'supabase-row-123',
  reference: 'GRP-260919-AB12',
  ghl_sync_status: 'pending',
  ghl_sync_attempts: 0,
  ghl_contact_id: null,
  ghl_dossier_id: null,
  ghl_opportunity_id: null,
  contact: { firstName: 'Awa', lastName: 'Diallo', email: 'awa@exemple.com', phone: '+224611223344' },
  company: { name: 'Groupe Horizon' },
  event: { name: 'Séminaire annuel' },
}

// Codes HTTP de réussite attendus (documentés ; réellement dépendants de l'API).
const EXPECTED = {
  HTTP_OK: 200,
  HTTP_CREATED: 201,
  VERSION: '2021-07-28', // endpoints Contacts / Custom Objects / Opportunités
}

test('payload recherche / création contact : noms exacts + locationId', () => {
  const keys = buildContactSearchKeys(row)
  assert.equal(keys.email, row.contact.email)
  assert.equal(keys.phone, row.contact.phone)

  const payload = buildContactCreatePayload(row, cfg)
  assert.equal(payload.firstName, 'Awa')
  assert.equal(payload.lastName, 'Diallo')
  assert.equal(payload.email, 'awa@exemple.com')
  assert.equal(payload.phone, '+224611223344')
  assert.equal(payload.locationId, cfg.locationId)
})

test('payload dossier : schemaKey, objectKey et champs personnalisés stables', () => {
  const filters = buildDossierSearchFilters(row)
  assert.equal(filters.identifiantSupabase, row.id)
  assert.equal(filters.referenceDossier, row.reference)

  const payload = buildDossierDataPayload(row, cfg)
  assert.equal(payload.schemaKey, cfg.dossierSchemaKey)
  assert.equal(payload.locationId, cfg.locationId)
  const data = payload.data
  assert.equal(data.identifiant_supabase, row.id)
  assert.equal(data.reference_du_dossier, row.reference)
  assert.equal(data.entreprise, 'Groupe Horizon')
  assert.equal(data.evenement, 'Séminaire annuel')
})

test('payload relation : associationId + extrémités', () => {
  const rel = buildRelationPayload('contact_1', 'dossier_1', cfg.contactAssociationId, cfg)
  assert.equal(rel.associationId, cfg.contactAssociationId)
  assert.equal(rel.contactId, 'contact_1')
  assert.equal(rel.associatedRecordId, 'dossier_1')
  assert.equal(rel.locationId, cfg.locationId)
})

test('payload opportunité : pipelineId, stageId, contact + référence dans le nom', () => {
  const search = buildOpportunitySearchOpts('contact_1', row, cfg)
  assert.equal(search.contactId, 'contact_1')
  assert.equal(search.pipelineId, cfg.pipelineId)
  assert.equal(search.stageId, cfg.stageId)
  assert.equal(search.referenceDossier, row.reference)

  const name = buildOpportunityName(row)
  assert.equal(name.includes(row.reference), true)

  const payload = buildOpportunityPayload(row, 'contact_1', cfg)
  assert.equal(payload.contactId, 'contact_1')
  assert.equal(payload.pipelineId, cfg.pipelineId)
  assert.equal(payload.stageId, cfg.stageId)
  assert.equal(String(payload.name).includes(row.reference), true)
  assert.equal(payload.locationId, cfg.locationId)
})

test('constantes attendues (codes HTTP + en-tête Version)', () => {
  assert.equal(EXPECTED.HTTP_OK, 200)
  assert.equal(EXPECTED.HTTP_CREATED, 201)
  assert.equal(EXPECTED.VERSION, '2021-07-28')
})