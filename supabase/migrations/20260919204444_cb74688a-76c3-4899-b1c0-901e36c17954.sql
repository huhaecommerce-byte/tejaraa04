DO $$ BEGIN EXECUTE 'GRANT sandbox_exec TO postgres'; EXCEPTION WHEN OTHERS THEN RAISE NOTICE '%', SQLERRM; END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_referral ON auth.users;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO sandbox_exec;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE OR REPLACE FUNCTION public.__import_exec(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN EXECUTE sql; END;
$fn$;
REVOKE ALL ON FUNCTION public.__import_exec(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__import_exec(text) TO sandbox_exec;