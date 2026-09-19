DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prokind='f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;

DO $$
DECLARE f record;
  auth_fns text[] := ARRAY['accept_team_invite','admin_adjust_inventory','admin_list_customers','admin_product_add_stats','admin_send_notification','analytics_session_timeline','analytics_sessions','analytics_summary','apply_referral_code','broadcast_notification','claim_guest_shop_orders','generate_invoice_for_order','get_team_owner','get_user_plan_limit','has_active_subscription','has_module_access','has_role','hunt_catalog_products','is_admin','is_staff_or_admin','product_digest_stats','redeem_promo_code','refresh_category_counts_cache','refresh_category_counts_if_dirty','reprice_products_batch','team_can_buy','validate_promo_code','wallet_admin_adjust','wallet_debit_for_order','wallet_debit_for_release','wallet_get_balance','wants_notification','track_referral_visit','record_page_duration','slugify','gen_referral_code','build_zatca_qr','generate_invoice_number','pricing_setting','weight_fee_in_price','apply_pricing_formula'];
  anon_fns text[] := ARRAY['track_referral_visit','validate_promo_code','record_page_duration','hunt_catalog_products','slugify','refresh_category_counts_if_dirty'];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prokind='f'
  LOOP
    IF f.proname = ANY(auth_fns) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
    IF f.proname = ANY(anon_fns) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f.sig);
    END IF;
  END LOOP;
END $$;
