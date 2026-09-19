DO $$ DECLARE r record; allowed text[] := ARRAY['accept_team_invite','admin_adjust_inventory','admin_send_notification','apply_referral_code','broadcast_notification','cancel_price_recalc_job','fail_price_recalc_job','has_role','recalc_job_step','refresh_category_counts_cache','start_price_recalc_job','track_referral_visit','validate_promo_code','wallet_admin_adjust','wallet_debit_for_order','wallet_debit_for_release','wallet_get_balance'];
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND NOT (p.proname = ANY(allowed)) LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
  END LOOP;
END $$;