-- ============================================================
-- MIGRATION 006: Synchronisation Groupe → GHL
-- Migration strictement additive : ne modifie pas 005.
--
-- Ajout des colonnes de suivi GHL sur `group_requests`.
-- Aucune écriture : la migration est PRÉPARÉE, PAS appliquée.
-- La synchro reste inactive tant que GHL_GROUP_SYNC_ENABLED != 'true'.
-- ============================================================

begin;

alter table public.group_requests
  add column if not exists ghl_contact_id text,
  add column if not exists ghl_dossier_id text,
  add column if not exists ghl_opportunity_id text,
  add column if not exists ghl_sync_status text not null default 'pending',
  add column if not exists ghl_sync_attempts integer not null default 0,
  add column if not exists ghl_last_error text,
  add column if not exists ghl_last_synced_at timestamptz;

-- Contrainte sur les statuts autorisés
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'group_requests_ghl_sync_status_check'
      and conrelid = 'public.group_requests'::regclass
  ) then
    alter table public.group_requests
      add constraint group_requests_ghl_sync_status_check
      check (ghl_sync_status in ('pending', 'processing', 'partial', 'synced', 'failed'));
  end if;
end
$$;

create index if not exists idx_group_requests_ghl_sync_status
  on public.group_requests(ghl_sync_status);

commit;