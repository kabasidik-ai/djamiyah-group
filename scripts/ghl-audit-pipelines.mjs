// ============================================================
// ghl-audit-pipelines.mjs — Lecture seule des pipelines GHL.
// Variable CANONIQUE : GHL_PRIVATE_INTEGRATION_TOKEN.
// Usage : node scripts/ghl-audit-pipelines.mjs
// ============================================================

import { requireGhlToken, requireLocation, ghlGet } from './ghl-common.mjs'

const loc = requireLocation()
requireGhlToken()

const base = 'https://services.leadconnectorhq.com'
const r = await ghlGet(
  'pipelines',
  `${base}/opportunities/pipelines?locationId=${loc}`,
  '2021-07-28'
)

if (r && r.status === 200 && r.text) {
  let j = {}
  try {
    j = JSON.parse(r.text)
  } catch {
    /* ignore */
  }
  const pips = j?.pipelines ?? []
  console.log(`Pipelines trouvés : ${pips.length}`)
  for (const p of pips) {
    const stages = (p?.stages ?? []).map((s) => s?.name).join(' | ')
    console.log(`  - "${p?.name}" id=${p?.id}  → ${stages}`)
  }
}
