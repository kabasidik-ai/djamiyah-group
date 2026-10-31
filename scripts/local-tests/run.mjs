import { createServer, request as httpRequest } from 'node:http'
import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { assertTestEnvironment, LOCAL_JWT_SECRET, LOCAL_SERVICE_KEY } from './connection-policy.mjs'
import { rebuild } from './rebuild.mjs'

assertTestEnvironment(process.env)
if (Object.keys(process.env).some((key) => key.startsWith('P2_TEST_') && process.env[key])) {
  throw new Error(
    'Runner creates its own isolated configuration; do not supply P2_TEST_* overrides.'
  )
}
const root = path.resolve(import.meta.dirname, '../..')
const tag = `p2-bench-${randomUUID()}`
const benchId = randomUUID()
const env = { ...process.env }
for (const key of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete env[key]
function command(program, args, input) {
  const result = spawnSync(program, args, {
    env,
    cwd: root,
    input,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.error || result.status !== 0)
    throw new Error(`${program} failed: ${result.stderr || 'local command unavailable'}`)
  return result.stdout
}
const docker = (...args) => command('docker', ['--host=unix:///var/run/docker.sock', ...args])
const sql = (source) =>
  command(
    'docker',
    [
      '--host=unix:///var/run/docker.sock',
      'exec',
      '-i',
      `${tag}-db`,
      'psql',
      '-X',
      '--no-password',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    source
  )
const owned = []
let networkOwned = false
let gateway
const pause = () => new Promise((resolve) => setTimeout(resolve, 500))
try {
  docker('info', '--format', '{{.ServerVersion}}')
  // No arbitrary Docker endpoint, SQL target, image, volume, name or cleanup command.
  docker('pull', 'postgres:17.6')
  docker('pull', 'postgrest/postgrest:v13.0.7')
  docker('network', 'create', '--internal', tag)
  networkOwned = true
  owned.push(
    docker(
      'create',
      '--name',
      `${tag}-db`,
      '--network',
      tag,
      '--network-alias',
      'db',
      '--tmpfs',
      '/var/lib/postgresql/data',
      '-e',
      'POSTGRES_PASSWORD=local-disposable-only',
      'postgres:17.6'
    ).trim()
  )
  docker('start', `${tag}-db`)
  let ready = false
  for (let i = 0; i < 60; i++) {
    try {
      sql('SELECT 1')
      ready = true
      break
    } catch {
      await pause()
    }
  }
  if (!ready) throw new Error('Local PostgreSQL readiness timeout')
  sql(readFileSync(path.join(root, 'scripts/local-tests/bootstrap.sql'), 'utf8'))
  rebuild(sql, root)
  // Replay must skip by full filename/hash, not collide on 002 or recreate GHL triggers.
  rebuild(sql, root)
  sql(readFileSync(path.join(root, 'scripts/local-tests/verify.sql'), 'utf8'))
  sql(`CREATE FUNCTION public.p2_test_identity() RETURNS text LANGUAGE sql AS $$ SELECT '${benchId}'::text $$;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;`)
  owned.push(
    docker(
      'create',
      '--name',
      `${tag}-api`,
      '--network',
      tag,
      '-p',
      '127.0.0.1:54322:3000',
      '-e',
      'PGRST_DB_URI=postgres://p2_api:local-disposable-only@db:5432/postgres',
      '-e',
      'PGRST_DB_SCHEMAS=public',
      '-e',
      'PGRST_DB_ANON_ROLE=anon',
      '-e',
      `PGRST_JWT_SECRET=${LOCAL_JWT_SECRET}`,
      'postgrest/postgrest:v13.0.7'
    ).trim()
  )
  docker('start', `${tag}-api`)
  let apiReady = false
  for (let i = 0; i < 60; i++) {
    try {
      if (
        (
          await fetch('http://127.0.0.1:54322/', {
            redirect: 'error',
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      ) {
        apiReady = true
        break
      }
    } catch {
      /* bounded local readiness */
    }
    await pause()
  }
  if (!apiReady) throw new Error('Local PostgREST readiness timeout')
  gateway = createServer((req, res) => {
    if (!req.url?.startsWith('/rest/v1/')) {
      res.writeHead(404).end()
      return
    }
    const upstream = httpRequest(
      {
        hostname: '127.0.0.1',
        port: 54322,
        method: req.method,
        path: req.url.slice('/rest/v1'.length),
        headers: req.headers,
      },
      (reply) => {
        res.writeHead(reply.statusCode, reply.headers)
        reply.pipe(res)
      }
    )
    upstream.on('error', () => res.writeHead(502).end())
    req.pipe(upstream)
  })
  await new Promise((resolve, reject) => {
    gateway.once('error', reject)
    gateway.listen(54321, '127.0.0.1', resolve)
  })
  // Async child: gateway must continue serving while integration tests execute.
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--experimental-strip-types',
        '--test',
        'tests/payment/supabaseAttemptStore.integration.test.mjs',
      ],
      {
        cwd: root,
        stdio: 'inherit',
        env: {
          ...env,
          P2_TEST_ENABLE: '1',
          P2_TEST_API_URL: 'http://127.0.0.1:54321',
          P2_TEST_SERVICE_ROLE_KEY: LOCAL_SERVICE_KEY,
          P2_TEST_BENCH_ID: benchId,
        },
      }
    )
    child.once('error', reject)
    child.once('exit', (status) => resolve({ status }))
  })
  if (result.status !== 0) throw new Error('Local integration tests failed')
  console.log('Disposable SQL reconstruction, replay and PostgREST integration: OK')
} finally {
  if (gateway?.listening) await new Promise((resolve) => gateway.close(resolve))
  // Only IDs created by THIS invocation. Never reset/drop an existing database.
  for (const id of owned.reverse()) docker('rm', '-f', id)
  if (networkOwned) docker('network', 'rm', tag)
}
