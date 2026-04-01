-- ============================================================
-- DJAMIYAH HOTEL - SUPABASE SCHEMA
-- ============================================================
-- Ce script crée:
-- - Enums métier
-- - Tables: reservations, rooms, conference_rooms, customers
-- - Index de performance
-- - Trigger updated_at
-- - RLS + policies de sécurité
-- ============================================================

begin;

-- Extension pour UUID
create extension if not exists pgcrypto;

-- ============================================================
-- 1) TYPES ENUM
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
end
$$;

-- ============================================================
-- 2) TABLES
-- ============================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  total_bookings integer not null default 0 check (total_bookings >= 0),
  total_spent bigint not null default 0 check (total_spent >= 0),
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type room_type_enum not null,
  price_per_night integer not null check (price_per_night >= 0),
  capacity integer not null check (capacity > 0),
  description text,
  features jsonb not null default '[]'::jsonb,
  images text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conference_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  capacity integer not null check (capacity > 0),
  price_per_day integer not null check (price_per_day >= 0),
  description text,
  features text[] not null default '{}',
  images text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Coordonnées client (snapshot au moment de la réservation)
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,

  -- Détails réservation hôtel
  hotel_name text not null,
  room_type text not null,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests > 0),
  total_price integer not null check (total_price >= 0),
  currency text not null default 'GNF',

  -- Paiement
  payment_status payment_status_enum not null default 'pending',
  payment_method payment_method_enum,
  chapchap_transaction_id text,

  -- Statut réservation
  status reservation_status_enum not null default 'confirmed',

  -- Relation optionnelle vers table customers
  customer_id uuid references public.customers(id) on delete set null,

  constraint reservations_check_dates check (check_out > check_in)
);

-- ============================================================
-- 3) INDEXES (PERFORMANCE)
-- ============================================================

-- Reservations
create index if not exists idx_reservations_email on public.reservations(email);
create index if not exists idx_reservations_check_in on public.reservations(check_in);
create index if not exists idx_reservations_check_out on public.reservations(check_out);
create index if not exists idx_reservations_status on public.reservations(status);
create index if not exists idx_reservations_payment_status on public.reservations(payment_status);
create index if not exists idx_reservations_created_at on public.reservations(created_at desc);
create index if not exists idx_reservations_customer_id on public.reservations(customer_id);

-- Customers
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_created_at on public.customers(created_at desc);

-- Rooms
create index if not exists idx_rooms_type on public.rooms(type);
create index if not exists idx_rooms_available on public.rooms(is_available);
create index if not exists idx_rooms_price on public.rooms(price_per_night);

-- Conference rooms
create index if not exists idx_conference_rooms_available on public.conference_rooms(is_available);
create index if not exists idx_conference_rooms_price on public.conference_rooms(price_per_day);

-- ============================================================
-- 4) TRIGGER updated_at
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

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_rooms_updated_at on public.rooms;
create trigger trg_rooms_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

drop trigger if exists trg_conference_rooms_updated_at on public.conference_rooms;
create trigger trg_conference_rooms_updated_at
before update on public.conference_rooms
for each row
execute function public.set_updated_at();

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

-- ============================================================
-- 5) RLS + POLICIES
-- ============================================================

alter table public.customers enable row level security;
alter table public.rooms enable row level security;
alter table public.conference_rooms enable row level security;
alter table public.reservations enable row level security;

-- Customers: accès back-office uniquement (service role)
drop policy if exists "customers_service_role_all" on public.customers;
create policy "customers_service_role_all"
on public.customers
for all
to service_role
using (true)
with check (true);

-- Rooms: lecture publique, écriture service_role
drop policy if exists "rooms_public_read" on public.rooms;
create policy "rooms_public_read"
on public.rooms
for select
to anon, authenticated
using (true);

drop policy if exists "rooms_service_role_write" on public.rooms;
create policy "rooms_service_role_write"
on public.rooms
for all
to service_role
using (true)
with check (true);

-- Conference rooms: lecture publique, écriture service_role
drop policy if exists "conference_rooms_public_read" on public.conference_rooms;
create policy "conference_rooms_public_read"
on public.conference_rooms
for select
to anon, authenticated
using (true);

drop policy if exists "conference_rooms_service_role_write" on public.conference_rooms;
create policy "conference_rooms_service_role_write"
on public.conference_rooms
for all
to service_role
using (true)
with check (true);

-- Reservations:
-- - insertion possible depuis le site (anon/authenticated)
-- - consultation/modification complète côté back-office (service_role)
drop policy if exists "reservations_public_insert" on public.reservations;
create policy "reservations_public_insert"
on public.reservations
for insert
to anon, authenticated
with check (true);

drop policy if exists "reservations_service_role_all" on public.reservations;
create policy "reservations_service_role_all"
on public.reservations
for all
to service_role
using (true)
with check (true);

commit;

-- ============================================================
-- FIN
-- ============================================================