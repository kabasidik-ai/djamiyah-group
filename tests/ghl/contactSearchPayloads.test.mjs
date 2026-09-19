// ============================================================
// Tests — Helpers de recherche contact (aucun réseau).
// ============================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeContactEmail,
  normalizeContactPhone,
  buildContactSearchPayload,
  pickSingleContact,
  MultipleContactsError,
} from '../../src/lib/groups/groupGhlSync.ts'

const LOC = 'a5wcdv6hapHNnLA9xnl4'

test('normalisation email : minuscules + bornes', () => {
  assert.equal(normalizeContactEmail('  AWA@Exemple.COM '), 'awa@exemple.com')
  assert.equal(normalizeContactEmail(undefined), '')
})

test('normalisation téléphone : chiffres + `+`, espaces retirés', () => {
  assert.equal(normalizeContactPhone('+224 611 22 33 44'), '+224611223344')
  assert.equal(normalizeContactPhone('(+224) 611-22'), '+22461122')
})

test('payload recherche email (contrat v3)', () => {
  const p = buildContactSearchPayload('email', ' AWA@Exemple.COM ', LOC)
  assert.equal(p.locationId, LOC)
  assert.equal(p.pageLimit, 1)
  assert.equal(p.query, 'email:awa@exemple.com')
})

test('payload recherche téléphone (contrat v3)', () => {
  const p = buildContactSearchPayload('phone', '+224 61 22 33 44', LOC)
  assert.equal(p.query, 'phone:+22461223344')
  assert.ok(!('page' in p))
})

test('sélection déterministe : 0 → null, 1 → id, >1 → erreur contrôlée', () => {
  assert.equal(pickSingleContact([], 'crit'), null)
  assert.equal(pickSingleContact([{ id: 'a' }], 'crit')?.id, 'a')
  assert.throws(() => pickSingleContact([{ id: 'a' }, { id: 'b' }], 'crit'), MultipleContactsError)
})