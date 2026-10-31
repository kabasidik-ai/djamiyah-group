-- Only synthetic data in the owned disposable database.
DO $$
DECLARE r jsonb;
BEGIN
  IF (SELECT count(*) FROM pg_trigger WHERE tgname = 'ghl_oauth_tokens_updated_at' AND NOT tgisinternal) <> 1 THEN
    RAISE EXCEPTION 'GHL trigger must exist exactly once';
  END IF;
  IF (SELECT count(*) FROM p2_bench.applied_files WHERE filename LIKE '%/002_%') <> 2 THEN
    RAISE EXCEPTION 'Both historical 002 files must be applied';
  END IF;
  INSERT INTO public.rooms(name, type, price_per_night, capacity, slug, total_units)
  VALUES ('P2 local room', 'standard', 100, 2, 'p2-local-room', 1);
  r := public.reserve_room('P2 local room', 'Local', 'Test', 'local@example.invalid', '00000000',
    'Local fixture', CURRENT_DATE + 1, CURRENT_DATE + 2, 1);
  IF NOT COALESCE((r->>'ok')::boolean, false) THEN RAISE EXCEPTION 'reserve_room baseline mismatch'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_payment_attempts_single_active') THEN
    RAISE EXCEPTION 'Missing active-attempt index';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.payment_attempts'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'Missing attempt RLS';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_attempts'
      AND column_name = 'dispatch_consumed'
  ) THEN
    RAISE EXCEPTION 'Missing dispatch_consumed column';
  END IF;
  IF to_regprocedure('public.begin_provider_dispatch(uuid,uuid,timestamptz)') IS NULL THEN
    RAISE EXCEPTION 'Missing begin_provider_dispatch RPC';
  END IF;
  IF to_regprocedure('public.settle_payment_attempt(uuid,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Missing settle_payment_attempt RPC';
  END IF;
  IF to_regprocedure('public.confirm_payment_attempt_paid(uuid,text,text,text,integer,text)') IS NULL THEN
    RAISE EXCEPTION 'Missing confirm_payment_attempt_paid RPC';
  END IF;

  -- Preuve que les migrations additives de correction ont été rejouées dans le banc local.
  IF NOT EXISTS (
    SELECT 1
    FROM p2_bench.applied_files
    WHERE filename = 'supabase/migrations/20261102_payment_attempt_dispatch_paid_history_guard.sql'
  ) THEN
    RAISE EXCEPTION 'Missing applied migration 20261102_payment_attempt_dispatch_paid_history_guard.sql';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM p2_bench.applied_files
    WHERE filename = 'supabase/migrations/20261103_payment_attempt_confirm_paid.sql'
  ) THEN
    RAISE EXCEPTION 'Missing applied migration 20261103_payment_attempt_confirm_paid.sql';
  END IF;

  -- Preuve que le corps SQL ACTIF de begin_provider_dispatch contient le garde
  -- historique des tentatives paid (attempt paid / reservation pending).
  IF position('pa.status = ''paid''' in pg_get_functiondef('public.begin_provider_dispatch(uuid,uuid,timestamptz)'::regprocedure)) = 0
     OR position('pa.id <> v_attempt.id' in pg_get_functiondef('public.begin_provider_dispatch(uuid,uuid,timestamptz)'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'begin_provider_dispatch missing paid-history guard in active SQL body';
  END IF;

  -- Protections antérieures conservées.
  IF position('reservation_cancelled' in pg_get_functiondef('public.begin_provider_dispatch(uuid,uuid,timestamptz)'::regprocedure)) = 0
     OR position('reservation_amount_mismatch' in pg_get_functiondef('public.begin_provider_dispatch(uuid,uuid,timestamptz)'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'begin_provider_dispatch missing prior reservation guards';
  END IF;
END $$;
