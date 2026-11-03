-- ============================================================
-- MIGRATION P1 — Corrélation webhook ChapChap + journalisation
-- Groupe Djamiyah — préparation GO paiements réels
-- ============================================================
-- ADDITIVE et NON DESTRUCTIVE :
--   - ajout de colonnes NULLables (aucune donnée existante touchée),
--   - nouvelle table de journal (aucune table existante modifiée).
-- À appliquer manuellement (préproduction puis production), JAMAIS en aveugle.
-- Il faut l'autorisation explicite du propriétaire avant application.
-- Cette migration est P1 et NE touche PAS payment_attempts (P2).
-- ============================================================

begin;

-- ── 1. Corrélation : order_id serveur + operation_id prestataire ───────────────
-- `chapchap_order_id` : la référence MB-/RA- générée par le SERVEUR à
--   l'initiation (réservations.hotel_name + id). C'est notre identifiant de
--   corrélation fiable : TOUJOURS connu, jamais fourni par le navigateur.
-- `chapchap_operation_id` : identifiant d'opération renvoyé par le CREATE
--   prestataire, S'IL EST ÉCHOÉ (champ à confirmer — best effort, null sinon).
alter table public.reservations
  add column if not exists chapchap_order_id text;
alter table public.reservations
  add column if not exists chapchap_operation_id text;

alter table public.conference_reservations
  add column if not exists chapchap_order_id text;
alter table public.conference_reservations
  add column if not exists chapchap_operation_id text;

-- ── 2. Journal des webhooks (aucune notification perdue silencieusement) ──────
-- Chaque webhook HMAC-valide est journalisé AVANT traitement ; le traitement
-- applique ensuite des transitions atomiques (CAS). Une notification refusée,
-- incohérente ou non vérifiable reste consultable ici pour reprise manuelle.
create table if not exists public.p1_webhook_events (
  id uuid primary key default gen_random_uuid(),
  -- Clé de déduplication (guide : operation_id OU request_id ; repli hash).
  provider_event_key text,
  provider_operation_id text,
  provider_request_id text,
  -- Référence d'ordre (order_id/payment_reference) portée par le webhook.
  order_id text,
  transaction_id text,
  reservation_type text not null default 'unknown'
    check (reservation_type in ('room', 'conference', 'unknown')),
  reservation_id uuid,
  raw_status text,
  amount numeric,
  currency text,
  received_status text not null default 'received'
    check (received_status in ('received', 'processed', 'anomaly', 'unverifiable', 'rejected', 'replay_requested')),
  outcome text,
  note text,
  raw_body jsonb not null,
  signature text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Unicité de la clé d'événement : deux livraisons simultanées du même webhook
-- ne créent qu'une seule ligne (conflit → lecture de l'existante, on ne duplique
-- jamais le traitement ; les transitions CAS assurent l'idempotence).
create unique index if not exists uq_p1_webhook_event_key
  on public.p1_webhook_events (provider_event_key)
  where provider_event_key is not null;

-- Requêtes opérationnelles : anomalies à traiter, historique par réservation.
create index if not exists idx_p1_webhook_events_status
  on public.p1_webhook_events (received_status);
create index if not exists idx_p1_webhook_events_reservation_id
  on public.p1_webhook_events (reservation_id);
create index if not exists idx_p1_webhook_events_received_at
  on public.p1_webhook_events (received_at);

-- ── 3. Trigger updated_at (convention du projet) ──────────────────────────────
drop trigger if exists trg_p1_webhook_events_updated_at on public.p1_webhook_events;
create trigger trg_p1_webhook_events_updated_at
before update on public.p1_webhook_events
for each row
execute function public.set_updated_at();

-- ── 4. RLS : accès service_role uniquement (comme reservations) ────────────────
alter table public.p1_webhook_events enable row level security;

drop policy if exists "p1_webhook_events_service_role_all" on public.p1_webhook_events;
create policy "p1_webhook_events_service_role_all"
on public.p1_webhook_events
for all
to service_role
using (true)
with check (true);

-- ── 5. RLS des nouvelles colonnes : héritée des policies existantes, RAS ───────

commit;

-- ============================================================
-- RETOUR ARRIÈRE (non destructif des données métiers)
-- En cas de problème avant GO : les colonnes sont NULLables, la table peut être
-- laissée (historique de traçabilité) ou supprimée ainsi :
--
--   begin;
--   drop policy if exists "p1_webhook_events_service_role_all" on public.p1_webhook_events;
--   drop table if exists public.p1_webhook_events;
--   alter table public.reservations drop column if exists chapchap_order_id;
--   alter table public.reservations drop column if exists chapchap_operation_id;
--   alter table public.conference_reservations drop column if exists chapchap_order_id;
--   alter table public.conference_reservations drop column if exists chapchap_operation_id;
--   commit;
--
-- ⚠️ Ordre de déploiement IMPÉRATIF : cette migration DOIT être appliquée AVANT
-- de déployer le code P1 journalisé. Sans la table `p1_webhook_events`, le
-- webhook répond 500 (journal non disponible) et les notifications ne sont pas
-- garanties. Les réservations créées AVANT cette migration n'ont pas de
-- `chapchap_order_id` : confirmées en corrélation « legacy_unverified »
-- (montant + devise + transaction requis — jamais « paid » sans preuve).
-- ============================================================

