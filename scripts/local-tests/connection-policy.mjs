import { createHmac } from 'node:crypto'

// Public fixture, never a production credential. Only for the disposable bench.
export const LOCAL_JWT_SECRET = 'p2-disposable-local-fixture-signing-key-not-for-production'
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role: 'service_role', iss: 'p2-local-tests', exp: 4102444800 })}`
export const LOCAL_SERVICE_KEY = `${unsigned}.${createHmac('sha256', LOCAL_JWT_SECRET).update(unsigned).digest('base64url')}`

const forbidden =
  /^(?:PG.*|DATABASE_URL|DIRECT_URL|POSTGRES.*|SUPABASE.*|NEXT_PUBLIC_SUPABASE.*|SERVICE_ROLE_KEY|API_URL)$/
function refuse() {
  throw new Error(
    'Local test connection refused: use only the documented P2_TEST_* configuration; no remote or production settings are allowed.'
  )
}

export function assertTestEnvironment(env) {
  if (env.NODE_ENV === 'production' || env.VERCEL_ENV || env.VERCEL || env.SUPABASE_ACCESS_TOKEN)
    refuse()
  for (const [name, value] of Object.entries(env)) {
    if (forbidden.test(name) && value) refuse()
  }
}

export function assertLocalApiUrl(raw) {
  // Exact literal only: no DNS, IPv6, alternate IPv4 notation, credentials,
  // query parameters, fragments, paths, encoded hosts or parser normalization.
  if (raw !== 'http://127.0.0.1:54321') refuse()
  return raw
}

export function assertLocalPostgresUrl(raw) {
  // Future SQL clients must use this validator before creating a connection.
  // Never pass the raw URL to libpq: use the returned explicit fields.
  if (
    typeof raw !== 'string' ||
    !/^postgresql:\/\/p2_test:[a-f0-9]{32}@127\.0\.0\.1:55432\/p2_test_[a-f0-9]{16}$/.test(raw)
  )
    refuse()
  const url = new URL(raw)
  return {
    host: '127.0.0.1',
    port: 55432,
    user: 'p2_test',
    password: url.password,
    database: url.pathname.slice(1),
    ssl: false,
  }
}

export function readLocalTestConfig(env = process.env) {
  assertTestEnvironment(env)
  const configured = Object.keys(env).some((key) => key.startsWith('P2_TEST_') && env[key])
  if (!configured) return null
  const known = new Set([
    'P2_TEST_ENABLE',
    'P2_TEST_API_URL',
    'P2_TEST_SERVICE_ROLE_KEY',
    'P2_TEST_POSTGRES_URL',
    'P2_TEST_BENCH_ID',
  ])
  if (Object.keys(env).some((key) => key.startsWith('P2_TEST_') && !known.has(key))) refuse()
  if (
    env.P2_TEST_ENABLE !== '1' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      env.P2_TEST_BENCH_ID ?? ''
    )
  )
    refuse()
  const apiUrl = assertLocalApiUrl(env.P2_TEST_API_URL)
  if (env.P2_TEST_SERVICE_ROLE_KEY !== LOCAL_SERVICE_KEY) refuse()
  if (env.P2_TEST_POSTGRES_URL) assertLocalPostgresUrl(env.P2_TEST_POSTGRES_URL)
  return { apiUrl, serviceKey: LOCAL_SERVICE_KEY, benchId: env.P2_TEST_BENCH_ID }
}

// Reject redirects rather than following them to an unchecked destination.
export function localOnlyFetch(fetchImpl = fetch) {
  return (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(raw)
    assertLocalApiUrl(url.origin)
    if (!raw.startsWith('http://127.0.0.1:54321/') || url.username || url.password || url.hash)
      refuse()
    return fetchImpl(input, { ...init, redirect: 'error' })
  }
}

export async function assertOwnedBench(client, benchId) {
  const { data, error } = await client.rpc('p2_test_identity')
  if (error || data !== benchId)
    throw new Error('Refused: target is not the owned disposable P2 bench')
}
