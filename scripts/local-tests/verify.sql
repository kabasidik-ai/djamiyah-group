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
END $$;
