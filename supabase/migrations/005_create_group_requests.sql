-- ============================================================
-- MIGRATION 005: Demandes « Groupes & Séminaires »
-- Migration strictement additive : aucune table existante modifiée.
--
-- Source officielle de vérité : Supabase.
-- La disponibilité, les prestations et le tarif sont validés par
-- un responsable humain ; la table stocke donc des DEMANDES en
-- attente (statut « received »), jamais des confirmations.
--
-- REMARQUE : aucune notion d'appel d'offres côté public. Une
-- demande réellement liée à un appel d'offres est qualifiée
-- manuellement par l'équipe (dans GHL).
-- ============================================================

begin;

create table if not exists public.group_requests (
  id uuid primary key default gen_random_uuid(),

  -- Référence de dossier + clé d'idempotence (unicité des envois)
  reference text not null unique,
  idempotency_key text not null unique,

  -- Provenance (site / Djami) et établissement concerné
  source text not null default 'site',
  establishment text not null default 'maison-blanche-coyah',

  -- Statut de la demande (recherche / validation humaine)
  status text not null default 'received',

  -- Sections du modèle GroupRequest (snapshot au moment de la demande)
  contact jsonb not null,
  company jsonb not null,
  event jsonb not null,
  accommodation jsonb,
  catering jsonb,
  comments text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_group_requests_created_at
  on public.group_requests(created_at desc);

create index if not exists idx_group_requests_status
  on public.group_requests(status);

create index if not exists idx_group_requests_establishment
  on public.group_requests(establishment);

-- Pour retrouver rapidement une demande d'un même contact
create index if not exists idx_group_requests_contact_email
  on public.group_requests using gin (contact jsonb_path_ops);

drop trigger if exists trg_group_requests_updated_at on public.group_requests;
create trigger trg_group_requests_updated_at
before update on public.group_requests
for each row
execute function public.set_updated_at();

alter table public.group_requests enable row level security;

-- ============================================================
-- POLITIQUES RLS FINALES
-- ------------------------
-- Toutes les écritures/lectures passent UNIQUEMENT par la route
-- serveur POST /api/group-requests, qui utilise le client
-- `service_role` (createServiceRoleClient). Le navigateur n'écrit
-- jamais directement dans la table.
--
-- 1) service_role -> ALL (back-office / API serveur uniquement)
-- 2) anon / authenticated -> AUCUNE politique : ni lecture ni
--    insertion directe. Par défaut RLS refuse toute opération
--    sans politique explicite. Le formulaire public ne peut donc
--    ni lire ni insérer directement.
--
-- Aucune politique « trop large » (authenticated read-all, etc.)
-- n'est créée volontairement.
-- ============================================================

drop policy if exists "group_requests_service_role_all" on public.group_requests;
create policy "group_requests_service_role_all"
on public.group_requests
for all
to service_role
using (true)
with check (true);

-- Aucune politique pour anon/authenticated : accès direct public refusé.
-- (Les anciennes politiques public_insert sont explicitement supprimées
--  ci-dessous, pour pouvoir appliquer ce fichier de façon idempotente.)
drop policy if exists "group_requests_public_insert" on public.group_requests;

commit;