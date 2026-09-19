DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.track_referral_visit(text,jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.refresh_category_counts_cache() TO anon;