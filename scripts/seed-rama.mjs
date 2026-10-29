// ============================================================
// Seed: Hôtel Rama — chambres + salle de conférence (Supabase)
// Usage: node --env-file=.env.local scripts/seed-rama.mjs
// Idempotent (upsert sur name / onConflict).
// Cible : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error('Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } })

const roomsSeed = [
  {
    name: 'Rama — Confort',
    type: 'premium',
    price_per_night: 500000,
    capacity: 2,
    total_units: 14,
    slug: 'rama-confort',
    description:
      'Chambre confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs recherchant qualité et sérénité. Même standing que la Chambre Confort de la Maison Blanche.',
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Salle de bain privative', 'Bureau'],
    images: ['/images/maison-blanche/chambre-premium.jpg'],
    is_available: true,
  },
  {
    name: 'Rama — Double Premium',
    type: 'premium',
    price_per_night: 750000,
    capacity: 4,
    total_units: 4,
    slug: 'rama-double-premium',
    description:
      "Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu'à 4 personnes. Même standing que la Double Premium de la Maison Blanche.",
    features: ['Climatisation', 'Wi-Fi', 'TV écran plat', 'Mini-bar', 'Espace famille'],
    images: ['/images/maison-blanche/chambre-premium.jpg'],
    is_available: true,
  },
]

const conferenceSeed = {
  name: 'Rama — Salle de Conférence',
  capacity: 70,
  price_per_day: 2000000,
  description:
    "Salle de conférence de 70 personnes à l'Hôtel Rama — Kissidougou. Formule demi-journée : 1 000 000 GNF. Formule journée complète : 2 000 000 GNF.",
  features: ['Équipement audio-visuel', 'Service de restauration'],
  images: ['/images/hotel-rama-kissidougou.webp'],
  is_available: true,
}

async function main() {
  // 1) Chambres
  const { data: roomsData, error: roomsError } = await db
    .from('rooms')
    .upsert(roomsSeed, { onConflict: 'name' })
    .select('name, slug, type, price_per_night, capacity, total_units, is_available')
    .order('price_per_night', { ascending: true })

  if (roomsError) {
    console.error('ERREUR rooms:', roomsError.message, roomsError.details)
    process.exit(1)
  }
  console.log('CHAMBRES (rooms) en base:')
  console.table(roomsData)

  // 2) Salle de conférence
  const { data: confData, error: confError } = await db
    .from('conference_rooms')
    .upsert(conferenceSeed, { onConflict: 'name' })
    .select('name, capacity, price_per_day, is_available')

  if (confError) {
    console.error('ERREUR conference_rooms:', confError.message, confError.details)
    process.exit(1)
  }
  console.log('\nSALLE (conference_rooms) en base:')
  console.table(confData)

  console.log('\nOK — insertion Rama terminée.')
}

main().catch((e) => {
  console.error('Erreur inattendue:', e)
  process.exit(1)
})