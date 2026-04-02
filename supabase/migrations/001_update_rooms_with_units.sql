-- ============================================================
-- MIGRATION: Chambres standardisées avec slug et total_units
-- Groupe Djamiyah - Hôtel Maison Blanche
-- Exécutée le 2026-04-01 via Supabase Management API
-- ============================================================

begin;

-- ─── 1. Ajouter colonnes (nullable d'abord car des lignes existent déjà) ─────

alter table public.rooms
  add column if not exists slug text,
  add column if not exists total_units integer default 1;

-- ─── 2. Remplir slug depuis le name exact ────────────────────────────────────

update public.rooms set slug = 'chambre-confort',  total_units = 8  where name = 'Chambre Confort';
update public.rooms set slug = 'chambre-premium',  total_units = 5  where name = 'Chambre Premium';
update public.rooms set slug = 'double-premium',   total_units = 13 where name = 'Double Premium';
update public.rooms set slug = 'suite-premium',    total_units = 3  where name = 'Suite Premium';
update public.rooms set slug = 'suite-prestige',   total_units = 2  where name = 'Suite Prestige';

-- ─── 3. Supprimer toute ligne non standardisée (sans slug) ──────────────────

delete from public.rooms where slug is null;

-- ─── 4. Ajouter contraintes NOT NULL + UNIQUE ────────────────────────────────

alter table public.rooms
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rooms_slug_key'
  ) then
    alter table public.rooms add constraint rooms_slug_key unique (slug);
  end if;
end $$;

-- ─── 5. Mettre à jour descriptions, features et images ───────────────────────
-- Note: images est de type text[] (pas jsonb)

update public.rooms set
  description = 'Chambre confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs recherchant qualité et sérénité.',
  images = array['/images/maison-blanche/chambre-confort.jpg'],
  features = '["Climatisation", "Wi-Fi", "TV écran plat"]'::jsonb,
  is_available = true,
  updated_at = now()
where slug = 'chambre-confort';

update public.rooms set
  description = 'Chambre spacieuse premium avec équipements haut de gamme, mini-bar et service personnalisé pour un séjour d''exception.',
  images = array['/images/maison-blanche/chambre-premium.jpg'],
  features = '["Climatisation", "Wi-Fi", "TV écran plat", "Mini-bar", "Service VIP"]'::jsonb,
  is_available = true,
  updated_at = now()
where slug = 'chambre-premium';

update public.rooms set
  description = 'Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu''à 4 personnes.',
  images = array['/images/maison-blanche/double-premium.jpg'],
  features = '["Climatisation", "Wi-Fi", "TV écran plat", "Mini-bar", "Espace famille"]'::jsonb,
  is_available = true,
  updated_at = now()
where slug = 'double-premium';

update public.rooms set
  description = 'Suite élégante avec salon séparé, espaces de vie distincts et services exclusifs. Le luxe accessible.',
  images = array['/images/maison-blanche/suite-premium.jpg'],
  features = '["Climatisation", "Wi-Fi", "TV écran plat", "Salon séparé", "Mini-bar", "Service concierge"]'::jsonb,
  is_available = true,
  updated_at = now()
where slug = 'suite-premium';

update public.rooms set
  description = 'Notre suite la plus luxueuse avec grands volumes, jacuzzi et services sur mesure. L''expérience ultime du luxe absolu.',
  images = array['/images/maison-blanche/suite-prestige.jpg'],
  features = '["Climatisation", "Wi-Fi", "TV écran plat", "Salon séparé", "Jacuzzi", "Service concierge 24h/24", "Terrasse privée"]'::jsonb,
  is_available = true,
  updated_at = now()
where slug = 'suite-prestige';

-- ─── 6. Vérification finale ──────────────────────────────────────────────────

select
  name, slug, type, price_per_night,
  capacity, total_units, is_available,
  images[1] as image_path,
  jsonb_array_length(features) as nb_features
from public.rooms
order by price_per_night asc;

commit;

-- ============================================================
-- RÉSULTAT ATTENDU : 5 lignes exactement
-- chambre-confort   | 520000  | 8 unités
-- chambre-premium   | 720000  | 5 unités
-- double-premium    | 870000  | 13 unités
-- suite-premium     | 1070000 | 3 unités
-- suite-prestige    | 1620000 | 2 unités
-- ============================================================
