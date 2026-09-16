// ============================================================
// Test ciblé du calcul montant salles de conférence.
// Compile src/lib/conferencePricing.ts (fonction pure) puis vérifie
// la tarification par durée (Rama vs Maison Blanche).
// Usage : node scripts/test-conference-price.mjs
// ============================================================
import { execSync } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join as joinPath } from 'node:path'

const tmp = await mkdtemp('djami-conf-')
const src = joinPath(process.cwd(), 'src', 'lib', 'conferencePricing.ts')

execSync(
  `npx tsc ${src} --module es2020 --target es2020 --esModuleInterop --skipLibCheck --outDir "${tmp}"`,
  { stdio: 'inherit' }
)

const mod = await import(pathToFileURL(joinPath(tmp, 'conferencePricing.js')).href)
const { computeConferenceUnitPrice, ConferencePricingError } = mod

let pass = 0
let fail = 0
function check(label, actual, expected) {
  const ok = actual === expected
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (got=${actual}, want=${expected})`)
  ok ? pass++ : fail++
}
function checkThrows(label, fn) {
  try {
    fn()
    console.log(`FAIL  ${label}  (aucune erreur levée)`)
    fail++
  } catch (err) {
    const ok = err instanceof ConferencePricingError
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (${err.message})`)
    ok ? pass++ : fail++
  }
}

console.log('— Hôtel Rama : 1M demi-journée / 2M journée —')
check('Rama journée complète', computeConferenceUnitPrice(2000000, 1000000, 'full_day'), 2000000)
check('Rama demi-journée', computeConferenceUnitPrice(2000000, 1000000, 'half_day'), 1000000)

console.log('— Maison Blanche : pas de demi-journée (price_half_day = null) —')
check('MB journée complète', computeConferenceUnitPrice(1500000, null, 'full_day'), 1500000)
checkThrows('MB demi-journée → rejet', () =>
  computeConferenceUnitPrice(1500000, null, 'half_day')
)

console.log('— Incohérences —')
checkThrows('price_per_day invalide', () => computeConferenceUnitPrice(-1, null, 'full_day'))
checkThrows('half_day sans tarif half_day sur Rama (données cassées)', () =>
  computeConferenceUnitPrice(2000000, undefined, 'half_day')
)

console.log(`\nRésultat : ${pass} passé(s), ${fail} échec(s)`)
process.exit(fail === 0 ? 0 : 1)