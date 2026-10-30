import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  checkReservationClaim,
  getReservationClaimSecret,
  issueReservationClaim,
  verifyReservationClaim,
} from '../../src/lib/reservationClaim.ts'

/**
 * Tests — Preuve de possession des réservations (HMAC serveur).
 * Le secret est injecté via `process.env.RESERVATION_CLAIM_SECRET` entre les
 * tests ; AUNCUNE valeur n'est affichée, aucun log.
 */

const RES_ID = 'def67890-1234-4abc-9012-abcdef123456'
const OTHER_ID = '11111111-2222-4333-8444-555555555555'
const SECRET = 'test-secret-djamiyah-claim-123456'

function withSecret(run) {
  const prev = process.env.RESERVATION_CLAIM_SECRET
  process.env.RESERVATION_CLAIM_SECRET = SECRET
  try {
    return run()
  } finally {
    if (prev === undefined) delete process.env.RESERVATION_CLAIM_SECRET
    else process.env.RESERVATION_CLAIM_SECRET = prev
  }
}

function headersWith(token) {
  return new Headers(token ? { 'x-reservation-claim': token } : {})
}

// ── Émission et vérification pures ──────────────────────────────────────────────

test('issue : jeton déterministe pour un UUID donné', () => {
  withSecret(() => {
    const a = issueReservationClaim(RES_ID, getReservationClaimSecret())
    const b = issueReservationClaim(RES_ID, getReservationClaimSecret())
    assert.equal(a, b)
    assert.match(a, /^[a-f0-9]{64}$/)
  })
})

test('verify : jeton valide → true', () => {
  withSecret(() => {
    const token = issueReservationClaim(RES_ID, SECRET)
    assert.equal(verifyReservationClaim(RES_ID, token, SECRET), true)
  })
})

test('verify : UUID différent (jeton d’une AUTRE réservation) → false', () => {
  withSecret(() => {
    const token = issueReservationClaim(RES_ID, SECRET)
    assert.equal(verifyReservationClaim(OTHER_ID, token, SECRET), false)
  })
})

test('verify : jeton falsifié / altéré → false', () => {
  withSecret(() => {
    const token = issueReservationClaim(RES_ID, SECRET)
    const flipped = token.startsWith('a') ? 'b' + token.slice(1) : 'a' + token.slice(1)
    assert.equal(verifyReservationClaim(RES_ID, flipped, SECRET), false)
    assert.equal(verifyReservationClaim(RES_ID, 'f'.repeat(64), SECRET), false)
  })
})

test('verify : formats invalides (courts, non hex, non string) → false sans exception', () => {
  withSecret(() => {
    assert.equal(verifyReservationClaim(RES_ID, null, SECRET), false)
    assert.equal(verifyReservationClaim(RES_ID, undefined, SECRET), false)
    assert.equal(verifyReservationClaim(RES_ID, '', SECRET), false)
    assert.equal(verifyReservationClaim(RES_ID, 'abcd', SECRET), false)
    assert.equal(verifyReservationClaim(RES_ID, 'ZZ'.repeat(32), SECRET), false)
  })
})

// ── Garde réutilisable des routes ───────────────────────────────────────────────

test('gard: UUID « volé » sans en-tête → 401', () => {
  withSecret(() => {
    const check = checkReservationClaim(headersWith(null), RES_ID)
    assert.deepEqual(check, { allow: false, status: 401 })
  })
})

test('gard: jeton absent → 401', () => {
  withSecret(() => {
    assert.deepEqual(checkReservationClaim(headersWith(null), RES_ID), {
      allow: false,
      status: 401,
    })
  })
})

test('gard: jeton falsifié → 401', () => {
  withSecret(() => {
    assert.deepEqual(checkReservationClaim(headersWith('f'.repeat(64)), RES_ID), {
      allow: false,
      status: 401,
    })
  })
})

test('gard: jeton valide pour une AUTRE réservation → 401', () => {
  withSecret(() => {
    const token = issueReservationClaim(OTHER_ID, SECRET)
    assert.deepEqual(checkReservationClaim(headersWith(token), RES_ID), {
      allow: false,
      status: 401,
    })
  })
})

test('gard: ancien client sans jeton (réservation antérieure) → 401 strict', () => {
  // Aucune période de grâce n'expose de données ; la récupération passe par un
  // canal vérifié (contact hôtel), jamais par une route publique.
  withSecret(() => {
    assert.deepEqual(checkReservationClaim(headersWith(null), RES_ID), {
      allow: false,
      status: 401,
    })
  })
})

test('gard: accès valide (jeton correct) → allow', () => {
  withSecret(() => {
    const token = issueReservationClaim(RES_ID, SECRET)
    assert.deepEqual(checkReservationClaim(headersWith(token), RES_ID), { allow: true })
  })
})

test('gard: secret serveur absent → 503 (échec fermé, aucune délivrance)', () => {
  // Supprime la variable : garde doit refuser (jamais dégrader).
  const prev = process.env.RESERVATION_CLAIM_SECRET
  delete process.env.RESERVATION_CLAIM_SECRET
  try {
    assert.equal(getReservationClaimSecret(), null)
    assert.deepEqual(checkReservationClaim(headersWith('f'.repeat(64)), RES_ID), {
      allow: false,
      status: 503,
    })
  } finally {
    if (prev !== undefined) process.env.RESERVATION_CLAIM_SECRET = prev
  }
})

test('gard: secret trop court → refusé (503)', () => {
  const prev = process.env.RESERVATION_CLAIM_SECRET
  process.env.RESERVATION_CLAIM_SECRET = 'short'
  try {
    assert.equal(checkReservationClaim(headersWith('f'.repeat(64)), RES_ID).allow, false)
  } finally {
    if (prev === undefined) delete process.env.RESERVATION_CLAIM_SECRET
    else process.env.RESERVATION_CLAIM_SECRET = prev
  }
})
