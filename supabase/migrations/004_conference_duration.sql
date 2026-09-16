-- ============================================================
-- MIGRATION 004: Durée de location + tarif demi-journée (salles)
-- Additif uniquement. À appliquer manuellement (SQL Editor / supabase CLI
-- avec access token) — NE PAS exécuter automatiquement.
--
-- Contexte : la salle Hôtel Rama se loue
--   - Demi-journée : 1 000 000 GNF
--   - Journée : 2 000 000 GNF
-- Maison Blanche : pas de demi-journée (price_half_day = NULL) → inchangée.
-- ============================================================

begin;

-- 1) Tarif demi-journée OPTIONNEL par salle (NULL = pas de demi-journée)
alter table public.conference_rooms
  add column if not exists price_half_day integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'conference_rooms_price_half_day_check') then
    alter table public.conference_rooms
      add constraint conference_rooms_price_half_day_check
        check (price_half_day is null or price_half_day >= 0);
  end if;
end $$;

-- 2) Rama : tarif officiel demi-journée
update public.conference_rooms
  set price_half_day = 1000000
  where name = 'Rama — Salle de Conférence' and price_half_day is null;

-- 3) Durée d'une réservation (additif ; défaut 'full_day' = comportement actuel)
alter table public.conference_reservations
  add column if not exists duration text not null default 'full_day';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'conference_reservations_duration_check') then
    alter table public.conference_reservations
      add constraint conference_reservations_duration_check
        check (duration in ('half_day', 'full_day'));
  end if;
end $$;

commit;

-- ============================================================
-- VÉRIFICATION attendue
-- ============================================================
-- select name, price_per_day, price_half_day from public.conference_rooms order by name;
--   Rama — Salle de Conférence | 2000000 | 1000000
--   (Maison Blanche ...         | ...     | NULL)
-- select column_default from information_schema.columns
--  where table_name='conference_reservations' and column_name='duration';
--   full_day
-- ============================================================