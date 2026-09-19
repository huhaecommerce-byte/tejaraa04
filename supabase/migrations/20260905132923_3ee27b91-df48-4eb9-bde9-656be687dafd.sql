INSERT INTO public.platform_settings (key, value, label)
VALUES ('weight_fee_mode', 'in_price', 'Weight fee mode'),
       ('weight_fee_scope', 'global', 'Weight fee applies to')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.weight_fee_in_price(_source text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_mode'), 'in_price') = 'in_price'
     AND (
       COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_scope'), 'global') = 'all'
       OR COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_scope'), 'global') = COALESCE(NULLIF(_source, ''), 'local')
     )
$$;

CREATE OR REPLACE FUNCTION public.apply_pricing_formula()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric := COALESCE(public.pricing_setting('usd_to_sar_rate', 3.75), 3.75);
  v_markup numeric := COALESCE(public.pricing_setting('sell_markup_percent', 0), 0);
  v_flat numeric := COALESCE(public.pricing_setting('sell_flat_add', 0), 0);
  v_wrate numeric := COALESCE(public.pricing_setting('sell_weight_rate', 0), 0);
  v_mode text := COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_mode'), 'in_price');
  v_scope text := COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_scope'), 'global');
  v_count integer;
BEGIN
  IF v_rate <= 0 THEN v_rate := 3.75; END IF;
  PERFORM set_config('app.skip_audit', '1', true);

  WITH calc AS (
    SELECT id,
      round(
        COALESCE(cost_usd,0) * v_rate * (1 + v_markup/100.0) + v_flat
        + CASE
            WHEN v_mode = 'in_price'
             AND (v_scope = 'all' OR v_scope = COALESCE(NULLIF(source, ''), 'local'))
            THEN COALESCE(weight_kg,0) * v_wrate
            ELSE 0
          END
      , 2) AS sar
    FROM public.products
  )
  UPDATE public.products p
  SET price_sar = c.sar,
      price_usd = round(c.sar / v_rate, 2)
  FROM calc c
  WHERE p.id = c.id
    AND (p.price_sar IS DISTINCT FROM c.sar OR p.price_usd IS DISTINCT FROM round(c.sar / v_rate, 2));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM set_config('app.skip_audit', '0', true);
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_products_apply_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric := COALESCE(public.pricing_setting('usd_to_sar_rate', 3.75), 3.75);
  v_markup numeric := COALESCE(public.pricing_setting('sell_markup_percent', 0), 0);
  v_flat numeric := COALESCE(public.pricing_setting('sell_flat_add', 0), 0);
  v_wrate numeric := COALESCE(public.pricing_setting('sell_weight_rate', 0), 0);
  v_sar numeric;
BEGIN
  IF v_rate <= 0 THEN v_rate := 3.75; END IF;
  IF NOT public.weight_fee_in_price(NEW.source) THEN
    v_wrate := 0;
  END IF;
  v_sar := round(
    COALESCE(NEW.cost_usd, 0) * v_rate * (1 + v_markup / 100.0)
    + v_flat
    + COALESCE(NEW.weight_kg, 0) * v_wrate
  , 2);
  NEW.price_sar := v_sar;
  NEW.price_usd := round(v_sar / v_rate, 2);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_settings_reprice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.key IN ('usd_to_sar_rate','sell_markup_percent','sell_flat_add','sell_weight_rate','weight_fee_mode','weight_fee_scope')
     AND (TG_OP = 'INSERT' OR NEW.value IS DISTINCT FROM OLD.value) THEN
    PERFORM public.apply_pricing_formula();
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.weight_fee_in_price(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.weight_fee_in_price(text) TO authenticated, service_role;