import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

export const sqlPlan = [
  'supabase/schema.sql',
  'scripts/local-tests/schema-compat.sql',
  'supabase/migrations/001_update_rooms_with_units.sql',
  'supabase/migrations/002_add_slug_and_total_units.sql',
  'supabase/migrations/002_ghl_oauth.sql',
  'supabase/migrations/003_create_conference_reservations.sql',
  'supabase/migrations/004_conference_duration.sql',
  'supabase/migrations/20260821_reserve_room_rpc.sql',
  'supabase/migrations/20261030_payment_attempts.sql',
  'supabase/migrations/20261031_claim_payment_attempt_rpc.sql',
]

// sql is a capability supplied only by the runner owning a NEW disposable
// database. No connection string, environment fallback or arbitrary target.
export function rebuild(sql, root) {
  for (const filename of sqlPlan) {
    const source = readFileSync(path.join(root, filename), 'utf8')
    const digest = createHash('sha256').update(source).digest('hex')
    const previous = sql(
      `SELECT sha256 FROM p2_bench.applied_files WHERE filename = '${filename}'`
    ).trim()
    if (previous) {
      if (previous !== digest)
        throw new Error('Historical SQL changed; create a new disposable bench.')
      continue
    }
    sql(source)
    sql(`INSERT INTO p2_bench.applied_files VALUES ('${filename}', '${digest}')`)
  }
}
