// ============================================================
// Service métier — Demandes « Groupes & Séminaires »
//
// Responsabilité :
//   1. Valider la demande (schema = source officielle de vérité).
//   2. Générer la référence de dossier et une clé d'idempotence
//      déterministe (même contenu → même clé → aucune doublon).
//   3. Persister la demande — AUCUNE confirmation de disponibilité,
//      de prestation ou de tarif ici.
//
// Le cœur (`submitGroupRequest`) est indépendant de Next.js et de
// Supabase : sa persistance est injectée, ce qui permet des tests
// unitaires sans base. `createGroupRequest` branche ce cœur sur le
// client Supabase `service_role` utilisé par la route serveur.
//
// L'intégration GHL (contact/opportunité) se fera à une phase
// ultérieure, explicitement configurée et testée.
// ============================================================

import { createHash, randomUUID } from 'node:crypto'
import type { TableInsert, TypedSupabaseClient } from '@/lib/supabase'
import type { Json } from '@/types/database'
import {
  groupRequestSchema,
  type GroupRequestInput,
  type GroupRequest,
} from './schemas/groupRequest.ts'

export class GroupRequestError extends Error {
  readonly code: 'INVALID' | 'DUPLICATE' | 'DATABASE_ERROR' | 'SERVICE_UNAVAILABLE'
  readonly status: number

  constructor(
    message: string,
    code: 'INVALID' | 'DUPLICATE' | 'DATABASE_ERROR' | 'SERVICE_UNAVAILABLE',
    status: number
  ) {
    super(message)
    this.name = 'GroupRequestError'
    this.code = code
    this.status = status
  }
}

type GroupRequestInsert = TableInsert<'group_requests'>

const ACCEPTED_REF = 'GRP'

/**
 * Résultat d'une insertion. `error.code` est présent quand une
 * contrainte (ex. 23505 = unique) ou un échec SQL est survenu.
 */
type InsertOutcome = {
  data: { id: string; reference: string; status: string; created_at: string } | null
  error: { code?: string } | null
}

/**
 * Persistance minimale nécessaire au cœur métier — injectée en test.
 * En production, branchée sur le client Supabase `service_role`.
 */
export type GroupRequestPersistence = {
  insert(row: GroupRequestInsert): Promise<InsertOutcome>
  findByKey(idempotencyKey: string): Promise<{ reference: string; id: string } | null>
}

/** Génère une référence de dossier unique et lisible (ex. GRP-260919-B7K2). */
function buildReference(now = new Date()): string {
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(1, '0')}${String(
    now.getDate()
  ).padStart(1, '0')}`
  const suffix = randomUUID().slice(0, 4).toUpperCase()
  return `${ACCEPTED_REF}-${ymd}-${suffix}`
}

/**
 * Clé d'idempotence DÉTERMINISTE : deux envois strictement identiques
 * produisent la même clé → la contrainte d'unicité empêche le doublon.
 */
function buildIdempotencyKey(payload: GroupRequestInput): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function rowFrom(
  parsed: { data: GroupRequestInput },
  reference: string,
  idempotencyKey: string
): GroupRequestInsert {
  return {
    reference,
    idempotency_key: idempotencyKey,
    source: parsed.data.source,
    establishment: parsed.data.establishment,
    status: 'received',
    contact: parsed.data.contact as unknown as Json,
    company: parsed.data.company as unknown as Json,
    event: parsed.data.event as unknown as Json,
    accommodation: parsed.data.accommodation as unknown as Json,
    catering: parsed.data.catering as unknown as Json,
    comments: parsed.data.comments || null,
  }
}

/**
 * Cœur métier testable (aucune dépendance Next/Supabase).
 * Retourne un objet complet (GroupRequest) incluant référence et
 * clé d'idempotence. Gère l'idempotence : un contenu déjà enregistré
 * est retourné comme succès (même référence), sans doublon.
 */
export async function submitGroupRequest(
  input: GroupRequestInput,
  persistence: GroupRequestPersistence
): Promise<GroupRequest> {
  const parsed = groupRequestSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new GroupRequestError(issue?.message ?? 'Données invalides.', 'INVALID', 400)
  }

  const reference = buildReference()
  const idempotencyKey = buildIdempotencyKey(parsed.data)
  const row = rowFrom(parsed, reference, idempotencyKey)

  const { data, error } = await persistence.insert(row)

  if (error?.code === '23505') {
    const existing = await persistence.findByKey(idempotencyKey)
    if (existing?.reference && existing.id) {
      return { id: existing.id, ...parsed.data, reference: existing.reference, idempotencyKey }
    }
    throw new GroupRequestError(
      'Une demande identique vient déjà d’être transmise.',
      'DUPLICATE',
      409
    )
  }

  if (error || !data) {
    throw new GroupRequestError(
      'Impossible d’enregistrer la demande pour le moment.',
      'DATABASE_ERROR',
      500
    )
  }

  return { id: data.id, ...parsed.data, reference, idempotencyKey }
}

/**
 * Branché sur Supabase `service_role` — utilisé par POST /api/group-requests.
 */
export async function createGroupRequest(
  supabase: TypedSupabaseClient,
  input: GroupRequestInput
): Promise<GroupRequest> {
  const persistence: GroupRequestPersistence = {
    async insert(row) {
      const { data, error } = await supabase
        .from('group_requests')
        .insert(row)
        .select('id, reference, status, created_at')
        .single()
      return {
        data: data
          ? {
              id: data.id,
              reference: data.reference,
              status: data.status,
              created_at: data.created_at,
            }
          : null,
        error: error ? { code: error.code } : null,
      }
    },
    async findByKey(idempotencyKey) {
      const { data } = await supabase
        .from('group_requests')
        .select('reference, id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      return data ? { reference: data.reference, id: data.id } : null
    },
  }
  return submitGroupRequest(input, persistence)
}

/** Message public affiché après envoi — aucun terme de confirmation. */
export const GROUP_REQUEST_SUCCESS_MESSAGE =
  "Votre demande a bien été transmise à l'équipe de l'Hôtel Maison Blanche. Les disponibilités et les prestations seront vérifiées avant la préparation de votre proposition. Une réponse détaillée vous sera communiquée dans un délai indicatif de 24 heures."
