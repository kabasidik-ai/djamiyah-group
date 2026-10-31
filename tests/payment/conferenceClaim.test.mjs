import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import path from 'node:path'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '../..')
const id = 'def67890-1234-4abc-9012-abcdef123456'
const other = '11111111-2222-4333-8444-555555555555'
const secret = 'isolated-conference-test-secret-only'

// Execute the actual route handlers with isolated environment variables and
// in-memory service doubles. No network or database connection is possible.
function harness(configuredSecret = secret) {
  const calls = { database: 0, provider: 0, creation: 0 }
  const env = { RESERVATION_CLAIM_SECRET: configuredSecret, CHAPCHAP_API_KEY_TEST: 'test-only' }
  const json = (body, init = {}) => Response.json(body, init)
  const row = {
    id,
    total_price: 1000000,
    currency: 'GNF',
    status: 'confirmed',
    payment_status: 'pending',
  }
  const chain = {
    select() {
      return this
    },
    eq() {
      return this
    },
    single: async () => ({ data: row, error: null }),
  }
  const mocks = {
    'next/server': { NextResponse: { json } },
    '@/lib/supabase': {
      isSupabaseServiceConfigured: () => true,
      createServiceRoleClient: () => {
        calls.database++
        return { from: () => chain }
      },
    },
    '@/lib/conferenceReservations': {
      ConferenceReservationError: class extends Error {},
      createConferenceReservation: async () => {
        calls.creation++
        return { reservation: row, room: {} }
      },
    },
    '@/lib/chapchap': {
      checkRateLimit: () => ({ allowed: true }),
      ensureSameOrigin: () => true,
      getClientIp: () => 'local-test',
      sanitizeText: (s) => s,
      secureJson: (body, _site, init) => json(body, init),
      fetchWithTimeout: async () => {
        calls.provider++
        return Response.json({ payment_url: 'https://checkout.invalid/test' })
      },
    },
  }
  const cache = new Map()
  function load(relative) {
    const file = path.join(root, relative)
    if (cache.has(file)) return cache.get(file).exports
    const compiledModule = { exports: {} }
    cache.set(file, compiledModule)
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    })
    runInNewContext(
      outputText,
      {
        module: compiledModule,
        exports: compiledModule.exports,
        require: (name) =>
          mocks[name] ?? (name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name)),
        process: { env },
        Buffer,
        Headers,
        Response,
        URL,
        console,
        crypto: globalThis.crypto,
      },
      { filename: file }
    )
    return compiledModule.exports
  }
  return { load, calls }
}

for (const route of ['status', 'pay']) {
  for (const scenario of ['absent', 'invalid', 'other reservation', 'missing secret', 'valid']) {
    test(`conference ${route}: ${scenario}`, async () => {
      const isolated = harness(scenario === 'missing secret' ? null : secret)
      const claim = isolated.load('src/lib/reservationClaim.ts')
      const token =
        scenario === 'absent'
          ? null
          : scenario === 'invalid'
            ? 'f'.repeat(64)
            : claim.issueReservationClaim(scenario === 'other reservation' ? other : id, secret)
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Reservation-Claim': token } : {}),
      }
      const request = new Request(
        `https://example.invalid/api/conference-reservations/${route}?id=${id}`,
        {
          headers,
          ...(route === 'pay'
            ? { method: 'POST', body: JSON.stringify({ conferenceReservationId: id }) }
            : {}),
        }
      )
      const handler = isolated.load(`src/app/api/conference-reservations/${route}/route.ts`)
      const response = await handler[route === 'pay' ? 'POST' : 'GET'](request)
      assert.equal(
        response.status,
        scenario === 'valid' ? 200 : scenario === 'missing secret' ? 503 : 401
      )
      assert.equal(isolated.calls.database, scenario === 'valid' ? 1 : 0)
      assert.equal(isolated.calls.provider, scenario === 'valid' && route === 'pay' ? 1 : 0)
    })
  }
}

const creationBody = {
  conferenceRoomId: id,
  eventDate: '2099-01-01',
  participants: 10,
  firstName: 'Test',
  lastName: 'Local',
  email: 'test@example.invalid',
  phone: '12345678',
  eventType: 'meeting',
}
test('conference creation: missing secret prevents any database write', async () => {
  const h = harness(null)
  const response = await h
    .load('src/app/api/conference-reservations/route.ts')
    .POST(
      new Request('https://example.invalid', { method: 'POST', body: JSON.stringify(creationBody) })
    )
  assert.equal(response.status, 503)
  assert.equal(h.calls.database, 0)
  assert.equal(h.calls.creation, 0)
})

test('conference creation: issues a token accepted by both protected routes', async () => {
  const h = harness()
  const response = await h
    .load('src/app/api/conference-reservations/route.ts')
    .POST(
      new Request('https://example.invalid', { method: 'POST', body: JSON.stringify(creationBody) })
    )
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(result.reservationId, id)
  const claim = h.load('src/lib/reservationClaim.ts')
  assert.equal(claim.verifyReservationClaim(id, result.claimToken, secret), true)
  assert.equal(h.calls.creation, 1)
})

// Exercise the form's real event handlers with an isolated hook store and
// browser doubles; no DOM, HTTP request or checkout navigation is performed.
for (const storageBlocked of [false, true]) {
  test(`conference browser: storage ${storageBlocked ? 'blocked prevents payment' : 'persists token before checkout'}`, async () => {
    const state = []
    let cursor = 0
    const storage = new Map()
    const requests = []
    const token = 'a'.repeat(64)
    const window = { location: { href: '' } }
    const hooks = {
      useEffect() {},
      useMemo: (fn) => fn(),
      useState: (initial) => {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [
          state[index],
          (value) => {
            state[index] = typeof value === 'function' ? value(state[index]) : value
          },
        ]
      },
    }
    const compiledModule = { exports: {} }
    const source = readFileSync(
      path.join(root, 'src/components/reservation/ConferenceReservationForm.tsx'),
      'utf8'
    )
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    })
    runInNewContext(outputText, {
      module: compiledModule,
      exports: compiledModule.exports,
      require: (name) => (name === 'react' ? hooks : require(name)),
      window,
      console,
      sessionStorage: {
        setItem(key, value) {
          if (storageBlocked) throw new Error('blocked')
          storage.set(key, value)
        },
      },
      fetch: async (url, init) => {
        requests.push({ url, init })
        return Response.json(
          url.endsWith('/pay')
            ? { payment_url: 'https://checkout.invalid' }
            : {
                reservationId: id,
                claimToken: token,
                totalPrice: 1000000,
              }
        )
      },
    })
    function render() {
      cursor = 0
      return compiledModule.exports.default()
    }
    function find(element, predicate) {
      if (!element || typeof element !== 'object') return null
      if (predicate(element)) return element
      for (const child of [element.props?.children].flat(Infinity)) {
        const result = find(child, predicate)
        if (result) return result
      }
      return null
    }
    await find(render(), (e) => e.type === 'form').props.onSubmit({ preventDefault() {} })
    const payment = find(
      render(),
      (e) => e.type === 'button' && e.props.onClick?.name === 'handlePayment'
    )
    assert.ok(payment)
    await payment.props.onClick()
    if (storageBlocked) {
      assert.equal(requests.length, 1)
      assert.equal(window.location.href, '')
    } else {
      assert.equal(storage.get(`djamiyah.claim.${id}`), token)
      assert.equal(requests[1].init.headers['X-Reservation-Claim'], token)
      assert.equal(window.location.href, 'https://checkout.invalid')
      assert.ok(!requests[1].init.body.includes(token))
    }
  })
}
