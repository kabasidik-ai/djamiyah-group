import { createHmac } from 'node:crypto'
import { homedir } from 'node:os'
import { statSync } from 'node:fs'

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

// ── Ports hôtes du banc (loopback UNIQUEMENT) ───────────────────────────────────
// PostgREST est publié sur 127.0.0.1 (jamais 0.0.0.0) et le gateway du lanceur
// écoute sur un port hôte libre, distinct du stack existant (djamiyah-local-banc
// occupe déjà 54321/54322 sur cette machine → on utilise 54421/54422).
export const API_GATEWAY_PORT = 54421
export const API_UPSTREAM_PORT = 54422
export const API_PUBLISH_SPEC = `127.0.0.1:${API_UPSTREAM_PORT}:3000`
export const API_GATEWAY_URL = `http://127.0.0.1:${API_GATEWAY_PORT}`

/**
 * Validation stricte de la spécification de publication PostgREST :
 * bouclage hôte uniquement, chiffre de port exact — rien d'autre.
 */
export function assertApiPublishSpec(raw) {
  if (typeof raw !== 'string' || raw !== API_PUBLISH_SPEC) refuse()
  return raw
}

/**
 * La base PostgreSQL ne doit JAMAIS publier de port : aucun '-p'/--publish.
 * Elle reste ainsi inaccessible depuis l'hôte et depuis l'extérieur.
 */
export function assertDbNotPublished(createArgs) {
  if (!Array.isArray(createArgs)) refuse()
  if (
    createArgs.includes('-p') ||
    createArgs.some((a) => typeof a === 'string' && a.startsWith('--publish'))
  )
    refuseDaemon()
}

export function assertLocalApiUrl(raw) {
  // Exact literal only: no DNS, IPv6, alternate IPv4 notation, credentials,
  // query parameters, fragments, paths, encoded hosts or parser normalization.
  if (raw !== API_GATEWAY_URL) refuse()
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
    if (!raw.startsWith(`${API_GATEWAY_URL}/`) || url.username || url.password || url.hash)
      refuse()
    return fetchImpl(input, { ...init, redirect: 'error' })
  }
}

export async function assertOwnedBench(client, benchId) {
  const { data, error } = await client.rpc('p2_test_identity')
  if (error || data !== benchId)
    throw new Error('Refused: target is not the owned disposable P2 bench')
}
// ── Police Docker LOCAL uniquement ──────────────────────────────────────────────
// Le banc utilise un réseau bridge LOCAL NON interne : c'est le seul moyen fiable
// de publier le port PostgREST (127.0.0.1) sous Docker Desktop (réseaux --internal
// n'y publient pas les ports hôtes). CONSÉQUENCE HONNÊTE : l'egress des
// conteneurs n'est PAS bloquée (un conteneur pourrait contacter l'extérieur ;
// rien ne le fait et aucune donnée n'en sort). La base PostgreSQL ne publie
// AUCUN port → inaccessible depuis l'hôte et l'extérieur ; PostgREST n'est
// publié que sur 127.0.0.1. L'isolation réelle repose sur ces publications
// loopback + la politique P2 (URL littérale, identité de banc, secret local).
// Tout hôte TCP/SSH/HTTPS, relatif ou non listé est REFUSÉ — aucune connexion à
// un daemon distant n'est possible. Ne présentez pas ce réseau comme isolé.

export const DOCKER_SOCKET_CANDIDATES = [
  '/var/run/docker.sock', // Linux (hôte) et autres démons systèmes
  `${homedir()}/.docker/run/docker.sock`, // Docker Desktop (macOS)
]

function refuseDaemon() {
  throw new Error(
    'Local Docker daemon socket not found; TCP, SSH, HTTPS or any unlisted daemon host is refused.'
  )
}

/** Vraie socket locale (S_IFSOCK), jamais un fichier, lien ou répertoire. */
function isLocalSocket(path) {
  try {
    return statSync(path).isSocket()
  } catch {
    return false
  }
}

/** Autorise UNIQUEMENT les deux sockets locaux connus (allow-list exacte). */
export function assertLocalDockerHost(raw) {
  const allowed = DOCKER_SOCKET_CANDIDATES.map((p) => `unix://${p}`)
  if (typeof raw !== 'string' || !allowed.includes(raw)) refuseDaemon()
  const socketPath = raw.replace(/^unix:\/\//, '')
  if (!isLocalSocket(socketPath)) refuseDaemon()
  return raw
}

/**
 * Détecte la socket locale présente (macOS d'abord, Linux ensuite).
 * Aucun repli réseau : sans socket locale détectée, on refuse de démarrer.
 */
export function resolveLocalDockerHost() {
  for (const candidate of DOCKER_SOCKET_CANDIDATES) {
    if (isLocalSocket(candidate)) return `unix://${candidate}`
  }
  refuseDaemon()
}