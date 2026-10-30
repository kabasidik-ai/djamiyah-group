import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAttemptStore } from '../../src/lib/supabaseAttemptStore.ts'

/**
 * INTÉGRATION — Adaptateur réel contre le banc SUPABASE LOCAL (Docker).
 * Uniquement si les variables d'environnement locales sont fournies
 * (API_URL / SUPABASE_URL + SERVICE_ROLE_KEY). Aucune clé de production,
 * aucun lien distant, aucune écriture hors du banc.
 */

const API_URL = process.env.API_URL || process.env.SUPABASE_URL || ''
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const RUN = Boolean(API_URL && SERVICE_KEY)
const runOrSkip = RUN ? test : test.skip

if (!RUN) {
  console.log('ℹ Tests d’intégration Supabase local ignorés (API_URL/SERVICE_ROLE_KEY absents).')
}

const client = RUN ? createClient(API_URL, SERVICE_KEY) : null
const store = RUN ? createSupabaseAttemptStore(client) : null

// ── Données fictives (nettoyées après chaque exécution) ─────────────────────────

const createdReservationIds = []

async function insertFictiveReservation(hotelName = 'Hôtel Maison Blanche') {
  const row = {
    first_name: 'Adap',
    last_name: 'Testeur',
    email: `adapter+${randomUUID().slice(0, 8)}@example.com`,
    phone: '+224600000099',
    hotel_name: hotelName,
    room_type: 'Suite Prestige',
    check_in: '2031-05-01',
    check_out: '2031-05-03',
    guests: 2,
    total_price: 2_400_000,
    currency: 'GNF',
    payment_status: 'pending',
    payment_method: null,
    status: 'confirmed',
  }
  const { data, error } = await client.from('reservations').insert(row).select('id').single()
  assert.equal(error, null, `insert réservation fictive : ${error?.message ?? ''}`)
  createdReservationIds.push(data.id)
  return data.id
}

runOrSkip('insert → selectById → roundtrip (status créé par défaut)', async () => {
  const rid = await insertFictiveReservation()
  const ins = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 2_400_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return
  assert.equal(ins.row.status, 'created')

  const fetched = await store.selectById(ins.row.id)
  assert.equal(fetched?.id, ins.row.id)
  assert.equal(fetched?.order_id, ins.row.order_id)
})

runOrSkip('23505 réel : seconde tentative active → conflict "active_attempt"', async () => {
  const rid = await insertFictiveReservation()
  const first = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(first.ok, true)
  if (!first.ok) return

  const second = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })

  assert.deepEqual(second, { ok: false, conflict: 'active_attempt' })
})

runOrSkip('23505 réel : order_id dupliqué (autre réservation) → conflict "order_id"', async () => {
  const ridA = await insertFictiveReservation()
  const ridB = await insertFictiveReservation('Hôtel Rama')
  const orderId = `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`

  const a = await store.insert({
    reservation_id: ridA,
    reference: 'MB-XXXXXXXX',
    order_id: orderId,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(a.ok, true)
  if (!a.ok) return

  const b = await store.insert({
    reservation_id: ridB,
    reference: 'RA-YYYYYYYY',
    order_id: orderId,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })

  assert.deepEqual(b, { ok: false, conflict: 'order_id' })
})

runOrSkip('claim : propriétaire OK, rival refusé, puis réclamation après expiration', async () => {
  const rid = await insertFictiveReservation()
  const token = randomUUID()
  const ins = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: token,
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return
  const id = ins.row.id

  const owner = await store.claim(id, token, new Date(Date.now() - 4 * 60_000).toISOString())
  assert.equal(owner, true, 'réclamation du propriétaire (même jeton)')

  const rival = await store.claim(id, randomUUID(), new Date(Date.now() - 4 * 60_000).toISOString())
  assert.equal(rival, false, 'jeton différent + claim frais → refusé')

  // Simulation d'expiration (claim périmé) → une réclamation conditionnelle réussit.
  await store.updateStatus(id, {
    claimed_at: new Date(Date.now() - 10 * 60_000).toISOString(),
  })
  const afterExpiry = await store.claim(id, randomUUID(), new Date(Date.now() - 4 * 60_000).toISOString())
  assert.equal(afterExpiry, true, 'claim expiré → récupérable par réclamation')
})

runOrSkip('10 insertions concurrentes (Promise.all) → un seul succès actif', async () => {
  const rid = await insertFictiveReservation()

  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      store.insert({
        reservation_id: rid,
        reference: 'MB-XXXXXXXX',
        order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
        amount: 1_000_000,
        currency: 'GNF',
        claim_token: randomUUID(),
      })
    )
  )

  const okCount = results.filter((r) => r.ok).length
  const activeConflict = results.filter((r) => !r.ok && r.conflict === 'active_attempt').length
  assert.equal(okCount, 1, `un seul INSERT gagnant (reçu ${okCount})`)
  assert.equal(activeConflict, 9, `9 conflits 23505 classés active_attempt (reçu ${activeConflict})`)

  const active = await store.selectActive(rid)
  assert.equal(active?.status, 'created', 'une seule tentative active en base')
})

runOrSkip('unknown → blocage d’une nouvelle tentative, libération après réconciliation', async () => {
  const rid = await insertFictiveReservation()

  const unk = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(unk.ok, true)
  if (!unk.ok) return
  await store.updateStatus(unk.row.id, { status: 'unknown' })

  const blocked = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.deepEqual(blocked, { ok: false, conflict: 'active_attempt' }, 'unknown encore actif → bloqué')

  // Réconciliation : requalification terminale, puis nouvelle tentative autorisée.
  await store.updateStatus(unk.row.id, { status: 'expired' })

  const released = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(released.ok, true, 'nouvelle tentative autorisée après réconciliation')
})

// ── Nettoyage des données fictives du banc ──────────────────────────────────────

test('nettoyage : suppression des tentatives et réservations fictives du banc', async () => {
  if (!RUN) return
  for (const rid of createdReservationIds) {
    await client.from('payment_attempts').delete().eq('reservation_id', rid)
    await client.from('reservations').delete().eq('id', rid)
  }
  createdReservationIds.length = 0
})