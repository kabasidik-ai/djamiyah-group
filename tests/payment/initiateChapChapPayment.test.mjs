import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initiateChapChapPayment } from '../../src/lib/initiateChapChapPayment.ts'

/**
 * Tests unitaires + intégration simulée du noyau d'initialisation du paiement.
 *
 * - Aucun appel réseau réel : `fetchImpl` est injecté (mock).
 * - Aucune écriture en base : `supabase` est un double (from/select/eq/single
 *   et update/eq uniquement).
 *
 * Couverture demandée (correction P1) :
 *   - Hôtel Maison Blanche → MB
 *   - Hôtel Rama → RA
 *   - référence falsifiée fournie par le navigateur → ignorée
 *   - réservation introuvable → reservation_not_found (404)
 *   - accès non autorisé → diagnostic (contrôle de possession absent à ce jour)
 *   - cas prestataire : 5xx, réponse sans payment_url, timeout, erreur réseau
 */

// ── Doubles ────────────────────────────────────────────────────────────────────

/** Réservation de base (Maison Blanche, comme écrite par la RPC reserve_room). */
function makeReservation(overrides = {}) {
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

function fakeSupabase({ singleResult, updateError = null, failUpdateAt = null }) {
  const calls = { singles: 0, updates: [] }
  let updateIndex = 0
  const from = () => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          calls.singles += 1
          return singleResult
        },
      }),
    }),
    update: (payload) => ({
      eq: () => {
        updateIndex += 1
        calls.updates.push(payload)
        if (failUpdateAt !== null && updateIndex === failUpdateAt) {
          return Promise.resolve({ error: { message: 'forced_update_failure' } })
        }
        return Promise.resolve({ error: updateError })
      },
    }),
  })
  return { from, calls }
}

/** `fetchImpl` simulée de ChapChap : capture l'appel et répond de manière fixe. */
function mockChapChapFetch({
  respond = () =>
    new Response(JSON.stringify({ payment_url: 'https://pay.test/checkout-123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
} = {}) {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    return respond(url, init)
  }
  return { calls, fetchImpl }
}

function makeInput(overrides = {}) {
  return {
    reservationId: 'def67890-1234-4abc-9012-abcdef123456',
    customerName: 'Aïcha Diallo',
    customerEmail: 'aicha@example.com',
    roomName: 'Suite Prestige',
    // Valeur fournie par l'ancien client ; doit être IGNORÉE par le noyau (P1).
    bookingReference: 'MB-DEF67890',
    ...overrides,
  }
}

function makeDeps({ supabase, fetchImpl, ...overrides } = {}) {
  return {
    apiKey: 'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef5600',
    baseUrl: 'https://chapchappay.com/api',
    urls: {
      notifyUrl: 'https://djamiyahgroup.com/api/payment/webhook',
      returnUrl:
        'https://djamiyahgroup.com/reservation/success?reservation_id=def67890-1234-4abc-9012-abcdef123456',
      cancelUrl: 'https://djamiyahgroup.com/reservation',
    },
    supabase,
    fetchImpl,
    ...overrides,
  }
}

/** Récupère le payload réellement envoyé au prestataire. */
function providerPayload(calls) {
  assert.equal(calls.length, 1, 'une seule requête prestataire attendue')
  return {
    url: calls[0].url,
    init: calls[0].init,
    body: JSON.parse(String(calls[0].init.body)),
  }
}

// ── Tests : références canoniques MB / RA ───────────────────────────────────────

test('Hôtel Maison Blanche → order_id MB-<8 premiers hex de l’UUID>', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'ok')
  if (result.kind !== 'ok') return

  assert.equal(result.orderId, 'MB-DEF67890')
  assert.equal(result.paymentUrl, 'https://pay.test/checkout-123')

  const sent = providerPayload(calls)
  assert.ok(sent.url.endsWith('/ecommerce/operation'), 'URL de création ChapChap (guide)')
  assert.equal(sent.body.order_id, 'MB-DEF67890')
  assert.equal(sent.body.amount, 1_500_000, 'montant serveur (source de vérité)')
  assert.equal(sent.body.metadata?.reservation_id, makeInput().reservationId)
  assert.equal(sent.body.metadata?.reservation_type, 'room')
  assert.equal(sent.body.callback_url, makeDeps().urls.notifyUrl, 'champ callback_url (guide)')
  assert.equal(supabase.calls.singles, 1)
  assert.deepEqual(supabase.calls.updates[0], { payment_status: 'pending' })
  // Persistance de la corrélation P1 : l’order serveur est mémorisé.
  assert.deepEqual(supabase.calls.updates[1], { chapchap_order_id: 'MB-DEF67890' })
})

test('Hôtel Rama → order_id RA-<8 premiers hex de l’UUID>', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  const reservation = makeReservation({
    id: 'abc12345-6789-4def-9012-abcdef123456',
    hotel_name: 'Hôtel Rama',
  })
  const supabase = fakeSupabase({ singleResult: { data: reservation, error: null } })

  const result = await initiateChapChapPayment(
    makeInput({ reservationId: reservation.id }),
    makeDeps({ supabase, fetchImpl })
  )

  assert.equal(result.kind, 'ok')
  if (result.kind !== 'ok') return
  assert.equal(result.orderId, 'RA-ABC12345')
  assert.equal(providerPayload(calls).body.order_id, 'RA-ABC12345')
})

// ── Test : référence falsifiée par le navigateur ────────────────────────────────

test('référence falsifiée fournie par le navigateur → ignorée (commande serveur)', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  // La réservation est à l’Hôtel Maison Blanche ; le client tente RA-HACKED1.
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(
    makeInput({ bookingReference: 'RA-HACKED1' }),
    makeDeps({ supabase, fetchImpl })
  )

  assert.equal(result.kind, 'ok')
  if (result.kind !== 'ok') return
  assert.equal(result.orderId, 'MB-DEF67890', 'la référence client doit être ignorée')
  assert.notEqual(result.orderId, 'RA-HACKED1')
  assert.equal(providerPayload(calls).body.order_id, 'MB-DEF67890')
})

// ── Test : réservation introuvable ──────────────────────────────────────────────

test('réponse prestataire 302 → provider_redirect (POST jamais converti en GET), logs assainis', async () => {
  const originalError = console.error
  const logged = []
  console.error = (...args) => logged.push(args)
  try {
    const { calls, fetchImpl } = mockChapChapFetch({
      respond: () =>
        new Response(null, {
          status: 302,
          headers: { location: '/ecommerce/redirect?token=SECRET_DO_NOT_LOG' },
        }),
    })
    const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

    const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

    // 1) REDIRECT MANUEL : fetch ne doit JAMAIS suivre (pas de GET → pas de 405).
    assert.equal(calls[0].init.redirect, 'manual', 'redirection prestataire non suivie')
    // 2) La redirection est exposée sans créer d’opération supplémentaire.
    assert.equal(result.kind, 'provider_redirect')
    if (result.kind !== 'provider_redirect') return
    assert.equal(result.status, 302)
    assert.equal(result.location, '/ecommerce/redirect?token=SECRET_DO_NOT_LOG')
    assert.equal(result.allow, null)
    assert.equal(result.orderId, 'MB-DEF67890')
    assert.equal(calls.length, 1, 'une seule requête ; aucune répétition en GET')
    // 3) LOGS SÉCURISÉS : statut, domaine, chemin — JAMAIS de jeton/query.
    const logLine = logged.find((l) => String(l[0]).includes('POST→GET évité'))
    assert.ok(logLine, 'redirection journalisée')
    const meta = logLine[1]
    assert.equal(meta.status, 302)
    assert.equal(meta.location, 'chapchappay.com/ecommerce/redirect', 'domaine+chemin uniquement')
    // Response simulée sans .url → null (en réel : domaine+chemin, jamais la query)
    assert.ok(meta.url === null || !meta.url.includes('SECRET_DO_NOT_LOG'))
    assert.ok(!JSON.stringify(meta).includes('SECRET_DO_NOT_LOG'), 'aucun jeton/query dans le log')
  } finally {
    console.error = originalError
  }
})

test('réservation introuvable → reservation_not_found (404), pas d’appel prestataire', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({
    singleResult: { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } },
  })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'reservation_not_found')
  assert.equal(calls.length, 0, 'aucun appel ChapChap si réservation absente')
  assert.equal(supabase.calls.updates.length, 0, 'aucune écriture si réservation absente')
})

// ── Test : accès non autorisé — diagnostic (pas de contrôle de possession) ─────

test('diagnostic : la connaissance du seul UUID suffit à initier (contrôle de possession absent)', async () => {
  // NOTE — CONTRAT ACTUEL, PAS UNE GARANTIE DE SÉCURITÉ.
  // Aucun mécanisme d’authentification/possession n’existe sur le parcours : un
  // demandeur disposant de l’UUID d’une réservation peut en initier le paiement.
  // P1 (référence serveur) ne crée volontairement AUCUN faux contrôle à base de
  // données navigateur (email, nom…). La solution sûre (claim code dérivé d’un
  // secret serveur, voir rapport) fera échouer ce test une fois mise en œuvre —
  // ce test documente la bascule attendue.
  const { fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(
    makeInput({ bookingReference: undefined, customerEmail: 'attaquant@example.com' }),
    makeDeps({ supabase, fetchImpl })
  )

  assert.equal(result.kind, 'ok', 'comportement actuel : initié sans preuve de possession')
})

// ── Tests : éligibilité (garde-fous existants) ──────────────────────────────────

test('réservation déjà payée → refusée (409, pas de double paiement)', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({
    singleResult: { data: makeReservation({ payment_status: 'paid' }), error: null },
  })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'eligibility_error')
  if (result.kind !== 'eligibility_error') return
  assert.equal(result.code, 409)
  assert.match(result.message, /déjà payée/)
  assert.equal(calls.length, 0, 'aucun appel ChapChap si déjà payée')
})

test('réservation annulée → refusée (409)', async () => {
  const { fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({
    singleResult: { data: makeReservation({ status: 'cancelled' }), error: null },
  })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'eligibility_error')
  if (result.kind !== 'eligibility_error') return
  assert.equal(result.code, 409)
  assert.match(result.message, /annulée/)
})

test('montant invalide (0) → refusé (400)', async () => {
  const { fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({
    singleResult: { data: makeReservation({ total_price: 0 }), error: null },
  })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'eligibility_error')
  if (result.kind !== 'eligibility_error') return
  assert.equal(result.code, 400)
})

test('paymentMethod orange_money → pré-écrit sur la réservation', async () => {
  const { fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(
    makeInput({ paymentMethod: 'orange_money' }),
    makeDeps({ supabase, fetchImpl })
  )

  assert.equal(result.kind, 'ok')
  if (result.kind !== 'ok') return
  assert.deepEqual(supabase.calls.updates[0], {
    payment_status: 'pending',
    payment_method: 'orange_money',
  })
})

test("échec de la pré-écriture de statut → toléré, l'appel prestataire a lieu (comportement historique)", async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  // Seule la 1re écriture (pré-écriture payment_status) échoue ; la persistance
  // de corrélation (2e) réussit — le flux n'est pas bloqué.
  const supabase = fakeSupabase({
    singleResult: { data: makeReservation(), error: null },
    failUpdateAt: 1,
  })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'ok', 'l’échec de la pré-écriture ne bloque pas le flux historique')
  assert.equal(calls.length, 1)
})

// ── Tests : comportement face aux réponses prestataire ───────────────────────────

test('réponse prestataire 500 → provider_error (502 côté API)', async () => {
  const { fetchImpl } = mockChapChapFetch({
    respond: () => new Response('{"error":"boom"}', { status: 500 }),
  })
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'provider_error')
  if (result.kind !== 'provider_error') return
  assert.equal(result.status, 500)
  assert.equal(result.orderId, 'MB-DEF67890')
})

test('réponse prestataire 200 sans payment_url → missing_checkout_url (502 côté API)', async () => {
  const { fetchImpl } = mockChapChapFetch({
    respond: () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  })
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'missing_checkout_url')
  if (result.kind !== 'missing_checkout_url') return
  assert.equal(result.orderId, 'MB-DEF67890')
})

test('persistance de corrélation en échec → persistence_error (URL jamais exposée)', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  // 1er update (pré-écriture) toléré ; 2e (persistance chapchap_order_id) échoue.
  const supabase = fakeSupabase({
    singleResult: { data: makeReservation(), error: null },
    failUpdateAt: 2,
  })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'persistence_error')
  if (result.kind !== 'persistence_error') return
  assert.equal(result.orderId, 'MB-DEF67890')
  assert.equal(calls.length, 1, 'le create prestataire a eu lieu (opération réelle)')
  assert.notEqual(result.kind, 'ok', "aucun paymentUrl n'est exposé")
})

test('timeout prestataire (AbortError) → provider_timeout (504 côté API)', async () => {
  const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
  const { calls, fetchImpl } = mockChapChapFetch({ respond: () => Promise.reject(abortError) })
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'provider_timeout')
  assert.equal(calls.length, 1)
})

test('erreur réseau (TypeError) → internal_error (500 côté API)', async () => {
  const { fetchImpl } = mockChapChapFetch({
    respond: () => Promise.reject(new TypeError('fetch failed')),
  })
  const supabase = fakeSupabase({ singleResult: { data: makeReservation(), error: null } })

  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))

  assert.equal(result.kind, 'internal_error')
})

test('ligne absente (PGRST116) → reservation_not_found, aucun appel prestataire', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({
    singleResult: { data: null, error: { message: 'No rows found', code: 'PGRST116' } },
  })
  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))
  assert.equal(result.kind, 'reservation_not_found')
  assert.equal(calls.length, 0)
})

test('erreur de lecture Supabase (ex. 401 JWT) → reservation_read_error, JAMAIS not_found', async () => {
  const { calls, fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({
    singleResult: { data: null, error: { message: 'Invalid JWT: unable to parse', code: 'PGRST301' } },
  })
  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))
  assert.equal(result.kind, 'reservation_read_error')
  assert.equal(calls.length, 0, 'aucun appel prestataire en cas de défaillance de lecture')
})

test("lecture sans erreur mais data nulle (défensif) → reservation_not_found", async () => {
  const { fetchImpl } = mockChapChapFetch()
  const supabase = fakeSupabase({ singleResult: { data: null, error: null } })
  const result = await initiateChapChapPayment(makeInput(), makeDeps({ supabase, fetchImpl }))
  assert.equal(result.kind, 'reservation_not_found')
})

