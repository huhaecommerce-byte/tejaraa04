REVOKE ALL ON FUNCTION public.trg_products_apply_pricing() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_settings_reprice() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_pricing_formula() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pricing_setting(text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_pricing_formula() TO service_role;
GRANT EXECUTE ON FUNCTION public.pricing_setting(text, numeric) TO service_role;