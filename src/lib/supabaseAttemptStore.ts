import type {
  AttemptInsert,
  AttemptInsertResult,
  AttemptStore,
  PaymentAttemptRow,
} from './paymentAttempts.ts'

/**
 * P2 — Adaptateur Supabase RÉEL des tentatives de paiement.
 *
 * Implémente `AttemptStore` (src/lib/paymentAttempts.ts) sur un client
 * supabase-js (PostgREST). Chaque opération est un statement unique
 * (autocommit) : AUCUNE transaction SQL n'est tenue pendant un appel externe.
 *
 * Conflits 23505 : le code d'erreur PostgREST porte le SQLSTATE PostgreSQL ;
 * le message contient le nom de la contrainte violée. On classe ainsi :
 *  - `uq_payment_attempts_single_active`        → conflict 'active_attempt'
 *  - `payment_attempts_order_id_key`            → conflict 'order_id'
 *  - toute autre contrainte unique → ERREUR (aucune classification hasardeuse).
 */

export const ACTIVE_STATUSES = ['created', 'awaiting_pay', 'unknown']

export const CONSTRAINT_ACTIVE_ATTEMPT = 'uq_payment_attempts_single_active'
export const CONSTRAINT_ORDER_ID = 'payment_attempts_order_id_key'

export type AttemptInsertConflict = 'active_attempt' | 'order_id' | 'unknown'

// ── Typage minimal du client supabase-js (seules les chaînes utilisées) ─────────
// Chaque builder est à la fois une Promise SGBDR { data, error } et l'objet
// fluent (eq/or/…) — c'est le vrai comportement de PostgREST/supabase-js.

type SingleResult<T> = Promise<{ data: T | null; error: unknown }>
type ListResult<T> = Promise<{ data: T[] | null; error: unknown }>

type SelectBuilder<T> = ListResult<T> & {
  eq(column: string, value: unknown): SelectBuilder<T>
  in(column: string, values: readonly string[]): SelectBuilder<T>
  order(column: string, opts?: { ascending?: boolean }): SelectBuilder<T>
  limit(count: number): SelectBuilder<T>
  single(): SingleResult<T>
  maybeSingle(): SingleResult<T>
}

type UpdateBuilder = ListResult<PaymentAttemptRow> & {
  eq(column: string, value: unknown): UpdateBuilder
  select(columns: string): ListResult<PaymentAttemptRow>
}

export type PaymentAttemptsTableClient = {
  from(table: 'payment_attempts'): {
    insert(row: Record<string, unknown>): {
      select(columns?: string): { single(): SingleResult<PaymentAttemptRow> }
    }
    update(patch: Partial<PaymentAttemptRow>): UpdateBuilder
    select(columns: string): SelectBuilder<PaymentAttemptRow>
  }
  rpc(
    fn: 'claim_payment_attempt',
    args: { p_attempt_id: string; p_claim_token: string; p_claimed_before: string }
  ): Promise<{ data: boolean | null; error: unknown }>
}

/**
 * Classification PURE d'une erreur d'insertion (testable sans base).
 *  code '23505' + nom de contrainte → mapping précis ; sinon 'unknown'.
 */
export function classifyAttemptInsertError(error: {
  code?: string | null
  message?: string | null
}): AttemptInsertConflict {
  const code = error?.code ?? ''
  const message = error?.message ?? ''
  if (code === '23505') {
    if (message.includes(CONSTRAINT_ORDER_ID)) return 'order_id'
    if (message.includes(CONSTRAINT_ACTIVE_ATTEMPT)) return 'active_attempt'
    return 'unknown'
  }
  return 'unknown'
}

/**
 * Adaptateur supabase-js. `client` : le client service-role passé par la
 * route de paiement (createServiceRoleClient) — jamais câblé ici.
 */
export function createSupabaseAttemptStore(client: PaymentAttemptsTableClient): AttemptStore {
  return {
    async insert(attempt: AttemptInsert): Promise<AttemptInsertResult> {
      // La tentative naît 'created' (défaut DDL) et est immédiatement portée
      // « par son créateur » (claimed_at = now, claim_token = jeton candidat) —
      // le claim propriétaire réussiera dans ce cas.
      const { data, error } = await client
        .from('payment_attempts')
        .insert({
          reservation_id: attempt.reservation_id,
          reference: attempt.reference,
          order_id: attempt.order_id,
          amount: attempt.amount,
          currency: attempt.currency,
          claim_token: attempt.claim_token,
          claimed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        const conflict = classifyAttemptInsertError(error)
        if (conflict === 'active_attempt') {
          return { ok: false, conflict: 'active_attempt' }
        }
        if (conflict === 'order_id') {
          return { ok: false, conflict: 'order_id' }
        }
        throw error
      }
      if (!data) {
        throw new Error('supabaseAttemptStore: insert returned no row')
      }
      return { ok: true, row: data }
    },

    async selectActive(reservationId: string): Promise<PaymentAttemptRow | null> {
      const { data, error } = await client
        .from('payment_attempts')
        .select('*')
        .eq('reservation_id', reservationId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) throw error
      return data?.[0] ?? null
    },

    async selectLatest(reservationId: string): Promise<PaymentAttemptRow | null> {
      const { data, error } = await client
        .from('payment_attempts')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) throw error
      return data?.[0] ?? null
    },

    async selectById(id: string): Promise<PaymentAttemptRow | null> {
      const { data, error } = await client
        .from('payment_attempts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async claim(id: string, claimToken: string, claimedBeforeIso: string): Promise<boolean> {
      // RPC SQL atomique : un unique UPDATE ... WHERE ... RETURNING côté PostgreSQL.
      const { data, error } = await client.rpc('claim_payment_attempt', {
        p_attempt_id: id,
        p_claim_token: claimToken,
        p_claimed_before: claimedBeforeIso,
      })
      if (error) throw error
      return data === true
    },

    async updateStatus(id: string, patch: Partial<PaymentAttemptRow>): Promise<void> {
      const { error } = await client
        .from('payment_attempts')
        .update(patch)
        .eq('id', id)
        .select('id')
      if (error) throw error
    },
  }
}
