-- ============================================================
-- MIGRATION P2 — RPC atomique de réclamation de tentative
-- Groupe Djamiyah — neutralise la dépendance PATCH+or PostgREST
-- ============================================================
-- ADDITIVE et NON DESTRUCTIVE :
--   - aucune table modifiée/supprimée
--   - aucune contrainte historique altérée

begin;

create or replace function public.claim_payment_attempt(
  p_attempt_id uuid,
  p_claim_token uuid,
  p_claimed_before timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_claimed_id uuid;
begin
  update public.payment_attempts as pa
  set claim_token = p_claim_token,
      claimed_at = now()
  where pa.id = p_attempt_id
    and pa.status = 'created'
    and (
      pa.claim_token = p_claim_token
      or pa.claimed_at is null
      or pa.claimed_at < p_claimed_before
    )
  returning pa.id into v_claimed_id;

  return v_claimed_id is not null;
end;
$$;

-- Les fonctions PostgreSQL sont exécutables par PUBLIC par défaut.
-- On ferme explicitement puis on rouvre uniquement à service_role.
revoke all on function public.claim_payment_attempt(uuid, uuid, timestamptz) from public;
revoke all on function public.claim_payment_attempt(uuid, uuid, timestamptz) from anon;
revoke all on function public.claim_payment_attempt(uuid, uuid, timestamptz) from authenticated;
grant execute on function public.claim_payment_attempt(uuid, uuid, timestamptz) to service_role;

commit;
