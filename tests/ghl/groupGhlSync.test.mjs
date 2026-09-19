// ============================================================
// Tests — Synchronisation Groupe → GHL (transport mémoire, aucun réseau)
// ============================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  claimAndSyncGroupRequest,
  GHL_SYNC_MAX_ATTEMPTS,
  GhlRelationExistsError,
  MultipleContactsError,
} from '../../src/lib/groups/groupGhlSync.ts'

const __root = resolve(import.meta.dirname, '..', '..')

const config = {
  locationId: 'a5wcdv6hapHNnLA9xnl4',
  dossierSchemaKey: 'custom_objects.dossier_groupe',
  contactAssociationId: '6aae464854eff21f459d195e',
  pipelineId: 'QaX0Hz4lOLeXtwch4EDy',
  stageId: 'a836af56-72bc-4098-b068-30783a02682e',
}

function makeRow(id = 'r1') {
  return {
    id,
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
}

function makePersist(rows) {
  const store = new Map(rows.map((r) => [r.id, { ...r }]))
  return {
    async claim(id) {
      const r = store.get(id)
      if (!r) return null
      if (r.ghl_sync_status === 'processing' || r.ghl_sync_status === 'synced') return null
      if (r.ghl_sync_attempts >= GHL_SYNC_MAX_ATTEMPTS) return null
      const next = {
        ...r,
        ghl_sync_status: 'processing',
        ghl_sync_attempts: r.ghl_sync_attempts + 1,
      }
      store.set(id, next)
      return { ...next }
    },
    async patch(id, fields) {
      store.set(id, { ...store.get(id), ...fields })
    },
    get(id) {
      return store.get(id)
    },
  }
}

function makeTransport(opts = {}) {
  const fail = opts.fail ?? {}
  const counters = { createContact: 0, createDossier: 0, createOpportunity: 0, associate: 0 }
  const state = { contacts: opts.contacts ?? [], dossiers: [], opportunities: [] }
  return {
    counters,
    state,
    async findContactByEmail(email) {
      return state.contacts.find((c) => c.email === email) ?? null
    },
    async findContactByPhone(phone) {
      return state.contacts.find((c) => c.phone === phone) ?? null
    },
    async createContact(payload) {
      if (fail.contact) throw new Error(fail.contact)
      counters.createContact += 1
      const id = `cnt_${counters.createContact}`
      state.contacts.push({ id, email: payload.email, phone: payload.phone })
      return { id }
    },
    async findDossier({ identifiantSupabase, referenceDossier }) {
      return (
        state.dossiers.find(
          (d) => d.ident === identifiantSupabase || d.ref === referenceDossier
        ) ?? null
      )
    },
    async createDossier(data) {
      if (fail.dossier) throw new Error(fail.dossier)
      counters.createDossier += 1
      const d = data.data ?? {}
      const id = `dos_${counters.createDossier}`
      state.dossiers.push({ id, ident: d.identifiant_supabase, ref: d.reference_du_dossier })
      return { id }
    },
    async associateContactDossier() {
      if (fail.relationExists) throw new GhlRelationExistsError()
      if (fail.association) throw new Error(fail.association)
      counters.associate += 1
    },
    async findOpportunity(opts) {
      return (
        state.opportunities.find(
          (o) =>
            o.contactId === opts.contactId &&
            o.pipelineId === opts.pipelineId &&
            (!opts.referenceDossier || (o.name ?? '').includes(opts.referenceDossier))
        ) ?? null
      )
    },
    async createOpportunity(p) {
      if (fail.opportunity) throw new Error(fail.opportunity)
      counters.createOpportunity += 1
      const id = `opp_${counters.createOpportunity}`
      state.opportunities.push({
        id,
        contactId: p.contactId,
        pipelineId: p.pipelineId,
        name: p.name,
      })
      return { id }
    },
  }
}

test('synchronisation complète → synced + tous les IDs enregistrés', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport()
  const res = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  assert.equal(res.outcome, 'synced')
  const row = persist.get('r1')
  assert.equal(row.ghl_sync_status, 'synced')
  assert.ok(row.ghl_contact_id)
  assert.ok(row.ghl_dossier_id)
  assert.ok(row.ghl_opportunity_id)
  assert.ok(row.ghl_last_synced_at)
  assert.equal(row.ghl_last_error, null)
  assert.equal(transport.counters.createContact, 1)
  assert.equal(transport.counters.createDossier, 1)
  assert.equal(transport.counters.createOpportunity, 1)
})

test('contact déjà présent → pas de création de contact, synced', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport({
    contacts: [{ id: 'cnt_existing', email: 'awa@exemple.com', phone: '+224611223344' }],
  })
  const res = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  assert.equal(res.outcome, 'synced')
  assert.equal(transport.counters.createContact, 0)
  assert.equal(persist.get('r1').ghl_contact_id, 'cnt_existing')
})

test('reprise après échec partiel → partial puis reprise sans doublon', async () => {
  const persist = makePersist([makeRow()])
  const failing = makeTransport({ fail: { dossier: 'Echec dossier' } })
  const first = await claimAndSyncGroupRequest('r1', { persist, transport: failing, config })
  assert.equal(first.outcome, 'partial')
  const afterFirst = persist.get('r1')
  assert.equal(afterFirst.ghl_sync_status, 'partial')
  assert.ok(afterFirst.ghl_contact_id)
  assert.equal(afterFirst.ghl_dossier_id, null)
  assert.equal(failing.counters.createContact, 1)

  // Reprise avec un transport sain : le contact est déjà enregistré → aucun doublon.
  const okTransport = makeTransport()
  const second = await claimAndSyncGroupRequest('r1', { persist, transport: okTransport, config })
  assert.equal(second.outcome, 'synced')
  assert.equal(okTransport.counters.createContact, 0) // retrouvé via ghl_contact_id
  assert.equal(okTransport.counters.createDossier, 1)
  assert.equal(okTransport.counters.createOpportunity, 1)
  const end = persist.get('r1')
  assert.equal(end.ghl_contact_id, afterFirst.ghl_contact_id)
  assert.equal(end.ghl_sync_status, 'synced')
})

test('deuxième exécution sur demande déjà `synced` → skipped, aucun doublon', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport()
  await claimAndSyncGroupRequest('r1', { persist, transport, config })
  const before = transport.counters.createContact
  const again = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  assert.equal(again.outcome, 'skipped')
  assert.equal(transport.counters.createContact, before)
  assert.equal(transport.counters.createDossier, 1)
})

test('maximum de 3 tentatives automatiques', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport({ fail: { contact: 'Echec contact' } })
  let outcome
  for (let i = 0; i < 4; i += 1) {
    outcome = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  }
  const row = persist.get('r1')
  assert.equal(row.ghl_sync_attempts, GHL_SYNC_MAX_ATTEMPTS)
  assert.equal(outcome.outcome, 'skipped')
  assert.equal(transport.counters.createContact, 0)
})
test('échec total (rien créé) → failed, erreur nettoyée', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport({ fail: { contact: 'SECRET_TOKEN_XYZ boom stack @internal' } })
  const res = await claimAndSyncGroupRequest('r1', {
    persist,
    transport,
    config,
    cleanError: (e) => String(e.message).replace(/SECRET_\w+/g, '').replace(/stack/g, '').slice(0, 60),
  })
  assert.equal(res.outcome, 'failed')
  const row = persist.get('r1')
  assert.equal(row.ghl_sync_status, 'failed')
  assert.ok(row.ghl_last_error)
  assert.equal(row.ghl_last_error.includes('SECRET_TOKEN'), false)
  assert.equal(row.ghl_last_error.includes('stack'), false)
})

test('aucun jeton/sécrét exposé au transport', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport()
  const calls = []
  const overrides = {}
  for (const key of Object.keys(transport)) {
    const original = transport[key]
    overrides[key] = async (...args) => {
      calls.push(args)
      return original(...args)
    }
  }
  await claimAndSyncGroupRequest('r1', {
    persist,
    transport: { ...transport, ...overrides },
    config,
  })
  const serialized = JSON.stringify(calls)
  assert.equal(serialized.includes('Bearer'), false)
  assert.equal(serialized.includes('GHL_PRIVATE_INTEGRATION_TOKEN'), false)
  assert.equal(serialized.includes('pit-'), false)
})

test('route : synchro gated par GHL_GROUP_SYNC_ENABLED (désactivée par défaut)', () => {
  const route = readFileSync(resolve(__root, 'src/app/api/group-requests/route.ts'), 'utf8')
  assert.equal(route.includes('after('), true)
  assert.equal(route.includes('isGroupGhlSyncEnabled()'), true)
  const server = readFileSync(resolve(__root, 'src/lib/groups/groupGhlSyncServer.ts'), 'utf8')
  assert.equal(server.includes("process.env.GHL_GROUP_SYNC_ENABLED === 'true'"), true)
  const env = readFileSync(resolve(__root, '.env.local'), 'utf8')
  assert.equal(env.includes('GHL_GROUP_SYNC_ENABLED'), false)
})

test('aucune confirmation ni paiement groupe déclenché par la synchro', () => {
  const core = readFileSync(resolve(__root, 'src/lib/groups/groupGhlSync.ts'), 'utf8')
  for (const banned of ['chapchap', 'payment', 'paiement', 'confirmé']) {
    assert.equal(core.includes(banned), false, `le cœur ne doit pas référencer ${banned}`)
  }
  const route = readFileSync(resolve(__root, 'src/app/api/group-requests/route.ts'), 'utf8')
  assert.equal(route.includes('GROUP_REQUEST_SUCCESS_MESSAGE'), true)
})

test('aucune table chambre/réservation touchée par la synchro', () => {
  const server = readFileSync(resolve(__root, 'src/lib/groups/groupGhlSyncServer.ts'), 'utf8')
  assert.equal(server.includes(".from('reservations')"), false)
  assert.equal(server.includes('conference_reservations'), false)
  assert.equal(server.includes(".from('rooms')"), false)
function withPatchFail(persist, predicate) {
  return {
    ...persist,
    async patch(id, fields) {
      if (predicate(fields)) throw new Error('PERSIST_FAIL_LOCAL')
      return persist.patch(id, fields)
    },
  }
}

test('relation déjà existante → traitée comme succès, aucun doublon', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport({ fail: { relationExists: true } })
  const res = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  assert.equal(res.outcome, 'synced')
  assert.equal(persist.get('r1').ghl_sync_status, 'synced')
  assert.equal(transport.counters.createOpportunity, 1)
  assert.equal(transport.counters.associate, 0) // relation refusée = idempotent accepté
})

test('GHL crée le contact mais Supabase échoue → reprise retrouve par email, pas de doublon', async () => {
  const base = makePersist([makeRow()])
  const transport = makeTransport()
  const failing = withPatchFail(base, (f) => 'ghl_contact_id' in f)

  const first = await claimAndSyncGroupRequest('r1', { persist: failing, transport, config })
  assert.equal(first.outcome, 'partial')
  assert.equal(base.get('r1').ghl_contact_id, null) // persistance locale échouée
  assert.equal(transport.counters.createContact, 1) // contact créé côté GHL

  const retry = makePersist([base.get('r1')])
  const second = await claimAndSyncGroupRequest('r1', { persist: retry, transport, config })
  assert.equal(second.outcome, 'synced')
  assert.equal(transport.counters.createContact, 1) // retrouvé par email, pas de doublon
  assert.equal(retry.get('r1').ghl_contact_id, 'cnt_1')
})

test('GHL crée le dossier mais Supabase échoue → reprise retrouve par identifiant_supabase', async () => {
  const base = makePersist([makeRow()])
  const transport = makeTransport()
  const failing = withPatchFail(base, (f) => 'ghl_dossier_id' in f)

  const first = await claimAndSyncGroupRequest('r1', { persist: failing, transport, config })
  assert.equal(first.outcome, 'partial')
  assert.equal(base.get('r1').ghl_dossier_id, null)
  assert.equal(transport.counters.createDossier, 1)

  const retry = makePersist([base.get('r1')])
  const second = await claimAndSyncGroupRequest('r1', { persist: retry, transport, config })
  assert.equal(second.outcome, 'synced')
  assert.equal(transport.counters.createDossier, 1) // pas de doublon
  assert.equal(retry.get('r1').ghl_dossier_id, 'dos_1')
})

test('GHL crée l’opportunité mais Supabase échoue → reprise retrouve par contact+pipeline+référence', async () => {
  const base = makePersist([makeRow()])
  const transport = makeTransport()
  const failing = withPatchFail(base, (f) => 'ghl_opportunity_id' in f)

  const first = await claimAndSyncGroupRequest('r1', { persist: failing, transport, config })
  assert.equal(first.outcome, 'partial')
  assert.equal(base.get('r1').ghl_opportunity_id, null)
  assert.equal(transport.counters.createOpportunity, 1)

  const retry = makePersist([base.get('r1')])
  const second = await claimAndSyncGroupRequest('r1', { persist: retry, transport, config })
  assert.equal(second.outcome, 'synced')
  assert.equal(transport.counters.createOpportunity, 1) // pas de doublon
  assert.equal(retry.get('r1').ghl_opportunity_id, 'opp_1')
})
test('téléphone trouvé (email sans correspondance) → réutilisation, pas de création', async () => {
  const persist = makePersist([makeRow()])
  const transport = {
    ...makeTransport(),
    async findContactByEmail() {
      return null
    },
    async findContactByPhone() {
      return { id: 'cnt_phone' }
    },
  }
  const res = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  assert.equal(res.outcome, 'synced')
  assert.equal(transport.counters.createContact, 0)
  assert.equal(persist.get('r1').ghl_contact_id, 'cnt_phone')
})

test('recherche en erreur (multiples contacts) → aucune création', async () => {
  const persist = makePersist([makeRow()])
  const transport = makeTransport()
  transport.findContactByEmail = async () => {
    throw new MultipleContactsError('awa@exemple.com')
  }
  const res = await claimAndSyncGroupRequest('r1', { persist, transport, config })
  assert.equal(res.outcome, 'failed')
  assert.equal(transport.counters.createContact, 0)
  assert.equal(persist.get('r1').ghl_contact_id, null)
})
})