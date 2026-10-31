import { createHmac, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import {
  LOCAL_JWT_SECRET,
  readLocalTestConfig,
  assertOwnedBench,
  localOnlyFetch,
} from '../../scripts/local-tests/connection-policy.mjs'
import { createSupabaseAttemptStore } from '../../src/lib/supabaseAttemptStore.ts'

// No legacy/production variable fallback. Validation runs BEFORE client creation.
const config = readLocalTestConfig()
const RUN = config !== null
const runOrSkip = RUN ? test : test.skip
if (!RUN) console.log('Supabase integration skipped: run node scripts/local-tests/run.mjs')
const client = RUN
  ? createClient(config.apiUrl, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: localOnlyFetch() },
    })
  : null
if (client) await assertOwnedBench(client, config.benchId)
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

  const ownerRepeat = await store.claim(id, token, new Date(Date.now() - 4 * 60_000).toISOString())
  assert.equal(ownerRepeat, true, 'même propriétaire + même jeton autorisé')

  const rival = await store.claim(id, randomUUID(), new Date(Date.now() - 4 * 60_000).toISOString())
  assert.equal(rival, false, 'jeton différent + claim frais → refusé')

  // Simulation d'expiration (claim périmé) → une réclamation conditionnelle réussit.
  await store.updateStatus(id, {
    claimed_at: new Date(Date.now() - 10 * 60_000).toISOString(),
  })
  const afterExpiry = await store.claim(
    id,
    randomUUID(),
    new Date(Date.now() - 4 * 60_000).toISOString()
  )
  assert.equal(afterExpiry, true, 'claim expiré → récupérable par réclamation')
})

runOrSkip('10 claims concurrents sur verrou expiré → 1 succès', async () => {
  const rid = await insertFictiveReservation()
  const ownerToken = randomUUID()
  const ins = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: ownerToken,
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return

  await store.updateStatus(ins.row.id, {
    claimed_at: new Date(Date.now() - 10 * 60_000).toISOString(),
  })

  const claimedBeforeIso = new Date(Date.now() - 4 * 60_000).toISOString()
  const results = await Promise.all(
    Array.from({ length: 10 }, () => store.claim(ins.row.id, randomUUID(), claimedBeforeIso))
  )

  const trueCount = results.filter(Boolean).length
  assert.equal(trueCount, 1, `un seul gagnant attendu (reçu ${trueCount})`)
})

runOrSkip('10 claims concurrents sur verrou récent → 0 succès (hors propriétaire)', async () => {
  const rid = await insertFictiveReservation()
  const ownerToken = randomUUID()
  const ins = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: ownerToken,
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return

  const claimedBeforeIso = new Date(Date.now() - 4 * 60_000).toISOString()
  const results = await Promise.all(
    Array.from({ length: 10 }, () => store.claim(ins.row.id, randomUUID(), claimedBeforeIso))
  )

  const trueCount = results.filter(Boolean).length
  assert.equal(trueCount, 0, `aucun rival ne doit gagner (reçu ${trueCount})`)
})

runOrSkip('RPC claim réservée à service_role (anon/authenticated refusés)', async () => {
  const makeRoleJwt = (role) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({ role, iss: 'p2-local-tests', exp: 4102444800 })
    ).toString('base64url')
    const unsigned = `${header}.${payload}`
    const signature = createHmac('sha256', LOCAL_JWT_SECRET).update(unsigned).digest('base64url')
    return `${unsigned}.${signature}`
  }

  const { data: ridRow, error: ridErr } = await client
    .from('reservations')
    .insert({
      first_name: 'No',
      last_name: 'Role',
      email: `role+${randomUUID().slice(0, 8)}@example.com`,
      phone: '+224600000099',
      hotel_name: 'Hôtel Maison Blanche',
      room_type: 'Suite Prestige',
      check_in: '2031-05-01',
      check_out: '2031-05-03',
      guests: 2,
      total_price: 1_000_000,
      currency: 'GNF',
      payment_status: 'pending',
      payment_method: null,
      status: 'confirmed',
    })
    .select('id')
    .single()
  assert.equal(ridErr, null)
  createdReservationIds.push(ridRow.id)

  const ins = await store.insert({
    reservation_id: ridRow.id,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return

  const authedClient = createClient(config.apiUrl, makeRoleJwt('authenticated'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: localOnlyFetch() },
  })
  const anonClient = createClient(config.apiUrl, makeRoleJwt('anon'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: localOnlyFetch() },
  })

  const rpcPayload = {
    p_attempt_id: ins.row.id,
    p_claim_token: randomUUID(),
    p_claimed_before: new Date(Date.now() - 4 * 60_000).toISOString(),
  }

  const { error: deniedAuth } = await authedClient.rpc('claim_payment_attempt', rpcPayload)
  const { error: deniedAnon } = await anonClient.rpc('claim_payment_attempt', rpcPayload)

  const { error: deniedAuthBegin } = await authedClient.rpc('begin_provider_dispatch', rpcPayload)
  const { error: deniedAnonBegin } = await anonClient.rpc('begin_provider_dispatch', rpcPayload)

  const { error: deniedAuthSettle } = await authedClient.rpc('settle_payment_attempt', {
    p_attempt_id: ins.row.id,
    p_decision: 'unknown',
  })
  const { error: deniedAnonSettle } = await anonClient.rpc('settle_payment_attempt', {
    p_attempt_id: ins.row.id,
    p_decision: 'unknown',
  })

  assert.ok(deniedAuth, 'authenticated sans grant execute doit être refusé')
  assert.ok(deniedAnon, 'anon sans grant execute doit être refusé')
  assert.ok(deniedAuthBegin, 'begin_provider_dispatch interdit hors service_role')
  assert.ok(deniedAnonBegin, 'begin_provider_dispatch interdit hors service_role')
  assert.ok(deniedAuthSettle, 'settle_payment_attempt interdit hors service_role')
  assert.ok(deniedAnonSettle, 'settle_payment_attempt interdit hors service_role')
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
  assert.equal(
    activeConflict,
    9,
    `9 conflits 23505 classés active_attempt (reçu ${activeConflict})`
  )

  const active = await store.selectActive(rid)
  assert.equal(active?.status, 'created', 'une seule tentative active en base')
})

runOrSkip(
  'unknown → blocage d’une nouvelle tentative, libération après réconciliation',
  async () => {
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
    assert.deepEqual(
      blocked,
      { ok: false, conflict: 'active_attempt' },
      'unknown encore actif → bloqué'
    )

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
  }
)

runOrSkip('begin_provider_dispatch atomique: 10 appels concurrents -> 1 authorization', async () => {
  const rid = await insertFictiveReservation()
  const ownerToken = randomUUID()
  const ins = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: ownerToken,
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return

  const claimedBeforeIso = new Date(Date.now() - 4 * 60_000).toISOString()
  const outcomes = await Promise.all(
    Array.from({ length: 10 }, () =>
      store.beginProviderDispatch(ins.row.id, ownerToken, claimedBeforeIso)
    )
  )

  const authorizedCount = outcomes.filter((o) => o === 'authorized').length
  const consumedCount = outcomes.filter((o) => o === 'already_consumed').length
  assert.equal(authorizedCount, 1)
  assert.equal(consumedCount, 9)
})

runOrSkip('settle_payment_attempt bloque les régressions terminales', async () => {
  const rid = await insertFictiveReservation()
  const ins = await store.insert({
    reservation_id: rid,
    reference: 'MB-XXXXXXXX',
    order_id: `MB-ITG-${randomUUID().slice(0, 8).toUpperCase()}`,
    amount: 1_000_000,
    currency: 'GNF',
    claim_token: randomUUID(),
  })
  assert.equal(ins.ok, true)
  if (!ins.ok) return

  await store.updateStatus(ins.row.id, { status: 'paid' })
  const late = await store.settle(ins.row.id, { decision: 'ok', paymentUrl: 'https://pay.test/late' })
  assert.equal(late, 'terminal_blocked')

  const final = await store.selectById(ins.row.id)
  assert.equal(final?.status, 'paid')
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
