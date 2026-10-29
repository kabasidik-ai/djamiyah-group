// ============================================================
// ghl-audit-objects-v3.mjs — Lecture seule des Custom Objects GHL.
// Variable CANONIQUE : GHL_PRIVATE_INTEGRATION_TOKEN.
// Usage : node scripts/ghl-audit-objects-v3.mjs
//
// Tente d'obtenir la liste des schémas de Custom Objects (v3) et
// les associations. Ne devine AUCUNE schemaKey. Si l'endpoint n'est
// pas exposé au jeton (404), taille du schéma et clés restent
// indéterminées — aucune écriture n'est effectuée.
// ============================================================

import { requireGhlToken, requireLocation, ghlGet } from './ghl-common.mjs'

const loc = requireLocation()
requireGhlToken()

const base = 'https://services.leadconnectorhq.com'

const variants = [
  ['objects-v3', `${base}/custom-objects?locationId=${loc}`, '2021-07-28'],
  ['objects-v3-slash', `${base}/custom-objects/?locationId=${loc}`, '2021-07-28'],
]

for (const [name, url, version] of variants) {
  const r = await ghlGet(name, url, version)
  if (r && r.status === 200 && r.text) {
    console.log(`  ${r.text.slice(0, 3000)}`)
  }
}

// Associations (lecture seule) — si exposé.
await ghlGet('associations', `${base}/custom-objects/associations?locationId=${loc}`, '2021-07-28')
