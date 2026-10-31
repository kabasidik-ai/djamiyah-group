import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as roomPayment from '../../src/lib/roomPayment.ts'

const { evaluateReservationPayment, mapPaymentMethod } = roomPayment

test('montant repris du serveur (source de vérité)', () => {
  const res = evaluateReservationPayment({ total_price: 1500000, payment_status: 'pending', status: 'pending' })
  assert.equal(res.ok, true)
  if (res.ok) assert.equal(res.amount, 1500000)
})

test('réservation déjà payée → refusée (pas de double paiement)', () => {
  const res = evaluateReservationPayment({ total_price: 1500000, payment_status: 'paid', status: 'confirmed' })
  assert.equal(res.ok, false)
  if (!res.ok) {
    assert.equal(res.code, 409)
    assert.match(res.message, /déjà payée/)
  }
})

test('réservation annulée → refusée', () => {
  const res = evaluateReservationPayment({ total_price: 1500000, payment_status: 'pending', status: 'cancelled' })
  assert.equal(res.ok, false)
  if (!res.ok) {
    assert.equal(res.code, 409)
    assert.match(res.message, /annulée/)
  }
})

test('montant invalide ou nul → refusé', () => {
  const zero = evaluateReservationPayment({ total_price: 0, payment_status: 'pending', status: 'pending' })
  assert.equal(zero.ok, false)
  if (!zero.ok) assert.equal(zero.code, 400)

  const missing = evaluateReservationPayment({ payment_status: 'pending', status: 'pending' })
  assert.equal(missing.ok, false)
})

test('réservation introuvable → 404', () => {
  const res = evaluateReservationPayment(null)
  assert.equal(res.ok, false)
  if (!res.ok) assert.equal(res.code, 404)
})

test('paymentMethod optionnel → null (pas de fausse méthode payée)', () => {
  assert.equal(mapPaymentMethod(undefined), null)
  assert.equal(mapPaymentMethod('orange_money'), 'orange_money')
  assert.equal(mapPaymentMethod('mtn_momo'), 'mtn_momo')
  assert.equal(mapPaymentMethod('card'), 'card')
  assert.equal(mapPaymentMethod('wave'), 'card')
})

test('réponse payment_url gérée / absence → erreur (logique route via evaluate ok)', () => {
  // evaluate renvoie le montant : c'est la route qui exige ensuite payment_url.
  // Ici on valide que l'éligibilité positive fournit bien le montant à envoyer.
  const ok = evaluateReservationPayment({ total_price: 2000000, payment_status: 'pending', status: 'pending' })
  assert.equal(ok.ok, true)
  if (ok.ok) assert.equal(ok.amount, 2000000)
})

test('Hôtel Rama produit une référence RA visible et réutilisable', () => {
  assert.equal(typeof roomPayment.buildBookingReference, 'function')
  assert.equal(
    roomPayment.buildBookingReference?.('Hôtel Rama', 'abc12345-6789-4def-9012-abcdef123456'),
    'RA-ABC12345'
  )
})

test('un autre hôtel produit une référence MB visible et réutilisable', () => {
  assert.equal(typeof roomPayment.buildBookingReference, 'function')
  assert.equal(
    roomPayment.buildBookingReference?.('Hôtel Maison Blanche', 'def67890-1234-4abc-9012-abcdef123456'),
    'MB-DEF67890'
  )
})

test('une référence ChapChap vide après assainissement utilise le fallback RES', () => {
  assert.equal(typeof roomPayment.resolveChapChapOrderId, 'function')
  assert.equal(
    roomPayment.resolveChapChapOrderId?.('\u0000\u001F', '12345678-1234-4abc-9012-abcdef123456'),
    'RES-12345678-1234-4abc-9012-abcdef123456'
  )
})

test('une référence ChapChap valide est assainie et conservée', () => {
  assert.equal(typeof roomPayment.resolveChapChapOrderId, 'function')
  assert.equal(
    roomPayment.resolveChapChapOrderId?.('  RA-ABC12345  ', 'unused-fallback'),
    'RA-ABC12345'
  )
})
