-- ============================================================
-- MIGRATION P2 (additive) — blocage dispatch si une tentative paid
-- existe déjà pour la réservation (même si payment_status réservation
-- reste pending suite à incohérence transitoire/historique).
-- ============================================================

begin;

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
  v_reservation_payment_status text;
  v_reservation_status text;
  v_reservation_amount integer;
  v_reservation_currency text;
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

  -- Verrouille la réservation pour sérialiser les checks financiers
  -- avec confirm_payment_attempt_paid (qui verrouille aussi reservations FOR UPDATE).
  select r.payment_status,
         r.status,
         r.total_price,
         r.currency
  into v_reservation_payment_status,
       v_reservation_status,
       v_reservation_amount,
       v_reservation_currency
  from public.reservations r
  where r.id = v_attempt.reservation_id
  for update;

  if not found then
    return 'reservation_missing';
  end if;

  -- Guard historique: si une tentative paid existe déjà pour cette réservation,
  -- aucun nouveau dispatch ne doit être autorisé même si la réservation est
  -- restée pending suite à un état incohérent antérieur.
  if exists (
    select 1
    from public.payment_attempts pa
    where pa.reservation_id = v_attempt.reservation_id
      and pa.id <> v_attempt.id
      and pa.status = 'paid'
  ) then
    return 'reservation_paid';
  end if;

  if lower(coalesce(v_reservation_payment_status, 'pending')) = 'paid' then
    return 'reservation_paid';
  end if;

  if lower(coalesce(v_reservation_status, 'confirmed')) = 'cancelled' then
    return 'reservation_cancelled';
  end if;

  if coalesce(v_reservation_amount, 0) <> v_attempt.amount
     or upper(coalesce(v_reservation_currency, '')) <> upper(coalesce(v_attempt.currency, '')) then
    return 'reservation_amount_mismatch';
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

commit;
