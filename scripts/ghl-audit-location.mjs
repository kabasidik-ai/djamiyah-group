// ============================================================
// ghl-audit-location.mjs — Lecture seule du sous-compte GHL.
// Variable CANONIQUE : GHL_PRIVATE_INTEGRATION_TOKEN.
// Usage : node scripts/ghl-audit-location.mjs
// ============================================================

import { requireGhlToken, requireLocation, ghlGet } from './ghl-common.mjs'

const loc = requireLocation()
requireGhlToken() // garantit que le jeton canonique est présent avant tout appel

const base = 'https://services.leadconnectorhq.com'
const r = await ghlGet('location', `${base}/locations/${loc}`, '2021-07-28')

if (r && r.status === 200 && r.text) {
  let j = {}
  try {
    j = JSON.parse(r.text)
  } catch {
    /* ignore */
  }
  const l = j?.location ?? j
  console.log(`Nom du sous-compte : ${l?.name ?? '(inconnu)'}`)
  console.log(`locationId : ${l?.id ?? '(inconnu)'}`)
  console.log(`site : ${l?.website ?? ''}`)
}
