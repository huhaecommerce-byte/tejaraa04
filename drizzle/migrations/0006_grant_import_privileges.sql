GRANT TRIGGER, SELECT ON TABLE auth.users TO sandbox_exec;
GRANT USAGE ON SCHEMA auth, storage, extensions, cron TO sandbox_exec;
DO $$
BEGIN
  BEGIN EXECUTE 'GRANT supabase_storage_admin TO sandbox_exec WITH SET TRUE'; EXCEPTION WHEN others THEN
    BEGIN EXECUTE 'GRANT supabase_storage_admin TO sandbox_exec'; EXCEPTION WHEN others THEN NULL; END;
  END;
  BEGIN EXECUTE 'GRANT supabase_auth_admin TO sandbox_exec WITH SET TRUE'; EXCEPTION WHEN others THEN
    BEGIN EXECUTE 'GRANT supabase_auth_admin TO sandbox_exec'; EXCEPTION WHEN others THEN NULL; END;
  END;
END $$;