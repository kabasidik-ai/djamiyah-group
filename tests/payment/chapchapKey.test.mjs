import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveChapchapApiKey } from '../../src/lib/chapchapKey.ts'

const TEST_KEY = 't'.repeat(64)
const PROD_KEY = 'p'.repeat(64)

test('production (VERCEL_ENV=production) : seule la clé PRODUCTION est utilisable', () => {
  const d = resolveChapchapApiKey({
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
    CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY,
  })
  assert.equal(d.allow, true)
  if (d.allow) {
    assert.equal(d.environment, 'production')
    assert.equal(d.key, PROD_KEY)
  }
})

test('production sans clé PRODUCTION → 503 fail-closed', () => {
  const d = resolveChapchapApiKey({ VERCEL_ENV: 'production', NODE_ENV: 'production' })
  assert.deepEqual(d, { allow: false, status: 503, reason: 'missing_production_key' })
})

test('preview avec clé TEST seule → autorisé avec la clé TEST', () => {
  const d = resolveChapchapApiKey({
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    CHAPCHAP_API_KEY_TEST: TEST_KEY,
  })
  assert.equal(d.allow, true)
  if (d.allow) {
    assert.equal(d.environment, 'preview')
    assert.equal(d.key, TEST_KEY)
  }
})

test("preview sans clé TEST → 503 fail-closed (même si la clé PRODUCTION est présente)", () => {
  const d = resolveChapchapApiKey({
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY,
  })
  assert.deepEqual(d, { allow: false, status: 503, reason: 'missing_test_key_preview_or_dev' })
})

test('preview avec clé TEST ET clé PRODUCTION résiduelle → 403 (isolation non garantie — audit Vercel)', () => {
  const d = resolveChapchapApiKey({
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    CHAPCHAP_API_KEY_TEST: TEST_KEY,
    CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY,
  })
  assert.equal(d.allow, false)
  if (!d.allow) {
    assert.equal(d.status, 403)
    assert.equal(d.reason, 'production_key_present_outside_production')
  }
})

test('development (VERCEL_ENV=development) avec clé TEST → autorisé en TEST', () => {
  const d = resolveChapchapApiKey({
    VERCEL_ENV: 'development',
    NODE_ENV: 'development',
    CHAPCHAP_API_KEY_TEST: TEST_KEY,
  })
  assert.equal(d.allow, true)
  if (d.allow) {
    assert.equal(d.environment, 'development')
    assert.equal(d.key, TEST_KEY)
  }
})

test('local (pas de VERCEL_ENV, NODE_ENV=production) : clé TEST uniquement, aucun fallback prod', () => {
  const d = resolveChapchapApiKey({
    NODE_ENV: 'production',
    CHAPCHAP_API_KEY_TEST: TEST_KEY,
  })
  assert.equal(d.allow, true)
  if (d.allow) {
    assert.equal(d.environment, 'development')
    assert.equal(d.key, TEST_KEY)
  }
})

test('local avec clé PRODUCTION aussi présente → 403 (isolation fail-closed, même en simulation)', () => {
  const d = resolveChapchapApiKey({
    NODE_ENV: 'production',
    CHAPCHAP_API_KEY_TEST: TEST_KEY,
    CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY,
  })
  assert.equal(d.allow, false)
  if (!d.allow) {
    assert.equal(d.status, 403)
    assert.equal(d.reason, 'production_key_present_outside_production')
  }
})

test('local sans clé TEST → 503 (aucun fallback vers prod)', () => {
  const d = resolveChapchapApiKey({ NODE_ENV: 'production', CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY })
  assert.deepEqual(d, { allow: false, status: 503, reason: 'missing_test_key_preview_or_dev' })
})

test('toute clé retournée n’est JAMAIS la clé PRODUCTION hors déploiement production', () => {
  const envs = [
    { VERCEL_ENV: 'preview', NODE_ENV: 'production', CHAPCHAP_API_KEY_TEST: TEST_KEY, CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY },
    { VERCEL_ENV: 'development', NODE_ENV: 'development', CHAPCHAP_API_KEY_TEST: TEST_KEY, CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY },
    { NODE_ENV: 'production', CHAPCHAP_API_KEY_TEST: TEST_KEY, CHAPCHAP_API_KEY_PRODUCTION: PROD_KEY },
  ]
  for (const env of envs) {
    const d = resolveChapchapApiKey(env)
    if (d.allow) {
      assert.notEqual(d.key, PROD_KEY, 'jamais la clé PRODUCTION hors production')
    }
  }
})

