-- ============================================================
-- MIGRATION P2 — Table des tentatives de paiement
-- Groupe Djamiyah — anti double-paiement
-- ============================================================
-- ADDITIVE et NON DESTRUCTIVE :
--   - aucune modification des tables existantes (reservations, rooms…)
--   - aucune donnée supprimée, aucun index cassé
-- À appliquer manuellement (préproduction puis production), jamais en aveugle.
-- L'application ne doit JAMAIS supprimer cette table (traces financières).
-- ⚠️ Cette migration n'est PAS exécutée dans le cadre du développement isolé P2.

begin;

-- ── 1. Table des tentatives de paiement ─────────────────────────────────────────
-- Une tentative = une ligne. Les identifiants et le montant proviennent du
-- serveur : l'application ne fait jamais confiance au navigateur.
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  -- 1 tentative par réservation (l'index partiel ci-dessous l'impose pour
  -- les tentatives ACTIVES ; l'historique terminal est conservé).
  reservation_id uuid not null references public.reservations(id),
  -- Référence commerciale MB-/RA- (identique à l'affichage, dérivée serveur).
  reference text not null,
  -- order_id transmis à ChapChap : UNIQUE par tentative (généré côté serveur).
  order_id text not null,
  -- Montant et devise capturés depuis reservations.total_price (source de vérité).
  amount integer not null check (amount > 0),
  currency text not null default 'GNF',
  -- État transactionnel explicite.
  status text not null default 'created'
    check (status in ('created', 'awaiting_pay', 'paid', 'failed', 'expired', 'unknown')),
  -- URL de caisse mémorisée (réutilisation uniquement si validité démontrée).
  payment_url text,
  -- Identifiants prestataire restitués (create et webhook).
  provider_operation_id text,
  provider_request_id text,
  -- Jeton de réclamation : garantit qu'une seule requête pilote l'appel
  -- ChapChap pour une tentative donnée (voir claim_expiry dans l'application).
  claim_token uuid,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 2. Contraintes et index ──────────────────────────────────────────────────────

-- Unicité globale de l'order_id : aucune collision possible, y compris entre
-- une tentative active et un historique, ou avec un format hérité.
alter table public.payment_attempts add constraint payment_attempts_order_id_key unique (order_id);

-- VERROU ANTI-DOUBLE-PAIEMENT :
-- Au plus UNE tentative active (created / awaiting_pay / unknown) par
-- réservation. L'insertion concurrente d'une seconde tentative échoue
-- (code PostgreSQL 23505) : c'est la barrière atomique, pas un verrou
-- applicatif. failed/expired/paid sortent de l'index → nouvelle tentative possible.
create unique index if not exists uq_payment_attempts_single_active
  on public.payment_attempts (reservation_id)
  where status in ('created', 'awaiting_pay', 'unknown');

-- Requêtes de reprise : historique par réservation, recherche par opération.
create index if not exists idx_payment_attempts_reservation_id
  on public.payment_attempts (reservation_id);
create index if not exists idx_payment_attempts_provider_operation_id
  on public.payment_attempts (provider_operation_id);

-- ── 3. Trigger updated_at (convention du projet) ──────────────────────────────
drop trigger if exists trg_payment_attempts_updated_at
  on public.payment_attempts;
create trigger trg_payment_attempts_updated_at
before update on public.payment_attempts
for each row
execute function public.set_updated_at();

-- ── 4. RLS — accès service_role uniquement (les écritures passent par les
-- routes serveurs, comme reservations et conference_reservations) ────────────
alter table public.payment_attempts enable row level security;

drop policy if exists "payment_attempts_service_role_all"
  on public.payment_attempts;
create policy "payment_attempts_service_role_all"
on public.payment_attempts
for all
to service_role
using (true)
with check (true);

commit;