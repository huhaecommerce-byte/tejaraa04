DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tgname FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
  END LOOP;
END $$;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
ALTER SCHEMA public OWNER TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, CREATE ON SCHEMA public TO sandbox_exec;
GRANT USAGE ON SCHEMA auth, storage, extensions, pgmq TO sandbox_exec;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE OR REPLACE FUNCTION public.__import_exec(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN EXECUTE sql; END;
$fn$;
REVOKE ALL ON FUNCTION public.__import_exec(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__import_exec(text) TO sandbox_exec;