ALTER TABLE public.products ADD COLUMN IF NOT EXISTS import_ownership_check boolean;
ALTER TABLE public.products DROP COLUMN IF EXISTS import_ownership_check;
REVOKE ALL ON SCHEMA public FROM sandbox_exec;
REVOKE ALL ON TABLE auth.users FROM sandbox_exec;
REVOKE USAGE ON SCHEMA auth FROM sandbox_exec;
REVOKE authenticated, anon, service_role FROM sandbox_exec;
REVOKE CREATE ON SCHEMA public FROM service_role;