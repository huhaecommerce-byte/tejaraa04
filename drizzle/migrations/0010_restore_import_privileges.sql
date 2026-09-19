GRANT USAGE, CREATE ON SCHEMA public TO sandbox_exec;
GRANT USAGE ON SCHEMA auth TO sandbox_exec;
GRANT SELECT, REFERENCES ON TABLE auth.users TO sandbox_exec;
CREATE OR REPLACE FUNCTION public.__import_exec(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN EXECUTE sql; END;
$fn$;
REVOKE ALL ON FUNCTION public.__import_exec(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__import_exec(text) TO sandbox_exec;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;