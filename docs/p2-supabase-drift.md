# P2 — Écarts constatés : `schema.sql`, migrations et banc local

Documentation des divergences OBSERVÉES entre les artefacts SQL du dépôt et le comportement effectif
sur un banc propre (PostgreSQL 17 via Supabase local). **Aucune modification de schéma de production
n'est proposée ni effectuée ici.**

## Observations (banc local reconstitué le 2026-10-30)

| #   | Artefact                                           | Divergence                                                                                                                                                                                                         | Impact                                                                                                                                                                                                              |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `supabase/schema.sql`                              | L'enum `reservation_status_enum` n'y contient que `{confirmed, cancelled, completed}` — les labels `pending` et `awaiting_confirmation` (utilisés par la migration `003` et les types `database.ts`) sont absents. | `supabase start` / `db reset` échouent sur `003_create_conference_reservations.sql` (`invalid input value for enum … "awaiting_confirmation"`). Correction banc locale : `ALTER TYPE … ADD VALUE IF NOT EXISTS` ×2. |
| 2   | `supabase/migrations/001/002` + `insert-rooms.sql` | La table `rooms` n'est créée par AUCUNE migration (elle n'existe que dans `schema.sql`) ; `insert-rooms.sql` omet `slug` et `total_units` devenus `NOT NULL`.                                                      | Échec `null value in column "slug"` sur base fraîche. Les migrations ne sont donc pas auto-suffisantes : le rejeu complet exige `schema.sql` PUIS les migrations (et des seeds corrigés).                           |
| 3   | `schema.sql` vs RPC `reserve_room`                 | `reservations` (schéma du dépôt) ne possède **pas** de colonne `room_id`, alors que `20260821_reserve_room_rpc.sql` l'écrit (et la RLS/types en héritent côté prod).                                               | La RPC planterait à l'exécution sur un banc fidèle au dépôt ; la production a visiblement une colonne ajoutée hors migrations (gestion manuelle).                                                                   |
| 4   | `schema.sql`                                       | Contient 4 tables seulement (`rooms, reservations, customers, conference_rooms`).                                                                                                                                  | `ghl_oauth_tokens`, `site_config`, `conference_reservations` ne viennent que des migrations (002/003) — OK si ordre respecté.                                                                                       |
| 5   | `payment_attempts` (`20261030`)                    | Table **absente de `schema.sql`** (normal : postérieure) ; sans conflit de nom ; appliquée en dernier avec succès sur le banc.                                                                                     | Aucun impact — vérifié : 8 tables, index partiel `uq_…_single_active` opérationnel.                                                                                                                                 |

## Conséquence opérationnelle

Pour reconstruire un environnement fidèle à PRODUCTION, il faut soit réconcilier `schema.sql` avec
les migrations (hors périmètre), soit appliquer dans l'ordre : `schema.sql` → correctifs enum (2
labels) → migrations → seeds corrigés. Le banc local actuel reflète cet état ; les tests P2 (index
partiel, claim) ont été validés sur ce socle.

## Non couvert

- Contenu de production réel (aucun accès) : la présence de `room_id`/valeurs d'enum y est supposée
  d'après le code, non vérifiée.
- Migration production : interdite dans ce cadre.
