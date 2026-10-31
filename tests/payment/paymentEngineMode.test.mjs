import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolvePaymentEngineMode,
  readLocalMockConfig,
  isP2LocalMockEnabled,
} from '../../src/lib/paymentEngineMode.ts'

test('mode par défaut: off', () => {
  assert.equal(resolvePaymentEngineMode({}), 'off')
  assert.equal(isP2LocalMockEnabled({}), false)
})

test('local_mock autorisé en dev avec loopback strict', () => {
  const env = {
    NODE_ENV: 'development',
    P2_PAYMENT_ENGINE_MODE: 'local_mock',
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54421',
  }

  assert.equal(resolvePaymentEngineMode(env), 'local_mock')
  const cfg = readLocalMockConfig(env)
  assert.equal(cfg.mode, 'local_mock')
  assert.equal(cfg.chapchapBaseUrl, 'http://127.0.0.1:18080')
  assert.equal(cfg.supabaseUrl, 'http://127.0.0.1:54421')
})

test('production force off même si variable configurée', () => {
  const env = {
    NODE_ENV: 'production',
    P2_PAYMENT_ENGINE_MODE: 'local_mock',
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54421',
  }

  assert.equal(resolvePaymentEngineMode(env), 'off')
  assert.equal(isP2LocalMockEnabled(env), false)
  assert.throws(() => readLocalMockConfig(env))
})

test('local_mock refuse destination chapchap distante', () => {
  const env = {
    NODE_ENV: 'development',
    P2_PAYMENT_ENGINE_MODE: 'local_mock',
    CHAPCHAP_BASE_URL: 'https://chapchappay.com/api',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54421',
  }

  assert.throws(() => readLocalMockConfig(env))
})

test('local_mock refuse supabase distante', () => {
  const env = {
    NODE_ENV: 'development',
    P2_PAYMENT_ENGINE_MODE: 'local_mock',
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  }

  assert.throws(() => readLocalMockConfig(env))
})

test('local_mock refuse URL loopback avec credentials, query ou hash', () => {
  const base = {
    NODE_ENV: 'development',
    P2_PAYMENT_ENGINE_MODE: 'local_mock',
    CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54421',
  }

  assert.throws(() =>
    readLocalMockConfig({
      ...base,
      CHAPCHAP_BASE_URL: 'http://user:pass@127.0.0.1:18080',
    })
  )

  assert.throws(() =>
    readLocalMockConfig({
      ...base,
      CHAPCHAP_BASE_URL: 'http://127.0.0.1:18080?next=https://evil.invalid',
    })
  )

  assert.throws(() =>
    readLocalMockConfig({
      ...base,
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54421#remote',
    })
  )
})
