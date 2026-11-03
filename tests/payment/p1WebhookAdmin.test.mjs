import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import path from 'node:path'
import ts from 'typescript'
import { createHmac } from 'node:crypto'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '../..')
const reservationId = '11111111-1111-4111-8111-111111111111'
const SECRET = 'local-secret'

function sign(raw, secret) {
  return createHmac('sha256', secret).update(raw).digest('hex')
}

function resolveSibling(abs, name) {
  if (!name.startsWith('.')) return null
  const base = path.resolve(path.dirname(abs), name)
  const cands = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
  const found = cands.find((c) => existsSync(c))
  return found ? path.relative(root, found) : null
}


function makeAdminHarness({ admin = true, origin = 'http://localhost:3000' } = {}) {
  const env = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    CHAPCHAP_HMAC_SECRET: SECRET,
  }
  const rows = {
    reservations: {
      [reservationId]: {
        id: reservationId,
        total_price: 1_520_000,
        currency: 'GNF',
        payment_status: 'pending',
        chapchap_transaction_id: null,
        chapchap_order_id: null,
      },
    },
  }
  const journal = { byKey: new Map(), byId: new Map(), seq: 0 }

  const mocks = {
    '@/lib/supabase': {
      createServerClient: async () => ({
        auth: {
          getUser: async () =>
            admin
              ? { data: { user: { email: 'admin@djamiyahgroup.com' } }, error: null }
              : { data: null, error: { message: 'unauthenticated' } },
        },
      }),
      createServiceRoleClient: () => dbLike(),
    },
    '@/lib/adminAuth': { isAdminEmail: (email) => email === 'admin@djamiyahgroup.com' },
    '@/lib/chapchap': {
      secureJson: (p, _s, init) => Response.json(p, init),
      verifyChapchapHmac: () => true,
    },
  }

  function dbLike() {
    const reservationSection = {
      select: () => ({
        eq: () => ({
          single: async () => {
            const row = rows.reservations[reservationId]
            return row ? { data: row, error: null } : { data: null, error: { message: 'not_found' } }
          },
        }),
      }),
      update(patch) {
        return {
          eq: async (_c, id) => {
            const row = rows.reservations[id]
            if (!row) return { error: { message: 'not_found' } }
            Object.assign(row, patch)
            return { error: null }
          },
        }
      },
    }
    return {
      rows,
      journal,
      from(table) {
        if (table === 'p1_webhook_events') {
          return {
            select() {
              return {
                order() {
                  return {
                    limit: async (n) => ({
                      data: [...journal.byId.values()].slice(0, n),
                      error: null,
                    }),
                    eq: (c, v) => ({
                      limit: async (n) => ({
                        data: [...journal.byId.values()].filter((r) => r[c] === v).slice(0, n),
                        error: null,
                      }),
                    }),
                  }
                },
                eq(column, value) {
                  return {
                    maybeSingle: async () => {
                      const row = [...journal.byId.values()].find((r) => r[column] === value)
                      return row ? { data: row, error: null } : { data: null, error: null }
                    },
                  }
                },
              }
            },
            insert(entry) {
              return {
                select() {
                  return {
                    single: async () => {
                      const existing = journal.byKey.get(entry.provider_event_key)
                      if (existing) return { data: existing, error: null }
                      journal.seq += 1
                      const row = { id: `jrn-${journal.seq}`, ...entry }
                      journal.byKey.set(entry.provider_event_key, row)
                      journal.byId.set(row.id, row)
                      return { data: row, error: null }
                    },
                  }
                },
              }
            },
            update(patch) {
              return {
                eq: async (_c, id) => {
                  const row = journal.byId.get(id)
                  if (!row) return { error: { message: 'not_found' } }
                  Object.assign(row, patch)
                  return { error: null }
                },
              }
            },
          }
        }
        return reservationSection
      },
    }
  }


  const cache = new Map()
  function compileTs(file) {
    const abs = path.join(root, file)
    if (cache.has(abs)) return cache.get(abs).exports
    const mod = { exports: {} }
    cache.set(abs, mod)
    const { outputText } = ts.transpileModule(readFileSync(abs, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    })
    runInNewContext(
      outputText,
      {
        module: mod,
        exports: mod.exports,
        require: (name) => {
          if (mocks[name]) return mocks[name]
          if (name.startsWith('@/')) return compileTs(`src/${name.slice(2)}.ts`)
          const sibling = resolveSibling(abs, name)
          if (sibling) return compileTs(sibling)
          return require(name)
        },
        process: { env },
        console,
        Buffer,
        URL,
        Headers,
        Request,
        Response,
        setTimeout,
        clearTimeout,
        crypto: globalThis.crypto,
      },
      { filename: abs }
    )
    return mod.exports
  }

  const request = (url, init = {}, headers = {}) =>
    new Request(`${env.NEXT_PUBLIC_SITE_URL}${url}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(origin ? { origin } : {}),
        ...headers,
      },
    })

  return { compileTs, request, rows, journal, env }
}

function seedAnomalyEvent(harness, payload) {
  const rawBody = JSON.stringify(payload)
  const signature = sign(rawBody, SECRET)
  const entry = {
    provider_event_key: payload.operation_id ?? payload.transaction_id,
    provider_operation_id: payload.operation_id ?? null,
    provider_request_id: null,
    order_id: payload.order_id ?? null,
    transaction_id: payload.transaction_id,
    reservation_type: 'room',
    reservation_id: reservationId,
    raw_status: payload.status,
    amount: payload.amount ?? null,
    currency: payload.currency ?? null,
    received_status: 'anomaly',
    outcome: 'reject:amount_mismatch',
    note: 'Integration test seed',
    raw_body: { ...payload, metadata: { reservation_type: 'room', reservation_id: reservationId } },
    signature,
  }
  harness.journal.seq += 1
  const row = { id: `aaaaaaaa-1111-4222-8333-${String(harness.journal.seq).padStart(12, '0')}`, ...entry }
  harness.journal.byKey.set(entry.provider_event_key, row)
  harness.journal.byId.set(row.id, row)
  return row
}

test('admin GET : sans session admin → 401', async () => {
  const h = makeAdminHarness({ admin: false })
  const handler = h.compileTs('src/app/api/payment/webhook-admin/route.ts')
  const res = await handler.GET(h.request('/api/payment/webhook-admin'))
  assert.equal(res.status, 401)
})

test('admin POST : même session admin mais origine différente → 401 (anti-CSRF)', async () => {
  const h = makeAdminHarness({ admin: true, origin: 'https://evil.example' })
  const handler = h.compileTs('src/app/api/payment/webhook-admin/route.ts')
  const res = await handler.POST(
    h.request('/api/payment/webhook-admin', { method: 'POST', body: JSON.stringify({ eventId: 'x' }) })
  )
  assert.equal(res.status, 401)
})

test('admin GET : session admin + même origine → liste du journal', async () => {
  const h = makeAdminHarness({ admin: true })
  seedAnomalyEvent(h, {
    status: 'success',
    reservation_id: reservationId,
    transaction_id: 'TX-LIST',
    amount: 42,
    currency: 'GNF',
  })
  const handler = h.compileTs('src/app/api/payment/webhook-admin/route.ts')
  const res = await handler.GET(h.request('/api/payment/webhook-admin?status=anomaly'))
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.ok(Array.isArray(body.events))
  assert.ok(body.events.length >= 1)
})

test('admin replay force : re-traite mais NE CONTOURNE PAS les contrôles (rejet conservé)', async () => {
  const h = makeAdminHarness({ admin: true })
  // Événement payé avec montant erroné → anomalie. Le rejeu forcé doit
  // re-passer par la vérification (montant = 42 ≠ 1_520_000) → jamais paid.
  const row = seedAnomalyEvent(h, {
    status: 'success',
    operation_id: 'OP-REJ',
    reservation_id: reservationId,
    transaction_id: 'TX-REJ',
    amount: 42,
    currency: 'GNF',
  })
  const handler = h.compileTs('src/app/api/payment/webhook-admin/route.ts')

  const res = await handler.POST(
    h.request('/api/payment/webhook-admin', {
      method: 'POST',
      body: JSON.stringify({ eventId: row.id, force: true }),
    })
  )
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.httpStatus, 202, 'le rejeu reste refusé (montant incohérent)')
  assert.equal(h.rows.reservations[reservationId].payment_status, 'pending')
  const j = h.journal.byId.get(row.id)
  assert.match(j.outcome, /reject:amount_mismatch/)
})
