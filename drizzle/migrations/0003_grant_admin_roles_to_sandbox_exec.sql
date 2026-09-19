DO $$
BEGIN
  BEGIN
    EXECUTE 'GRANT postgres TO sandbox_exec';
  EXCEPTION WHEN others THEN RAISE NOTICE 'postgres grant failed: %', SQLERRM;
  END;
  BEGIN
    EXECUTE 'GRANT supabase_storage_admin TO sandbox_exec';
  EXCEPTION WHEN others THEN RAISE NOTICE 'storage grant failed: %', SQLERRM;
  END;
  BEGIN
    EXECUTE 'GRANT supabase_auth_admin TO sandbox_exec';
  EXCEPTION WHEN others THEN RAISE NOTICE 'auth grant failed: %', SQLERRM;
  END;
END $$;