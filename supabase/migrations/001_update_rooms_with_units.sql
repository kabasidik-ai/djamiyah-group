-- ============================================================
-- MIGRATION: Chambres standardisées avec slug
-- Groupe Djamiyah - Hôtel Maison Blanche
-- ============================================================

begin;

-- ─── 1. Ajouter colonne slug si elle n'existe pas ─────────────────

alter table public.rooms
add column if not exists slug text unique not null;

-- ─── 2. Supprimer toutes les chambres non standardisées ────────────

-- Garder seulement les 5 chambres officielles
delete from public.rooms
where slug not in (
  'chambre-confort',
  'chambre-premium', 
  'double-premium',
  'suite-premium',
  'suite-prestige'
) or slug is null;

-- ─── 3. UPSERT des 5 chambres standardisées ────────────────────────

-- Chambre Confort
insert into public.rooms (name, slug, description, price_per_night, capacity, total_units, type, features, images, is_available)
values (
  'Chambre Confort',
  'chambre-confort',
  'Chambre confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs recherchant qualité et sérénité.',
  520000,
  2,
  8,
  'standard',
  '["Climatisation", "Wi-Fi", "TV écran plat"]'::jsonb,
  '["/images/maison-blanche/chambre-confort.jpg"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  total_units = excluded.total_units,
  type = excluded.type,
  features = excluded.features,
  images = excluded.images,
  is_available = excluded.is_available,
  updated_at = now();

-- Chambre Premium
insert into public.rooms (name, slug, description, price_per_night, capacity, total_units, type, features, images, is_available)
values (
  'Chambre Premium',
  'chambre-premium',
  'Chambre spacieuse premium avec équipements haut de gamme, mini-bar et service personnalisé pour un séjour d''exception.',
  720000,
  2,
  5,
  'premium',
  '["Climatisation", "Wi-Fi", "TV écran plat", "Mini-bar", "Service VIP"]'::jsonb,
  '["/images/maison-blanche/chambre-premium.jpg"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  total_units = excluded.total_units,
  type = excluded.type,
  features = excluded.features,
  images = excluded.images,
  is_available = excluded.is_available,
  updated_at = now();

-- Double Premium
insert into public.rooms (name, slug, description, price_per_night, capacity, total_units, type, features, images, is_available)
values (
  'Double Premium',
  'double-premium',
  'Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu''à 4 personnes.',
  870000,
  4,
  13,
  'premium',
  '["Climatisation", "Wi-Fi", "TV écran plat", "Mini-bar", "Espace famille"]'::jsonb,
  '["/images/maison-blanche/double-premium.jpg"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  total_units = excluded.total_units,
  type = excluded.type,
  features = excluded.features,
  images = excluded.images,
  is_available = excluded.is_available,
  updated_at = now();

-- Suite Premium
insert into public.rooms (name, slug, description, price_per_night, capacity, total_units, type, features, images, is_available)
values (
  'Suite Premium',
  'suite-premium',
  'Suite élégante avec salon séparé, espaces de vie distincts et services exclusifs. Le luxe accessible.',
  1070000,
  2,
  3,
  'suite',
  '["Climatisation", "Wi-Fi", "TV écran plat", "Salon séparé", "Mini-bar", "Service concierge"]'::jsonb,
  '["/images/maison-blanche/suite-premium.jpg"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  total_units = excluded.total_units,
  type = excluded.type,
  features = excluded.features,
  images = excluded.images,
  is_available = excluded.is_available,
  updated_at = now();

-- Suite Prestige
insert into public.rooms (name, slug, description, price_per_night, capacity, total_units, type, features, images, is_available)
values (
  'Suite Prestige',
  'suite-prestige',
  'Notre suite la plus luxueuse avec grands volumes, jacuzzi et services sur mesure. L''expérience ultime du luxe absolu.',
  1620000,
  2,
  2,
  'suite',
  '["Climatisation", "Wi-Fi", "TV écran plat", "Salon séparé", "Jacuzzi", "Service concierge 24h/24", "Terrasse privée"]'::jsonb,
  '["/images/maison-blanche/suite-prestige.jpg"]'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  total_units = excluded.total_units,
  type = excluded.type,
  features = excluded.features,
  images = excluded.images,
  is_available = excluded.is_available,
  updated_at = now();

-- ─── 4. Vérification ─────────────────────────────────────────────────

select 
  name,
  slug,
  type,
  price_per_night,
  capacity,
  total_units,
  is_available
from public.rooms
order by price_per_night asc;

commit;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
