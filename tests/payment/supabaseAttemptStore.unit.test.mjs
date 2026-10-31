import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createSupabaseAttemptStore,
  classifyAttemptInsertError,
  CONSTRAINT_ACTIVE_ATTEMPT,
  CONSTRAINT_ORDER_ID,
} from '../../src/lib/supabaseAttemptStore.ts'
import { randomUUID } from 'node:crypto'

/**
 * Tests unitaires de l'adaptateur réel (aucune base, aucun réseau) :
 * - classification des conflits PostgreSQL 23505 par nom de contrainte ;
 * - chaînage correct des statements supabase-js (insert/update/claim).
 * Le comportement concurrentiel réel est couvert par le test d'intégration
 * sur le banc PostgreSQL local.
 */

// ── Stub supabase-js (chaînage fluide avec journal des appels) ─────────────────

function buildClient(behavior) {
  const steps = []

  // Chaque maillon est une VRAIE Promise enrichie de méthodes fluides :
  // `await` natif (aucune incompatibilité `then`), et eq/in/order/limit/or/
  // select/single enregistrent l'appel puis renvoient un nouveau maillon.
  const build = () => {
    const record = (name, args) => {
      steps.push([name, ...args])
      return build()
    }
    const promise = Promise.resolve(behavior.resolve())
    return Object.assign(promise, {
      eq: (...a) => record('eq', a),
      in: (...a) => record('in', a),
      order: (...a) => record('order', a),
      limit: (...a) => record('limit', a),
      or: (...a) => record('or', a),
      select: (...a) => record('select', a),
      single: async () => Promise.resolve(behavior.resolve()),
      maybeSingle: async () => Promise.resolve(behavior.resolve()),
    })
  }

  const client = {
    from(table) {
      steps.push(['from', table])
      return {
        insert: (row) => {
          steps.push(['insert$$', row])
          return build()
        },
        update: (patch) => {
          steps.push(['update$$', patch])
          return build()
        },
        select: (cols) => {
          steps.push(['select$$', cols])
          return build()
        },
      }
    },
    rpc: (fn, args) => {
      steps.push(['rpc', fn, args])
      return Promise.resolve(behavior.resolve())
    },
  }
  return { client, steps }
}

function baseRow(overrides = {}) {
  return {
    id: randomUUID(),
    reservation_id: randomUUID(),
    reference: 'MB-DEF67890',
    order_id: 'MB-DEF67890-ABCDEF12',
    amount: 1_500_000,
    currency: 'GNF',
    status: 'created',
    payment_url: null,
    provider_operation_id: null,
    provider_request_id: null,
    claim_token: null,
    claimed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function attempt() {
  return {
    reservation_id: 'def67890-1234-4abc-9012-abcdef123456',
    reference: 'MB-DEF67890',
    order_id: 'MB-DEF67890-XYZZY000',
    amount: 1_500_000,
    currency: 'GNF',
    claim_token: '11111111-2222-4333-8444-555555555555',
  }
}

// ── Classification 23505 ────────────────────────────────────────────────────────

test('classify : 23505 + uq_payment_attempts_single_active → active_attempt', () => {
  assert.equal(
    classifyAttemptInsertError({
      code: '23505',
      message: `duplicate key value violates unique constraint "${CONSTRAINT_ACTIVE_ATTEMPT}"`,
    }),
    'active_attempt'
  )
})

test('classify : 23505 + payment_attempts_order_id_key → order_id', () => {
  assert.equal(
    classifyAttemptInsertError({
      code: '23505',
      message: `duplicate key value violates unique constraint "${CONSTRAINT_ORDER_ID}"`,
    }),
    'order_id'
  )
})

test('classify : 23505 sur contrainte inconnue → unknown', () => {
  assert.equal(
    classifyAttemptInsertError({ code: '23505', message: 'duplicate key value violates unique constraint "weird_key"' }),
    'unknown'
  )
})

test('classify : erreur non 23505 → unknown', () => {
  assert.equal(classifyAttemptInsertError({ code: '42501', message: 'permission denied' }), 'unknown')
})

// ── Chaînage des opérations ─────────────────────────────────────────────────────

test('insert : succès → { ok, row }, payload complet et claimed_at initialisé', async () => {
  const row = baseRow()
  const { client, steps } = buildClient({
    resolve: () => ({ data: row, error: null }),
  })
  const store = createSupabaseAttemptStore(client)

  const result = await store.insert(attempt())

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.row.id, row.id)
  const rowPayload = steps.find(([name]) => name === 'insert$$')[1]
  assert.equal(rowPayload.reservation_id, attempt().reservation_id)
  assert.equal(rowPayload.order_id, attempt().order_id)
  assert.ok(rowPayload.claimed_at, 'claimed_at posé dès l’insertion')
})

test('insert : 23505 active → { ok:false, conflict:"active_attempt" }', async () => {
  const { client } = buildClient({
    resolve: () => ({
      data: null,
      error: {
        code: '23505',
        message: `duplicate key value violates unique constraint "${CONSTRAINT_ACTIVE_ATTEMPT}"`,
      },
    }),
  })
  const store = createSupabaseAttemptStore(client)

  const result = await store.insert(attempt())

  assert.deepEqual(result, { ok: false, conflict: 'active_attempt' })
})

test('insert : 23505 order_id → { ok:false, conflict:"order_id" }', async () => {
  const { client } = buildClient({
    resolve: () => ({
      data: null,
      error: {
        code: '23505',
        message: `duplicate key value violates unique constraint "${CONSTRAINT_ORDER_ID}"`,
      },
    }),
  })
  const store = createSupabaseAttemptStore(client)

  const result = await store.insert(attempt())

  assert.deepEqual(result, { ok: false, conflict: 'order_id' })
})

test('insert : erreur inconnue → relancée (jamais classifiée hasardeusement)', async () => {
  const { client } = buildClient({
    resolve: () => ({ data: null, error: { code: '42P01', message: 'relation missing' } }),
  })
  const store = createSupabaseAttemptStore(client)

  await assert.rejects(() => store.insert(attempt()))
})

test('claim : utilise la RPC atomique claim_payment_attempt', async () => {
  const { client, steps } = buildClient({
    resolve: () => ({ data: true, error: null }),
  })
  const store = createSupabaseAttemptStore(client)

  const ok = await store.claim('a-b-c', '11111111-2222-4333-8444-555555555555', '2026-01-01T00:00:00.000Z')

  assert.equal(ok, true)
  const rpc = steps.find(([name]) => name === 'rpc')
  assert.deepEqual(rpc, [
    'rpc',
    'claim_payment_attempt',
    {
      p_attempt_id: 'a-b-c',
      p_claim_token: '11111111-2222-4333-8444-555555555555',
      p_claimed_before: '2026-01-01T00:00:00.000Z',
    },
  ])
})

test('claim : RPC renvoie false → réclamation refusée', async () => {
  const { client } = buildClient({ resolve: () => ({ data: false, error: null }) })
  const store = createSupabaseAttemptStore(client)

  assert.equal(
    await store.claim('a', '11111111-2222-4333-8444-555555555555', '2026-01-01T00:00:00.000Z'),
    false
  )
})

test('updateStatus : patch transmis + condition par id', async () => {
  const { client, steps } = buildClient({ resolve: () => ({ data: [{ id: 'x' }], error: null }) })
  const store = createSupabaseAttemptStore(client)

  await store.updateStatus('x', { status: 'awaiting_pay', payment_url: 'https://pay.test/u' })

  const patch = steps.find(([name]) => name === 'update$$')[1]
  assert.equal(patch.status, 'awaiting_pay')
  const eqCalls = steps.filter(([name]) => name === 'eq')
  assert.ok(eqCalls.some(([, c]) => c === 'id'), 'condition par id')
})

test('selectActive : filtre statuts actifs + tri desc + limite 1', async () => {
  const row = baseRow()
  const { client, steps } = buildClient({ resolve: () => ({ data: [row], error: null }) })
  const store = createSupabaseAttemptStore(client)

  const value = await store.selectActive('res-1')

  assert.equal(value?.id, row.id)
  const names = steps.map(([name]) => name).join(',')
  assert.ok(names.includes('in') && names.includes('order') && names.includes('limit'))
})

test('selectById : aucune ligne → null (sans erreur)', async () => {
  const { client } = buildClient({ resolve: () => ({ data: null, error: null }) })
  const store = createSupabaseAttemptStore(client)

  assert.equal(await store.selectById('inexistant'), null)
})