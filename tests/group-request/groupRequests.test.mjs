// ============================================================
// Tests — API/service Groupes & Séminaires
//
// Le route handler Next POST /api/group-requests ne peut pas être
// importé directement dans le runner Node (alias `@/` + modules
// `next/*`). On teste donc :
//   - le cœur métier `submitGroupRequest` (validation, référence,
//     idempotence, erreurs contrôlées) avec une persistance factice ;
//   - des gardes statiques de sécurité (RLS, secret serveur, client
//     service_role) sur les fichiers réels.
// ============================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, extname } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { submitGroupRequest, GroupRequestError } from '../../src/lib/groupRequests.ts'

const __root = resolve(import.meta.dirname, '..', '..')

function validInput(overrides = {}) {
  return {
    source: 'site',
    establishment: 'maison-blanche-coyah',
    contact: {
      firstName: 'Awa',
      lastName: 'Diallo',
      jobTitle: 'Responsable RH',
      phone: '+224 611 22 33 44',
      email: 'awa@exemple.com',
      preferredChannel: 'email',
    },
    company: { name: 'Groupe Horizon' },
    event: {
      type: 'seminar',
      name: 'Séminaire annuel',
      startDate: '2026-10-10',
      endDate: '2026-10-11',
      flexibleDates: false,
      participants: 20,
      requestedRoom: 'Wonkifon',
      configuration: 'theatre',
    },
    accommodation: { requested: false },
    catering: { mealType: 'mixed', serviceStyle: 'buffet' },
    ...overrides,
  }
}

// Persistance factice simulant la contrainte unique sur idempotency_key.
function makePersistence(store = new Map()) {
  return {
    async insert(row) {
      const key = row.idempotency_key
      if (store.has(key)) return { data: null, error: { code: '23505' } }
      const rec = {
        id: randomUUID(),
        reference: row.reference,
        status: row.status,
        created_at: new Date().toISOString(),
      }
      store.set(key, rec)
      return { data: rec, error: null }
    },
    async findByKey(key) {
      const rec = store.get(key)
      return rec ? { reference: rec.reference, id: rec.id } : null
    },
  }
}

test('demande valide → création avec référence et clé d’idempotence', async () => {
  const persistence = makePersistence()
  const res = await submitGroupRequest(validInput(), persistence)

  assert.equal(res.reference.startsWith('GRP-'), true)
  assert.equal(/^[0-9a-f]{64}$/.test(res.idempotencyKey), true)
  assert.equal(res.establishment, 'maison-blanche-coyah')
  assert.equal(res.event.type, 'seminar')
})

test('référence et idempotence enregistrées dans la ligne insérée', async () => {
  let inserted = null
  const persistence = {
    async insert(row) {
      inserted = row
      return {
        data: { id: 'x', reference: row.reference, status: 'received', created_at: 'now' },
        error: null,
      }
    },
    async findByKey() {
      return null
    },
  }
  const res = await submitGroupRequest(validInput(), persistence)

  assert.equal(inserted.reference, res.reference)
  assert.equal(inserted.idempotency_key, res.idempotencyKey)
  assert.equal(inserted.status, 'received')
})

test('schéma invalide → erreur 400 contrôlée (INVALID)', async () => {
  const persistence = makePersistence()
  const bad = validInput()
  bad.event.name = ''

  await assert.rejects(submitGroupRequest(bad, persistence), (err) => {
    assert.ok(err instanceof GroupRequestError)
    assert.equal(err.code, 'INVALID')
    assert.equal(err.status, 400)
    return true
  })
})

test('type d’événement non autorisé (`tender`) → 400', async () => {
  const persistence = makePersistence()
  const bad = validInput({ event: { ...validInput().event, type: 'tender' } })
  await assert.rejects(submitGroupRequest(bad, persistence), (err) => {
    assert.equal(err instanceof GroupRequestError && err.code, 'INVALID')
    return true
  })
})

test('même contenu envoyé deux fois → aucun doublon (idempotence)', async () => {
  const store = new Map()
  const persistence = makePersistence(store)

  const first = await submitGroupRequest(validInput(), persistence)
  const second = await submitGroupRequest(validInput(), persistence)

  // Même clé déterministe et même référence retournée : pas de doublon.
  assert.equal(first.idempotencyKey, second.idempotencyKey)
  assert.equal(first.reference, second.reference)
  assert.equal(store.size, 1)
  assert.equal(store.get(first.idempotencyKey).reference, first.reference)
})

test('échec Supabase → erreur contrôlée 500, sans fuite de détails internes', async () => {
  const persistence = {
    async insert() {
      return { data: null, error: { code: '42P01' } }
    },
    async findByKey() {
      return null
    },
  }
  await assert.rejects(submitGroupRequest(validInput(), persistence), (err) => {
    assert.ok(err instanceof GroupRequestError)
    assert.equal(err.code, 'DATABASE_ERROR')
    assert.equal(err.status, 500)
    // Le message ne révèle ni code SQL, ni détail interne.
    assert.equal(err.message.includes('42P01'), false)
    assert.equal(err.message.includes('stack'), false)
    return true
  })
})

test('corps non conforme (objet absent) → 400', async () => {
  const persistence = makePersistence()
  await assert.rejects(submitGroupRequest(undefined, persistence), (err) => {
    assert.equal(err instanceof GroupRequestError && err.status, 400)
    return true
  })
})

function listTsFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...listTsFiles(full))
    else if (extname(full) === '.ts' || extname(full) === '.tsx') out.push(full)
  }
  return out
}

test('aucun secret serveur dans le bundle client', () => {
  const clientDirs = [
    join(__root, 'src/app/[locale]'),
    join(__root, 'src/components'),
    join(__root, 'src/app/group-requests'), // n'existe pas (client)
  ].filter((d) => {
    try {
      return statSync(d).isDirectory()
    } catch {
      return false
    }
  })

  for (const dir of clientDirs) {
    for (const file of listTsFiles(dir)) {
      const content = readFileSync(file, 'utf8')
      assert.equal(
        content.includes('SUPABASE_SERVICE_ROLE_KEY'),
        false,
        `secret servi dans le client : ${file}`
      )
    }
  }
})

test('la route utilise un client serveur (service_role), pas le client anonyme', () => {
  const route = readFileSync(join(__root, 'src/app/api/group-requests/route.ts'), 'utf8')
  assert.equal(route.includes('createServiceRoleClient'), true)
  assert.equal(route.includes('createBrowserClient'), false)
})

test('la migration RLS refuse l’accès direct public', () => {
  const sql = readFileSync(
    join(__root, 'supabase/migrations/005_create_group_requests.sql'),
    'utf8'
  )
  // Aucune politique accordant des droits à anon/authenticated.
  assert.equal(sql.includes('to anon, authenticated'), false)
  assert.equal(/create policy[^;]*to authenticated/i.test(sql), false)
  // Le service_role conserve l'accès complet.
  assert.equal(sql.includes('to service_role'), true)
  assert.equal(sql.includes('enable row level security'), true)
})