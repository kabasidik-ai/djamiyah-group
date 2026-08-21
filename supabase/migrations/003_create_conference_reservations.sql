-- ============================================================
-- MIGRATION 003: Réservations des salles de conférence
-- Migration strictement additive : aucune table existante modifiée
-- ============================================================

begin;

create table if not exists public.conference_reservations (
  id uuid primary key default gen_random_uuid(),
  conference_room_id uuid not null references public.conference_rooms(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,

  event_date date not null,
  participants integer not null check (participants > 0),
  event_type text not null,
  special_requests text,

  total_price integer not null check (total_price >= 0),
  currency text not null default 'GNF',
  status public.reservation_status_enum not null default 'awaiting_confirmation',
  payment_status public.payment_status_enum not null default 'pending',
  payment_method public.payment_method_enum,
  transaction_id text,
  hold_expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint conference_reservations_event_date_not_past
    check (event_date >= created_at::date)
);

create index if not exists idx_conference_reservations_room
  on public.conference_reservations(conference_room_id);

create index if not exists idx_conference_reservations_event_date
  on public.conference_reservations(event_date);

create index if not exists idx_conference_reservations_customer
  on public.conference_reservations(customer_id);

create index if not exists idx_conference_reservations_status
  on public.conference_reservations(status);

-- Une seule réservation active par salle et par jour.
-- L'index unique garantit l'atomicité même si deux requêtes arrivent simultanément.
create unique index if not exists uq_conference_reservations_active_room_date
  on public.conference_reservations(conference_room_id, event_date)
  where status in ('pending', 'awaiting_confirmation', 'confirmed');

drop trigger if exists trg_conference_reservations_updated_at
  on public.conference_reservations;
create trigger trg_conference_reservations_updated_at
before update on public.conference_reservations
for each row
execute function public.set_updated_at();

alter table public.conference_reservations enable row level security;

-- Toutes les écritures et lectures de réservations passent par les routes serveur.
drop policy if exists "conference_reservations_service_role_all"
  on public.conference_reservations;
create policy "conference_reservations_service_role_all"
on public.conference_reservations
for all
to service_role
using (true)
with check (true);

commit;
