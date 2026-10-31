-- ============================================================
-- MIGRATION P2 (additive) — confirmation atomique du paiement
-- attempt + reservation dans la même transaction SQL.
-- ============================================================

begin;

create or replace function public.confirm_payment_attempt_paid(
  p_attempt_id uuid,
  p_order_id text default null,
  p_provider_operation_id text default null,
  p_provider_request_id text default null,
  p_amount integer default null,
  p_currency text default null
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_reservation_payment_status text;
  v_reservation_amount integer;
  v_reservation_currency text;
begin
  -- Ordre de verrouillage cohérent pour éviter les deadlocks:
  -- 1) payment_attempts (ligne tentative)
  -- 2) reservations (ligne réservation)
  select *
  into v_attempt
  from public.payment_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return 'not_found';
  end if;

  select r.payment_status,
         r.total_price,
         r.currency
  into v_reservation_payment_status,
       v_reservation_amount,
       v_reservation_currency
  from public.reservations r
  where r.id = v_attempt.reservation_id
  for update;

  if not found then
    return 'reservation_missing';
  end if;

  if lower(coalesce(v_reservation_payment_status, 'pending')) = 'paid' then
    if v_attempt.status = 'paid' then
      return 'already_paid';
    end if;
    return 'terminal_blocked';
  end if;

  if v_attempt.status = 'paid' then
    return 'already_paid';
  end if;

  if v_attempt.status not in ('created', 'awaiting_pay', 'failed', 'expired', 'unknown') then
    return 'terminal_blocked';
  end if;

  if p_order_id is not null and p_order_id <> v_attempt.order_id then
    return 'terminal_blocked';
  end if;

  if p_amount is not null and p_amount <> v_attempt.amount then
    return 'terminal_blocked';
  end if;

  if p_currency is not null and upper(p_currency) <> upper(v_attempt.currency) then
    return 'terminal_blocked';
  end if;

  if coalesce(v_reservation_amount, 0) <> v_attempt.amount
     or upper(coalesce(v_reservation_currency, '')) <> upper(coalesce(v_attempt.currency, '')) then
    return 'terminal_blocked';
  end if;

  update public.payment_attempts
  set status = 'paid',
      provider_operation_id = coalesce(p_provider_operation_id, provider_operation_id),
      provider_request_id = coalesce(p_provider_request_id, provider_request_id),
      updated_at = now()
  where id = p_attempt_id;

  update public.reservations
  set payment_status = 'paid',
      chapchap_transaction_id = coalesce(p_provider_operation_id, chapchap_transaction_id),
      updated_at = now()
  where id = v_attempt.reservation_id;

  return 'updated';
end;
$$;

revoke all on function public.confirm_payment_attempt_paid(uuid, text, text, text, integer, text) from public;
revoke all on function public.confirm_payment_attempt_paid(uuid, text, text, text, integer, text) from anon;
revoke all on function public.confirm_payment_attempt_paid(uuid, text, text, text, integer, text) from authenticated;
grant execute on function public.confirm_payment_attempt_paid(uuid, text, text, text, integer, text) to service_role;

commit;
