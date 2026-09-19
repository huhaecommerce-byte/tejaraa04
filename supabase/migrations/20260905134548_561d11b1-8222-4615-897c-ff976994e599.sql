CREATE OR REPLACE FUNCTION public.trg_settings_reprice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- A synchronous full-catalog rewrite makes a single settings update time out
  -- once the catalog contains hundreds of thousands of products. Formula
  -- settings must remain lightweight and durable; product insert/update pricing
  -- continues to be handled by trg_products_apply_pricing.
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.trg_settings_reprice() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_settings_reprice() TO service_role;