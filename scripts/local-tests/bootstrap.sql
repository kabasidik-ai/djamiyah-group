-- Test-only Supabase role/auth subset; NEVER a deployable migration.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE p2_api LOGIN NOINHERIT PASSWORD 'local-disposable-only';
GRANT anon, authenticated, service_role TO p2_api;
CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', current_user)
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE SCHEMA p2_bench;
CREATE TABLE p2_bench.applied_files (filename text PRIMARY KEY, sha256 text NOT NULL);
