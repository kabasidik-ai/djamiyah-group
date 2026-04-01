-- ============================================================
-- DJAMIYAH GROUP - SETUP COMPLET BASE DE DONNÉES CHAMBRES
-- Hôtel Maison Blanche
-- ============================================================
-- Instructions:
--   1. Ouvrir Supabase Dashboard → SQL Editor
--   2. Copier-coller ce script entier
--   3. Cliquer sur "Run"
-- ============================================================

begin;

-- ============================================================
-- ÉTAPE 1 : EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- ÉTAPE 2 : TYPES ENUM
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status_enum') then
    create type payment_status_enum as enum ('pending', 'paid', 'failed', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method_enum') then
    create type payment_method_enum as enum ('orange_money', 'mtn_momo', 'card', 'cash');
  end if;

  if not exists (select 1 from pg_type where typname = 'reservation_status_enum') then
    create type reservation_status_enum as enum ('confirmed', 'cancelled', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'room_type_enum') then
    create type room_type_enum as enum ('standard', 'premium', 'suite');
  end if;
end $$;

-- ============================================================
-- ÉTAPE 3 : TABLES
-- ============================================================

-- TABLE: customers
create table if not exists public.customers (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  first_name    text        not null,
  last_name     text        not null,
  phone         text,
  total_bookings integer    not null default 0 check (total_bookings >= 0),
  total_spent   bigint      not null default 0 check (total_spent >= 0),
  loyalty_points integer    not null default 0 check (loyalty_points >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- TABLE: rooms (chambres de l'hôtel) - AVEC total_units
create table if not exists public.rooms (
  id              uuid             primary key default gen_random_uuid(),
  name            text             not null unique,
  type            room_type_enum   not null,
  price_per_night integer          not null check (price_per_night >= 0),
  capacity        integer          not null check (capacity > 0),
  total_units     integer          not null default 1 check (total_units > 0),
  description     text,
  features        jsonb            not null default '[]'::jsonb,
  images          text[]           not null default '{}',
  is_available    boolean          not null default true,
  created_at      timestamptz      not null default now(),
  updated_at      timestamptz      not null default now()
);

-- TABLE: conference_rooms (salles de conférence)
create table if not exists public.conference_rooms (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,
  capacity      integer     not null check (capacity > 0),
  price_per_day integer     not null check (price_per_day >= 0),
  description   text,
  features      text[]      not null default '{}',
  images        text[]      not null default '{}',
  is_available  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- TABLE: reservations
create table if not exists public.reservations (
  id                       uuid                      primary key default gen_random_uuid(),
  created_at               timestamptz               not null default now(),
  updated_at               timestamptz               not null default now(),

  -- Coordonnées client (snapshot au moment de la réservation)
  first_name               text                      not null,
  last_name                text                      not null,
  email                    text                      not null,
  phone                    text,

  -- Détails réservation hôtel
  hotel_name               text                      not null,
  room_type                text                      not null,
  check_in                 date                      not null,
  check_out                date                      not null,
  guests                   integer                   not null check (guests > 0),
  total_price              integer                   not null check (total_price >= 0),
  currency                 text                      not null default 'GNF',

  -- Paiement
  payment_status           payment_status_enum       not null default 'pending',
  payment_method           payment_method_enum,
  chapchap_transaction_id  text,

  -- Statut réservation
  status                   reservation_status_enum   not null default 'confirmed',

  -- Relation optionnelle vers table customers
  customer_id              uuid references public.customers(id) on delete set null,

  constraint reservations_check_dates check (check_out > check_in)
);

-- ============================================================
-- ÉTAPE 4 : INDEX DE PERFORMANCE
-- ============================================================

-- Reservations
create index if not exists idx_reservations_email          on public.reservations(email);
create index if not exists idx_reservations_check_in       on public.reservations(check_in);
create index if not exists idx_reservations_check_out      on public.reservations(check_out);
create index if not exists idx_reservations_status         on public.reservations(status);
create index if not exists idx_reservations_payment_status on public.reservations(payment_status);
create index if not exists idx_reservations_created_at     on public.reservations(created_at desc);
create index if not exists idx_reservations_customer_id    on public.reservations(customer_id);

-- Customers
create index if not exists idx_customers_email      on public.customers(email);
create index if not exists idx_customers_created_at on public.customers(created_at desc);

-- Rooms
create index if not exists idx_rooms_type      on public.rooms(type);
create index if not exists idx_rooms_available on public.rooms(is_available);
create index if not exists idx_rooms_price     on public.rooms(price_per_night);

-- Conference rooms
create index if not exists idx_conference_rooms_available on public.conference_rooms(is_available);
create index if not exists idx_conference_rooms_price     on public.conference_rooms(price_per_day);

-- ============================================================
-- ÉTAPE 5 : TRIGGER updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customers_updated_at       on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_rooms_updated_at           on public.rooms;
create trigger trg_rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

drop trigger if exists trg_conference_rooms_updated_at on public.conference_rooms;
create trigger trg_conference_rooms_updated_at
  before update on public.conference_rooms
  for each row execute function public.set_updated_at();

drop trigger if exists trg_reservations_updated_at    on public.reservations;
create trigger trg_reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ============================================================
-- ÉTAPE 6 : ROW LEVEL SECURITY (RLS) + POLICIES
-- ============================================================

alter table public.customers       enable row level security;
alter table public.rooms           enable row level security;
alter table public.conference_rooms enable row level security;
alter table public.reservations    enable row level security;

-- Customers : accès back-office uniquement (service_role)
drop policy if exists "customers_service_role_all" on public.customers;
create policy "customers_service_role_all"
  on public.customers for all to service_role
  using (true) with check (true);

-- Rooms : lecture publique, écriture service_role
drop policy if exists "rooms_public_read"        on public.rooms;
create policy "rooms_public_read"
  on public.rooms for select to anon, authenticated
  using (true);

drop policy if exists "rooms_service_role_write" on public.rooms;
create policy "rooms_service_role_write"
  on public.rooms for all to service_role
  using (true) with check (true);

-- Conference rooms : lecture publique, écriture service_role
drop policy if exists "conference_rooms_public_read"        on public.conference_rooms;
create policy "conference_rooms_public_read"
  on public.conference_rooms for select to anon, authenticated
  using (true);

drop policy if exists "conference_rooms_service_role_write" on public.conference_rooms;
create policy "conference_rooms_service_role_write"
  on public.conference_rooms for all to service_role
  using (true) with check (true);

-- Reservations : insertion publique, gestion complète service_role
drop policy if exists "reservations_public_insert"   on public.reservations;
create policy "reservations_public_insert"
  on public.reservations for insert to anon, authenticated
  with check (true);

drop policy if exists "reservations_service_role_all" on public.reservations;
create policy "reservations_service_role_all"
  on public.reservations for all to service_role
  using (true) with check (true);

commit;

-- ============================================================
-- ÉTAPE 7 : INSERTION DES 5 CHAMBRES AVEC UNITÉS
-- ============================================================
-- Répartition exacte :
-- - Chambre Éco Confort : 8 unités (280 000 GNF)
-- - Chambre Confort Jardin : 8 unités (520 000 GNF)
-- - Chambre Premium VIP : 5 unités (720 000 GNF)
-- - Double Premium : 13 unités (870 000 GNF)
-- - Grande Suite Prestige : 3 unités (1 620 000 GNF)
-- ============================================================

begin;

insert into public.rooms (
  name,
  type,
  price_per_night,
  capacity,
  total_units,
  description,
  features,
  images,
  is_available
)
values
  -- 1. Chambre Éco Confort (8 unités)
  (
    'Chambre Éco Confort',
    'standard',
    280000,
    2,
    8,
    'Chambre économique et confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs soucieux de leur budget.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Salle de bain privée"]'::jsonb,
    array['/images/maison-blanche/chambre-confort.jpg'],
    true
  ),

  -- 2. Chambre Confort Jardin (8 unités)
  (
    'Chambre Confort Jardin',
    'standard',
    520000,
    2,
    8,
    'Chambre confortable avec vue sur jardin, climatisation et équipements de qualité. Profitez d''un séjour reposant dans un cadre verdoyant.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Vue jardin", "Service en chambre"]'::jsonb,
    array['/images/maison-blanche/chambre-confort.jpg'],
    true
  ),

  -- 3. Chambre Premium VIP (5 unités)
  (
    'Chambre Premium VIP',
    'premium',
    720000,
    2,
    5,
    'Chambre spacieuse premium VIP avec équipements haut de gamme et service personnalisé pour un séjour d''exception.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Mini-bar", "Literie premium", "Service VIP"]'::jsonb,
    array['/images/maison-blanche/chambre-premium.jpg'],
    true
  ),

  -- 4. Double Premium (13 unités)
  (
    'Double Premium',
    'premium',
    870000,
    4,
    13,
    'Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu''à 4 personnes.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Mini-bar", "Espace famille", "Deux lits doubles"]'::jsonb,
    array['/images/maison-blanche/double-premium.jpg'],
    true
  ),

  -- 5. Grande Suite Prestige (3 unités)
  (
    'Grande Suite Prestige',
    'suite',
    1620000,
    6,
    3,
    'Notre suite la plus luxueuse avec grands volumes, salon séparé et services exclusifs. L''expérience ultime du luxe.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Salon séparé", "Service concierge", "Jacuzzi", "Terrasse privée"]'::jsonb,
    array['/images/maison-blanche/suite-premium.jpg'],
    true
  )

on conflict (name) do update set
  type            = excluded.type,
  price_per_night = excluded.price_per_night,
  capacity        = excluded.capacity,
  total_units     = excluded.total_units,
  description     = excluded.description,
  features        = excluded.features,
  images          = excluded.images,
  is_available    = excluded.is_available,
  updated_at      = now();

-- ============================================================
-- ÉTAPE 8 : INSERTION DES 4 SALLES DE CONFÉRENCE
-- ============================================================

insert into public.conference_rooms (
  name,
  capacity,
  price_per_day,
  description,
  features,
  is_available
)
values
  (
    'Wonkifon',
    20,
    1500000,
    'Salle intimiste pour réunions et séminaires restreints. Idéale pour les petits groupes de travail.',
    array['Équipement audio-visuel', 'Climatisation', 'Wi-Fi haut débit', 'Service de restauration', 'Tableau blanc interactif'],
    true
  ),

  (
    'Somayah',
    50,
    2000000,
    'Espace polyvalent pour conférences de taille moyenne. Parfait pour séminaires et formations.',
    array['Équipement audio-visuel', 'Climatisation', 'Wi-Fi haut débit', 'Service de restauration', 'Scène', 'Système de sonorisation'],
    true
  ),

  (
    'Maneah',
    75,
    2500000,
    'Grande salle équipée pour événements professionnels et conférences de grande envergure.',
    array['Équipement audio-visuel', 'Climatisation', 'Wi-Fi haut débit', 'Service de restauration', 'Scène', 'Système de sonorisation', 'Cabines de traduction'],
    true
  ),

  (
    'Soumbouyah',
    150,
    5000000,
    'Notre plus grande salle pour congrès, mariages et grands événements. Espace modulable et entièrement équipé.',
    array['Équipement audio-visuel', 'Climatisation', 'Wi-Fi haut débit', 'Service de restauration', 'Grande scène', 'Système de sonorisation professionnel', 'Cabines de traduction', 'Espace cocktail', 'Décoration sur mesure'],
    true
  )

on conflict (name) do update set
  capacity      = excluded.capacity,
  price_per_day = excluded.price_per_day,
  description   = excluded.description,
  features      = excluded.features,
  is_available  = excluded.is_available,
  updated_at    = now();

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

-- Afficher les chambres avec unités
select
  name,
  type,
  price_per_night,
  capacity,
  total_units,
  is_available,
  created_at
from public.rooms
order by price_per_night asc;

-- Afficher les salles de conférence
select
  name,
  capacity,
  price_per_day,
  is_available,
  created_at
from public.conference_rooms
order by capacity asc;

-- Total des unités par type
select
  name,
  total_units,
  price_per_night,
  (total_units * price_per_night) as total_capacity_value
from public.rooms
order by price_per_night asc;

commit;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
