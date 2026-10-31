import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  API_GATEWAY_URL,
  assertOwnedBench,
  assertLocalApiUrl,
  assertLocalPostgresUrl,
  readLocalTestConfig,
  localOnlyFetch,
  LOCAL_SERVICE_KEY,
} from '../../scripts/local-tests/connection-policy.mjs'

const valid = {
  P2_TEST_ENABLE: '1',
  P2_TEST_API_URL: API_GATEWAY_URL,
  P2_TEST_SERVICE_ROLE_KEY: LOCAL_SERVICE_KEY,
  P2_TEST_BENCH_ID: '11111111-2222-4333-8444-555555555555',
}
const postgres = `postgresql://p2_test:${'a'.repeat(32)}@127.0.0.1:55432/p2_test_${'a'.repeat(16)}`

for (const url of [
  'https://project.supabase.co',
  'http://192.168.1.2:54321',
  'http://10.0.0.1:54321',
  'http://169.254.169.254',
  'http://0.0.0.0:54321',
  'http://localhost:54321',
  'http://127.0.0.1.evil.invalid:54321',
  'http://2130706433:54321',
  'http://127.1:54321',
  'http://0177.0.0.1:54321',
  'http://[::1]:54321',
  'http://127.0.0.1:54321@remote.invalid',
  'http://user:pass@127.0.0.1:54321',
  'http://127.0.0.1:54321?host=remote',
  'http://127.0.0.1:54321#remote',
  'http://127.0.0.1:54321/',
  ' http://127.0.0.1:54321',
  'http://127.0.0.1:54321', // ancien port (occupé par djamiyah-local-banc) désormais refusé
  'https://127.0.0.1:54321',
])
  test(`API rejects ambiguous/non-allowlisted URL: ${url}`, () => {
    assert.throws(() => assertLocalApiUrl(url))
    assert.throws(() => readLocalTestConfig({ ...valid, P2_TEST_API_URL: url }))
  })

for (const url of [
  'postgresql://u:p@project.supabase.co:5432/postgres',
  postgres + '?host=remote.invalid',
  postgres + '?service=production',
  postgres.replace('127.0.0.1', 'localhost'),
  postgres.replace('127.0.0.1', '10.0.0.1'),
  postgres.replace('127.0.0.1', '127.0.0.1,remote.invalid'),
  postgres.replace('p2_test_aaaaaaaaaaaaaaaa', 'postgres'),
  postgres.replace('55432', '5432'),
  'host=127.0.0.1 hostaddr=8.8.8.8 dbname=postgres',
  '',
])
  test('PostgreSQL rejects remote/ambiguous/unowned connection parameters', () => {
    assert.throws(() => assertLocalPostgresUrl(url))
  })

test('explicit local configuration is accepted, no configuration skips integration', () => {
  assert.equal(readLocalTestConfig({}), null)
  assert.equal(readLocalTestConfig(valid).apiUrl, valid.P2_TEST_API_URL)
  assert.equal(assertLocalPostgresUrl(postgres).host, '127.0.0.1')
})

for (const name of [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY',
  'API_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'DATABASE_URL',
  'DIRECT_URL',
  'PGHOST',
  'PGSERVICE',
  'PGSERVICEFILE',
  'PGOPTIONS',
  'PGHOSTADDR',
  'POSTGRES_URL',
  'SUPABASE_ACCESS_TOKEN',
  'VERCEL_ENV',
  'VERCEL',
]) {
  test(`reject inherited production/legacy setting ${name} before any connection`, () => {
    assert.throws(() => readLocalTestConfig({ ...valid, [name]: 'production-setting' }))
    assert.throws(() => readLocalTestConfig({ [name]: 'production-setting' }))
  })
}

test('partial, unknown, production and foreign-key configurations are refused', () => {
  for (const env of [
    { P2_TEST_ENABLE: '1' },
    { ...valid, P2_TEST_ENABLE: '0' },
    { ...valid, P2_TEST_BENCH_ID: '' },
    { ...valid, P2_TEST_SERVICE_ROLE_KEY: 'real-secret-do-not-print' },
    { ...valid, P2_TEST_TARGET: 'remote' },
    { ...valid, NODE_ENV: 'production' },
  ]) {
    assert.throws(() => readLocalTestConfig(env))
  }
})

test('transport blocks remote requests and disables automatic redirects', async () => {
  let count = 0
  const guarded = localOnlyFetch(async (_input, init) => {
    count++
    assert.equal(init.redirect, 'error')
    return 'ok'
  })
  assert.throws(() => guarded('https://project.supabase.co/rest/v1/reservations'))
  assert.equal(count, 0)
  assert.equal(await guarded(`${API_GATEWAY_URL}/rest/v1/payment_attempts`), 'ok')
})

test('integration entry point refuses a remote URL before loading a client', () => {
  const env = { PATH: process.env.PATH, ...valid, P2_TEST_API_URL: 'https://project.supabase.co' }
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'tests/payment/supabaseAttemptStore.integration.test.mjs'],
    {
      cwd: new URL('../..', import.meta.url),
      env,
      encoding: 'utf8',
      timeout: 10000,
    }
  )
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Local test connection refused/)
  assert.ok(!result.stderr.includes('real-secret-do-not-print'))
})

test('ownership marker must match before any integration write', async () => {
  for (const reply of [
    { data: 'another-bench', error: null },
    { data: null, error: { code: 'missing' } },
  ]) {
    await assert.rejects(assertOwnedBench({ rpc: async () => reply }, valid.P2_TEST_BENCH_ID))
  }
  await assertOwnedBench(
    { rpc: async () => ({ data: valid.P2_TEST_BENCH_ID, error: null }) },
    valid.P2_TEST_BENCH_ID
  )
})
