import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveChapchapContract, safeAllowHeader } from '../../src/lib/chapchapContract.ts'

test('seule Preview choisit le contrat historique, production et développement conservent le contrat actuel', () => {
  assert.deepEqual(resolveChapchapContract('preview'), { path: 'ecommerce/create', callbackField: 'notify_url' })
  for (const env of ['production', 'development']) {
    assert.deepEqual(resolveChapchapContract(env), { path: 'ecommerce/operation', callbackField: 'callback_url' })
  }
})

test('Allow ne peut pas injecter de secret dans les journaux', () => {
  assert.equal(safeAllowHeader('GET, POST'), 'GET, POST')
  assert.equal(safeAllowHeader('GET, SECRET_DO_NOT_LOG'), null)
  assert.equal(safeAllowHeader(null), null)
})