-- ============================================================
-- MIGRATION P2 — Barrière persistante de dispatch + settle conditionnel
-- Groupe Djamiyah — anti double-dispatch ChapChap
-- ============================================================
-- ADDITIVE et NON DESTRUCTIVE :
--   - ne supprime/modifie aucune contrainte historique
--   - ajoute colonnes + RPC atomiques service_role-only

begin;

alter table public.payment_attempts
  add column if not exists dispatch_consumed boolean not null default false,
  add column if not exists dispatch_authorized_at timestamptz,
  add column if not exists dispatch_token uuid;

comment on column public.payment_attempts.dispatch_consumed is
  'True dès la première autorisation d''appel prestataire. Barrière persistante: jamais de 2e dispatch auto.';
comment on column public.payment_attempts.dispatch_authorized_at is
  'Instant atomique de la première autorisation de dispatch provider.';
comment on column public.payment_attempts.dispatch_token is
  'Jeton de claim ayant obtenu l''autorisation de dispatch (traces forensics).';

create or replace function public.begin_provider_dispatch(
  p_attempt_id uuid,
  p_claim_token uuid,
  p_claimed_before timestamptz
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_reservation_status text;
begin
  select *
  into v_attempt
  from public.payment_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_attempt.dispatch_consumed or v_attempt.dispatch_authorized_at is not null then
    return 'already_consumed';
  end if;

  if v_attempt.status <> 'created' then
    return 'not_dispatchable';
  end if;

  if not (
    v_attempt.claim_token = p_claim_token
    or v_attempt.claimed_at is null
    or v_attempt.claimed_at < p_claimed_before
  ) then
    return 'not_claim_owner';
  end if;

  -- Verrouille la réservation pour sérialiser le check payment_status
  -- avec un update concurrent webhook (FOR UPDATE des deux côtés).
  select r.payment_status
  into v_reservation_status
  from public.reservations r
  where r.id = v_attempt.reservation_id
  for update;

  if not found then
    return 'reservation_missing';
  end if;

  if lower(coalesce(v_reservation_status, 'pending')) = 'paid' then
    return 'reservation_paid';
  end if;

  update public.payment_attempts
  set dispatch_consumed = true,
      dispatch_authorized_at = now(),
      dispatch_token = p_claim_token,
      claim_token = p_claim_token,
      claimed_at = now()
  where id = p_attempt_id;

  return 'authorized';
end;
$$;

revoke all on function public.begin_provider_dispatch(uuid, uuid, timestamptz) from public;
revoke all on function public.begin_provider_dispatch(uuid, uuid, timestamptz) from anon;
revoke all on function public.begin_provider_dispatch(uuid, uuid, timestamptz) from authenticated;
grant execute on function public.begin_provider_dispatch(uuid, uuid, timestamptz) to service_role;

create or replace function public.settle_payment_attempt(
  p_attempt_id uuid,
  p_decision text,
  p_payment_url text default null,
  p_provider_operation_id text default null,
  p_provider_request_id text default null
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_attempt public.payment_attempts%rowtype;
begin
  select *
  into v_attempt
  from public.payment_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_attempt.status in ('paid', 'failed', 'expired', 'unknown') then
    return 'terminal_blocked';
  end if;

  if p_decision = 'ok' then
    if v_attempt.status <> 'created' then
      return 'terminal_blocked';
    end if;

    update public.payment_attempts
    set status = 'awaiting_pay',
        payment_url = coalesce(p_payment_url, payment_url),
        provider_operation_id = coalesce(p_provider_operation_id, provider_operation_id),
        provider_request_id = coalesce(p_provider_request_id, provider_request_id)
    where id = p_attempt_id;

    return 'updated';
  end if;

  if p_decision = 'failed' then
    if v_attempt.status <> 'created' then
      return 'terminal_blocked';
    end if;

    update public.payment_attempts
    set status = 'failed'
    where id = p_attempt_id;

    return 'updated';
  end if;

  if p_decision = 'unknown' then
    if v_attempt.status <> 'created' then
      return 'terminal_blocked';
    end if;

    update public.payment_attempts
    set status = 'unknown'
    where id = p_attempt_id;

    return 'updated';
  end if;

  return 'invalid_decision';
end;
$$;

revoke all on function public.settle_payment_attempt(uuid, text, text, text, text) from public;
revoke all on function public.settle_payment_attempt(uuid, text, text, text, text) from anon;
revoke all on function public.settle_payment_attempt(uuid, text, text, text, text) from authenticated;
grant execute on function public.settle_payment_attempt(uuid, text, text, text, text) to service_role;

commit;
