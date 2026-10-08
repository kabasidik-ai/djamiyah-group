// ============================================================
// Tests unitaires — Schéma & modèle GroupRequest
//
// Le schéma est importé en chemin RELATIF afin d'éviter l'alias
// `@/` que le test runner Node ne résout pas (--experimental-strip-types).
// Les salles proviennent de src/data/rooms.ts (module sans alias),
// afin de ne pas dupliquer les données ni reposer sur content.ts.
// ============================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  groupRequestSchema,
  GROUP_EVENT_TYPES,
  MEAL_TYPES,
  SERVICE_STYLES,
} from '../../src/lib/schemas/groupRequest.ts'

function validBase(overrides = {}) {
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
    catering: {
      mealType: 'mixed',
      serviceStyle: 'buffet',
    },
    ...overrides,
  }
}

test('types d’événements autorisés (parcours public)', () => {
  const allowed = ['seminar', 'conference', 'training', 'meeting', 'professional_group', 'other']
  assert.deepEqual([...GROUP_EVENT_TYPES], allowed)

  for (const type of allowed) {
    const res = groupRequestSchema.safeParse(validBase({ event: { ...validBase().event, type } }))
    assert.equal(res.success, true, `le type ${type} doit être accepté`)
  }
})

test('rejet de la valeur appel d’offres (`tender` / `appel_offres`)', () => {
  for (const rejected of ['tender', 'appel_offres']) {
    const res = groupRequestSchema.safeParse(
      validBase({ event: { ...validBase().event, type: rejected } })
    )
    assert.equal(res.success, false, `la valeur ${rejected} doit être rejetée`)
  }
  assert.equal(GROUP_EVENT_TYPES.includes('tender'), false)
})

test('dates incohérentes (fin antérieure au début) refusées', () => {
  const res = groupRequestSchema.safeParse(
    validBase({
      event: { ...validBase().event, startDate: '2026-10-12', endDate: '2026-10-10' },
    })
  )
  assert.equal(res.success, false)
  if (!res.success) {
    const issues = res.error.issues
    assert.ok(issues.some((i) => i.path.join('.') === 'event.endDate'))
  }
test('hébergement conditionnel : requis uniquement si demandé', () => {
  const notRequested = groupRequestSchema.safeParse(
    validBase({ accommodation: { requested: false } })
  )
  assert.equal(notRequested.success, true)

  const incomplete = groupRequestSchema.safeParse(
    validBase({ accommodation: { requested: true } })
  )
  assert.equal(incomplete.success, false)

  const complete = groupRequestSchema.safeParse(
    validBase({
      accommodation: {
        requested: true,
        arrival: '2026-10-10',
        departure: '2026-10-12',
        roomQuantities: [{ type: 'Chambre Confort', count: 2 }],
        hostedPeople: 2,
      },
    })
  )
  assert.equal(complete.success, true)

  const badOrder = groupRequestSchema.safeParse(
    validBase({
      accommodation: {
        requested: true,
        arrival: '2026-10-12',
        departure: '2026-10-10',
        roomQuantities: [{ type: 'Chambre Confort', count: 1 }],
        hostedPeople: 1,
      },
    })
  )
  assert.equal(badOrder.success, false)
})

test('pauses et couverts conditionnels', () => {
  const bad = groupRequestSchema.safeParse(
    validBase({
      catering: {
        morningBreak: { requested: true, time: '', covers: '' },
      },
    })
  )
  assert.equal(bad.success, false)
  if (!bad.success) {
    const paths = bad.error.issues.map((i) => i.path.join('.'))
    assert.ok(paths.includes('catering.morningBreak.time'))
    assert.ok(paths.includes('catering.morningBreak.covers'))
  }

  const ok = groupRequestSchema.safeParse(
    validBase({
      catering: {
        morningBreak: { requested: true, time: '09:00', covers: 15 },
        lunch: { requested: false },
      },
    })
  )
  assert.equal(ok.success, true)

  const notRequested = groupRequestSchema.safeParse(
    validBase({ catering: { lunch: { requested: false } } })
  )
  assert.equal(notRequested.success, true)
})

test('absence des anciennes propriétés `tenderRequest` et `tenderDeadline`', () => {
  const res = groupRequestSchema.safeParse(validBase())
  assert.equal(res.success, true)
  const data = res.success ? res.data : {}
  assert.equal('tender' in data, false)
  assert.equal('tenderRequest' in data, false)
  assert.equal('tenderDeadline' in data, false)
  assert.equal('isTender' in data, false)
})

test('validation complète d’une demande de groupe', () => {
  const res = groupRequestSchema.safeParse(
    validBase({
      event: { ...validBase().event, type: 'conference', participants: 45 },
      accommodation: {
        requested: true,
        arrival: '2026-11-05',
        departure: '2026-11-07',
        roomQuantities: [
          { type: 'Chambre Confort', count: 10 },
          { type: 'Suite Premium', count: 2 },
        ],
        hostedPeople: 12,
      },
      catering: {
        morningBreak: { requested: true, time: '08:30', covers: 45 },
        lunch: { requested: true, time: '13:00', covers: 45 },
        afternoonBreak: { requested: false },
        mealType: 'african',
        serviceStyle: 'table_service',
        dietaryConstraints: 'Poulet uniquement',
      },
      comments: 'Besoin d’une salle équipée vidéoprojecteur.',
    })
  )
  assert.equal(res.success, true)
  if (res.success) {
    assert.equal(res.data.event.type, 'conference')
    assert.equal(res.data.accommodation.hostedPeople, 12)
    assert.equal(res.data.catering.mealType, 'african')
    assert.equal(res.data.catering.lunch.time, '13:00')
    assert.equal(GROUP_EVENT_TYPES.includes('tender'), false)
  }
})

test('jeux de valeurs référencés (repas / service) cohérents', () => {
  assert.deepEqual([...MEAL_TYPES], ['african', 'european', 'mixed', 'to_define'])
  assert.deepEqual([...SERVICE_STYLES], ['buffet', 'table_service', 'to_define'])
})
})