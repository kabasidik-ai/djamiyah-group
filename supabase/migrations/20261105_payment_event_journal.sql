-- ============================================================
-- MIGRATION P2 (additive) — journal webhook durable + décisions
-- ============================================================

begin;

create table if not exists public.payment_event_journal (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  source text not null,
  reservation_id uuid null references public.reservations(id),
  attempt_id uuid null references public.payment_attempts(id),
  order_id text null,
  provider_operation_id text null,
  provider_request_id text null,
  status_raw text null,
  signature_valid boolean not null,
  payload_redacted jsonb not null,
  payload_sha256 text not null,
  dedup_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_payment_event_journal_dedup_key
  on public.payment_event_journal (dedup_key);

create index if not exists idx_payment_event_journal_attempt
  on public.payment_event_journal (attempt_id);

create index if not exists idx_payment_event_journal_reservation
  on public.payment_event_journal (reservation_id);

create table if not exists public.payment_event_processing (
  event_id uuid primary key references public.payment_event_journal(id) on delete cascade,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'reconciliation_required', 'rejected', 'storage_failed')),
  reconciliation_required boolean not null default false,
  processing_attempts integer not null default 1,
  last_error text null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_payment_event_processing_updated_at on public.payment_event_processing;
create trigger trg_payment_event_processing_updated_at
before update on public.payment_event_processing
for each row
execute function public.set_updated_at();

create table if not exists public.payment_reconciliation_decisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.payment_event_journal(id),
  decision text not null
    check (decision in ('confirm_paid', 'mark_failed', 'mark_expired', 'keep_pending', 'manual_followup')),
  reason text not null,
  actor_id text not null,
  approved_by text null,
  ticket_ref text null,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_payment_event_journal_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  raise exception 'payment_event_journal is append-only';
end;
$$;

drop trigger if exists trg_payment_event_journal_no_update on public.payment_event_journal;
create trigger trg_payment_event_journal_no_update
before update or delete on public.payment_event_journal
for each row
execute function public.prevent_payment_event_journal_mutation();

create or replace function public.persist_payment_webhook_event(
  p_source text,
  p_received_at timestamptz,
  p_signature_valid boolean,
  p_payload_redacted jsonb,
  p_payload_sha256 text,
  p_dedup_key text,
  p_reservation_id uuid default null,
  p_attempt_id uuid default null,
  p_order_id text default null,
  p_provider_operation_id text default null,
  p_provider_request_id text default null,
  p_status_raw text default null
)
returns table(event_id uuid, was_inserted boolean)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_event_id uuid;
  v_inserted boolean := false;
begin
  insert into public.payment_event_journal (
    source,
    received_at,
    signature_valid,
    payload_redacted,
    payload_sha256,
    dedup_key,
    reservation_id,
    attempt_id,
    order_id,
    provider_operation_id,
    provider_request_id,
    status_raw
  ) values (
    p_source,
    p_received_at,
    p_signature_valid,
    p_payload_redacted,
    p_payload_sha256,
    p_dedup_key,
    p_reservation_id,
    p_attempt_id,
    p_order_id,
    p_provider_operation_id,
    p_provider_request_id,
    p_status_raw
  )
  on conflict (dedup_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_event_id
    from public.payment_event_journal
    where dedup_key = p_dedup_key
    limit 1;
    v_inserted := false;
  else
    v_inserted := true;
  end if;

  insert into public.payment_event_processing (event_id, processing_status, reconciliation_required)
  values (v_event_id, 'received', false)
  on conflict on constraint payment_event_processing_pkey do nothing;

  return query select v_event_id, v_inserted;
end;
$$;

create or replace function public.mark_payment_event_processing(
  p_event_id uuid,
  p_processing_status text,
  p_last_error text default null,
  p_reconciliation_required boolean default null
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  update public.payment_event_processing
  set processing_status = p_processing_status,
      reconciliation_required = coalesce(p_reconciliation_required, reconciliation_required),
      processing_attempts = processing_attempts + 1,
      last_error = p_last_error,
      updated_at = now()
  where event_id = p_event_id;
end;
$$;

alter table public.payment_event_journal enable row level security;
alter table public.payment_event_processing enable row level security;
alter table public.payment_reconciliation_decisions enable row level security;

drop policy if exists "payment_event_journal_service_role_all" on public.payment_event_journal;
create policy "payment_event_journal_service_role_all"
on public.payment_event_journal
for all
to service_role
using (true)
with check (true);

drop policy if exists "payment_event_processing_service_role_all" on public.payment_event_processing;
create policy "payment_event_processing_service_role_all"
on public.payment_event_processing
for all
to service_role
using (true)
with check (true);

revoke all on table public.payment_event_journal from public, anon, authenticated;
revoke all on table public.payment_event_processing from public, anon, authenticated;
revoke all on table public.payment_reconciliation_decisions from public, anon, authenticated;

drop policy if exists "payment_reconciliation_decisions_service_role_all" on public.payment_reconciliation_decisions;
create policy "payment_reconciliation_decisions_service_role_all"
on public.payment_reconciliation_decisions
for all
to service_role
using (true)
with check (true);

revoke all on function public.persist_payment_webhook_event(text, timestamptz, boolean, jsonb, text, text, uuid, uuid, text, text, text, text) from public;
revoke all on function public.persist_payment_webhook_event(text, timestamptz, boolean, jsonb, text, text, uuid, uuid, text, text, text, text) from anon;
revoke all on function public.persist_payment_webhook_event(text, timestamptz, boolean, jsonb, text, text, uuid, uuid, text, text, text, text) from authenticated;
grant execute on function public.persist_payment_webhook_event(text, timestamptz, boolean, jsonb, text, text, uuid, uuid, text, text, text, text) to service_role;

revoke all on function public.mark_payment_event_processing(uuid, text, text, boolean) from public;
revoke all on function public.mark_payment_event_processing(uuid, text, text, boolean) from anon;
revoke all on function public.mark_payment_event_processing(uuid, text, text, boolean) from authenticated;
grant execute on function public.mark_payment_event_processing(uuid, text, text, boolean) to service_role;

commit;
