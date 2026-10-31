import { randomUUID } from 'node:crypto'

/**
 * Doubles pour les tests P2 — AUCUN accès réseau ni base réelle.
 *
 * `createMemoryAttemptStore` reproduit EXACTEMENT les contraintes de la
 * migration 20261030_payment_attempts.sql :
 *  - index partiel unique `uq_payment_attempts_single_active` : au plus une
 *    tentative active (created/awaiting_pay/unknown) par réservation ;
 *  - unicité globale d'`order_id` ;
 *  - réclamation conditionnelle (status 'created' + claim expiré).
 * Les mutations sont synchrones entre une vérification et son application,
 * ce qui mime l'atomicité autocommit de PostgreSQL pour les tests.
 */

const ACTIVE_STATUSES = new Set(['created', 'awaiting_pay', 'unknown'])

export function createMemoryAttemptStore() {
  const rows = []
  const counters = { inserts: 0, claims: 0, updates: 0, conflictsActive: 0, conflictsOrder: 0 }

  const nowIso = () => new Date().toISOString()

  const makeRow = (attempt) => ({
    id: randomUUID(),
    reservation_id: attempt.reservation_id,
    reference: attempt.reference,
    order_id: attempt.order_id,
    amount: attempt.amount,
    currency: attempt.currency,
    status: 'created',
    payment_url: null,
    provider_operation_id: null,
    provider_request_id: null,
    claim_token: attempt.claim_token,
    claimed_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  })

  return {
    insert: async (attempt) => {
      counters.inserts += 1
      if (rows.some((r) => r.order_id === attempt.order_id)) {
        counters.conflictsOrder += 1
        return { ok: false, conflict: 'order_id' }
      }
      if (rows.some((r) => r.reservation_id === attempt.reservation_id && ACTIVE_STATUSES.has(r.status))) {
        counters.conflictsActive += 1
        return { ok: false, conflict: 'active_attempt' }
      }
      const row = makeRow(attempt)
      rows.push(row)
      return { ok: true, row }
    },

    selectActive: async (reservationId) => {
      const actives = rows.filter(
        (r) => r.reservation_id === reservationId && ACTIVE_STATUSES.has(r.status)
      )
      return actives.length ? actives[actives.length - 1] : null
    },

    selectLatest: async (reservationId) => {
      const matches = rows.filter((r) => r.reservation_id === reservationId)
      return matches.length ? matches[matches.length - 1] : null
    },

    selectById: async (id) => rows.find((r) => r.id === id) ?? null,

    claim: async (id, token, claimedBeforeIso) => {
      const row = rows.find((r) => r.id === id)
      if (!row || row.status !== 'created') return false
      const claimedAt = row.claimed_at ? Date.parse(row.claimed_at) : NaN
      const isOwner = row.claim_token === token
      const isStale = Number.isNaN(claimedAt) || claimedAt < Date.parse(claimedBeforeIso)
      if (!isOwner && !isStale) return false
      row.claim_token = token
      row.claimed_at = nowIso()
      row.updated_at = nowIso()
      counters.claims += 1
      return true
    },

    updateStatus: async (id, patch) => {
      const row = rows.find((r) => r.id === id)
      if (!row) throw new Error('memory attempt introuvable')
      Object.assign(row, patch)
      row.updated_at = nowIso()
      counters.updates += 1
    },

    /** Lecture seule pour les assertions de tests. */
    _rows: () => rows,
    counters,
  }
}

// ── Réservation (source de vérité simulée) ──────────────────────────────────────

export function makeReservation(overrides = {}) {
  return {
    id: 'def67890-1234-4abc-9012-abcdef123456',
    hotel_name: 'Hôtel Maison Blanche',
    total_price: 1_500_000,
    payment_status: 'pending',
    status: 'confirmed',
    currency: 'GNF',
    ...overrides,
  }
}

export function createMemoryReservationStore({ row = makeReservation(), notFound = false } = {}) {
  return {
    fetchReservation: async (id) => {
      if (notFound) return { data: null, error: { message: 'not found' } }
      return { data: { ...row, id }, error: null }
    },
  }
}

// ── Prestataire ChapChap simulé ─────────────────────────────────────────────────

export function mockChapChapFetch({
  respond = () =>
    new Response(JSON.stringify({ payment_url: 'https://pay.test/checkout-123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
} = {}) {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(String(init.body)) })
    return respond(url, init)
  }
  return { calls, fetchImpl }
}

export function providerBody(init) {
  return JSON.parse(String(init.body))
}