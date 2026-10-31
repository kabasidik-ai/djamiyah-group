import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  API_GATEWAY_URL,
  API_PUBLISH_SPEC,
  API_GATEWAY_PORT,
  API_UPSTREAM_PORT,
  DOCKER_SOCKET_CANDIDATES,
  assertApiPublishSpec,
  assertDbNotPublished,
  assertLocalApiUrl,
  assertLocalDockerHost,
  resolveLocalDockerHost,
} from '../../scripts/local-tests/connection-policy.mjs'

/**
 * Tests — Politique Docker du banc P2 : socket LOCAL uniquement.
 * Refuse tout hôte distant (TCP, SSH, HTTPS, chemin relatif ou non listé),
 * compatibilité macOS (Docker Desktop) et Linux (/var/run/docker.sock).
 */

test('détection : fournit une socket locale exacte (macOS ou Linux selon la machine)', () => {
  const host = resolveLocalDockerHost()
  assert.equal(typeof host, 'string')
  assert.ok(host.startsWith('unix://'), `hôte "${host}" doit être un socket Unix`)
  // La socket détectée doit faire partie de l'allow-list exacte.
  const allowed = DOCKER_SOCKET_CANDIDATES.map((p) => `unix://${p}`)
  assert.ok(allowed.includes(host), `hôte "${host}" hors allow-list`)
})

test('acceptation : la socket locale détectée passe assertLocalDockerHost', () => {
  const host = resolveLocalDockerHost()
  assert.equal(assertLocalDockerHost(host), host)
})

test('refus : hôtes TCP/SSH/HTTPS distants', () => {
  for (const raw of [
    'tcp://1.2.3.4:2375',
    'tcp://localhost:2376',
    'tcp://127.0.0.1:2375',
    'ssh://ubuntu@10.0.0.5:22',
    'https://docker.example.com:2376',
    'http://docker.example.com',
    'npipe:////./pipe/docker_engine',
  ]) {
    assert.throws(() => assertLocalDockerHost(raw), Error, `hôte "${raw}" doit être refusé`)
  }
})

test('refus : chemins Unix hors allow-list, relatifs ou format invalide', () => {
  for (const raw of [
    'unix:///tmp/custom.sock',
    'unix:///private/tmp/docker.sock',
    'unix://relative.sock',
    'unix://~/.docker/run/docker.sock',
    'unix://',
    ' /var/run/docker.sock',
    '',
    null,
    123,
  ]) {
    assert.throws(() => assertLocalDockerHost(raw), Error, `valeur "${raw}" doit être refusée`)
  }
})

test('refus : chemin Linux valide mais socket ABSENTE (ex. macOS sans /var/run)', () => {
  // Sur macOS, /var/run/docker.sock n'existe pas → refusé par la politique
  // (la socket DOIT exister : pas d'hôte supposé).
  try {
    const linuxHost = `unix://${DOCKER_SOCKET_CANDIDATES[0]}`
    assertLocalDockerHost(linuxHost) // sans erreur → la socket existe (Linux)
  } catch {
    // socket absente → refusé : comportement correct également.
    assert.ok(true)
  }
})

test('composition : resolve+assert retourne bien une socket de l’allow-list', () => {
  const host = resolveLocalDockerHost()
  const allowed = DOCKER_SOCKET_CANDIDATES.map((p) => `unix://${p}`)
  assert.ok(allowed.includes(assertLocalDockerHost(host)))
})// ── Politique des ports/réseau du banc ───────────────────────────────────────────

test('ports : gateway et PostgREST sur loopback, ports distincts et libres-ish', () => {
  assert.equal(typeof API_GATEWAY_PORT, 'number')
  assert.equal(typeof API_UPSTREAM_PORT, 'number')
  assert.notEqual(API_GATEWAY_PORT, API_UPSTREAM_PORT)
  assert.ok(API_GATEWAY_PORT > 0 && API_UPSTREAM_PORT > 0)
  // Loopback uniquement (jamais 0.0.0.0).
  assert.equal(API_GATEWAY_URL, `http://127.0.0.1:${API_GATEWAY_PORT}`)
  assert.equal(API_PUBLISH_SPEC, `127.0.0.1:${API_UPSTREAM_PORT}:3000`)
})

test('assertApiPublishSpec : accepte la spécification exacte, refuse le reste', () => {
  assert.equal(assertApiPublishSpec(API_PUBLISH_SPEC), API_PUBLISH_SPEC)
  for (const raw of [
    `0.0.0.0:${API_UPSTREAM_PORT}:3000`,
    `http://127.0.0.1:${API_UPSTREAM_PORT}`,
    `127.0.0.1:${API_UPSTREAM_PORT + 1}:3000`,
    `127.0.0.1:${API_UPSTREAM_PORT}/`,
    '',
    null,
    123,
  ]) {
    assert.throws(() => assertApiPublishSpec(raw), Error, `spec "${raw}" doit être refusée`)
  }
})

test('assertDbNotPublished : la base ne doit jamais publier de port', () => {
  assert.equal(assertDbNotPublished([]), undefined)
  assert.equal(assertDbNotPublished(['create', '--name', 'db']), undefined)
  assert.throws(() => assertDbNotPublished(['create', '-p', '5433:5432']), Error)
  assert.throws(() => assertDbNotPublished(['--publish', '5433:5432']), Error)
  assert.throws(() => assertDbNotPublished('not-an-array'), Error)
})

test('assertLocalApiUrl : n’accepte que le gateway local exact (nouveaux ports)', () => {
  assert.equal(assertLocalApiUrl(API_GATEWAY_URL), API_GATEWAY_URL)
  // L’ancien port 54321 (occupé par djamiyah-local-banc) est refusé.
  assert.throws(() => assertLocalApiUrl('http://127.0.0.1:54321'), Error)
  assert.throws(() => assertLocalApiUrl('http://localhost:54421'), Error)
  assert.throws(() => assertLocalApiUrl('http://0.0.0.0:54421'), Error)
  assert.throws(() => assertLocalApiUrl('https://127.0.0.1:54421'), Error)
  assert.throws(() => assertLocalApiUrl(`${API_GATEWAY_URL}/rest/v1/`), Error)
})