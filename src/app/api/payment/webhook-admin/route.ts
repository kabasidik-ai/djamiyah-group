import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/adminAuth'
import { POST as processWebhook } from '../webhook/route'

export const runtime = 'nodejs'

/**
 * P1 — Reprise manuelle CONTRÔLÉE des webhooks ChapChap.
 *
 * L'endpoint principal `/api/payment/webhook` journalise TOUT événement
 * HMAC-valide dans `p1_webhook_events` puis répond 200 (le prestataire ne
 * retente pas les 4xx/5xx — guide officiel). Les événements dont la
 * confirmation a été REFUSÉE ou ne peut PAS être vérifiée (`anomaly` /
 * `unverifiable`) sont consultables ici et REJOUABLES une fois le problème
 * résolu (ex. réservation recréée, données corrélées).
 *
 * Le rejeu réutilise le pipeline complet du webhook (verification HMAC avec
 * la signature d'origine stockée, journalisation, transitions atomiques CAS,
 * idempotence) : rejouer est TOUJOURS sûr, y compris en parallèle.
 *
 * Auth : session Supabase Auth (cookie httpOnly) + allowlist ADMIN_EMAILS —
 * même garde que l'espace admin (src/lib/adminAuth.ts).
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djamiyahgroup.com'

async function requireAdminEmail(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  if (!isAdminEmail(data.user.email)) return null
  return data.user.email ?? null
}

/**
 * Garde anti-CSRF : les mutations (et lectures sensibles) du journal ne sont
 * acceptées que depuis la même origine. Sans `Origin`/`Referer` (appel serveur
 * interne), on autorise — les coercitions inter-sites imposent l'un des deux.
 */
function isSameOrigin(request: Request): boolean {
  const allowed = new URL(siteUrl).origin
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  if (!origin && !referer) return true
  if (origin && origin !== allowed) return false
  if (referer && !referer.startsWith(allowed)) return false
  return true
}

async function requireAdminRequest(request: Request): Promise<string | null> {
  const adminEmail = await requireAdminEmail()
  if (!adminEmail) return null
  if (!isSameOrigin(request)) return null
  return adminEmail
}

/** Accès typé minimal à `p1_webhook_events` (table P1, migration non appliquée). */
function journalAdminTable(supabase: ReturnType<typeof createServiceRoleClient>) {
  return supabase.from('p1_webhook_events' as never) as unknown as {
    select: (columns: string) => {
      order: (
        column: string,
        opts: { ascending: boolean }
      ) => {
        limit: (
          count: number
        ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
        eq: (
          column: string,
          value: string
        ) => {
          limit: (
            count: number
          ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
        }
      }
      eq: (
        column: string,
        value: string
      ) => {
        maybeSingle: () => Promise<{
          data: Record<string, unknown> | null
          error: { message: string } | null
        }>
      }
    }
    update: (patch: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

export async function GET(request: Request) {
  const adminEmail = await requireAdminRequest(request)
  if (!adminEmail) {
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const requestedLimit = Number(url.searchParams.get('limit') ?? 100)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100

  try {
    const supabase = createServiceRoleClient()
    const ordered = journalAdminTable(supabase)
      .select('*')
      .order('received_at', { ascending: false })

    const { data, error } = status
      ? await ordered.eq('received_status', status).limit(limit)
      : await ordered.limit(limit)

    if (error) {
      console.error('[webhook-admin] journal read error', { error })
      return NextResponse.json({ message: 'Erreur lecture du journal.' }, { status: 500 })
    }
    return NextResponse.json({ events: data ?? [] })
  } catch (err) {
    console.error('[webhook-admin] unexpected error', { err })
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 })
  }
}

const replaySchema = z.object({
  eventId: z.string().uuid(),
  /** force=true : re-traite même un événement déjà `processed` (après correction manuelle). */
  force: z.boolean().optional(),
})

export async function POST(request: Request) {
  const adminEmail = await requireAdminRequest(request)
  if (!adminEmail) {
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 401 })
  }

  let parsed: { eventId: string; force: boolean }
  try {
    const body = await request.json()
    const result = replaySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: 'Paramètres invalides.' }, { status: 400 })
    }
    parsed = { eventId: result.data.eventId, force: result.data.force ?? false }
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: row, error: readError } = await journalAdminTable(supabase)
      .select('*')
      .eq('id', parsed.eventId)
      .maybeSingle()

    if (readError || !row) {
      return NextResponse.json({ message: 'Événement introuvable.' }, { status: 404 })
    }

    if (parsed.force) {
      const { error: unlockError } = await journalAdminTable(supabase)
        .update({
          received_status: 'received',
          outcome: null,
          note: 'replay_requested',
          processed_at: null,
        })
        .eq('id', parsed.eventId)
      if (unlockError) {
        return NextResponse.json({ message: 'Impossible de réarmer l’événement.' }, { status: 500 })
      }
    }

    // Rejeu par le pipeline officiel (HMAC + journal + CAS + idempotence).
    const headers = new Headers({ 'content-type': 'application/json' })
    if (typeof row.signature === 'string' && row.signature) {
      headers.set('x-ccp-signature', row.signature)
    }
    const body =
      typeof row.raw_body === 'string' ? row.raw_body : JSON.stringify(row.raw_body ?? {})
    const replayRequest = new Request(`${siteUrl}/api/payment/webhook`, {
      method: 'POST',
      headers,
      body,
    })
    const res = await processWebhook(replayRequest)
    const result = await res.json().catch(() => null)
    return NextResponse.json({ replayed: true, httpStatus: res.status, result })
  } catch (err) {
    console.error('[webhook-admin] replay error', { eventId: parsed.eventId, err })
    return NextResponse.json({ message: 'Erreur lors du rejeu.' }, { status: 500 })
  }
}
