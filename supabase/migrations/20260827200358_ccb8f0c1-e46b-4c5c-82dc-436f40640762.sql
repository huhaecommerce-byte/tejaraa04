-- 1) allow suppressing audit noise during bulk repricing
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_action text;
  v_summary text;
  v_diff jsonb;
  v_entity uuid;
BEGIN
  IF coalesce(current_setting('app.skip_audit', true), '') = '1' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  BEGIN
    v_email := nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '');
  EXCEPTION WHEN OTHERS THEN
    v_email := NULL;
  END;

  IF v_email IS NULL AND v_actor IS NOT NULL THEN
    SELECT p.email INTO v_email FROM public.profiles p WHERE p.user_id = v_actor LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_diff := jsonb_build_object('new', to_jsonb(NEW));
    v_entity := (to_jsonb(NEW) ->> 'id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    v_entity := (to_jsonb(NEW) ->> 'id')::uuid;
  ELSE
    v_action := 'delete';
    v_diff := jsonb_build_object('old', to_jsonb(OLD));
    v_entity := (to_jsonb(OLD) ->> 'id')::uuid;
  END IF;

  v_summary := v_action || ' ' || TG_ARGV[0];

  INSERT INTO public.audit_log (actor_id, actor_email, action, entity_type, entity_id, summary, diff)
  VALUES (v_actor, v_email, v_action, TG_ARGV[0], v_entity, v_summary, v_diff);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2) compute selling price from cost using current formula settings
CREATE OR REPLACE FUNCTION public.pricing_setting(_key text, _default numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(value, '')::numeric, _default)
  FROM public.platform_settings WHERE key = _key
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.trg_products_apply_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric := COALESCE(public.pricing_setting('usd_to_sar_rate', 3.75), 3.75);
  v_markup numeric := COALESCE(public.pricing_setting('sell_markup_percent', 0), 0);
  v_flat numeric := COALESCE(public.pricing_setting('sell_flat_add', 0), 0);
  v_wrate numeric := COALESCE(public.pricing_setting('sell_weight_rate', 0), 0);
  v_sar numeric;
BEGIN
  IF v_rate <= 0 THEN v_rate := 3.75; END IF;
  v_sar := round(
    COALESCE(NEW.cost_usd, 0) * v_rate * (1 + v_markup / 100.0)
    + v_flat
    + COALESCE(NEW.weight_kg, 0) * v_wrate
  , 2);
  NEW.price_sar := v_sar;
  NEW.price_usd := round(v_sar / v_rate, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_apply_pricing ON public.products;
CREATE TRIGGER trg_products_apply_pricing
BEFORE INSERT OR UPDATE OF cost_usd, weight_kg ON public.products
FOR EACH ROW EXECUTE FUNCTION public.trg_products_apply_pricing();

-- 3) one-shot catalog reprice
CREATE OR REPLACE FUNCTION public.apply_pricing_formula()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric := COALESCE(public.pricing_setting('usd_to_sar_rate', 3.75), 3.75);
  v_markup numeric := COALESCE(public.pricing_setting('sell_markup_percent', 0), 0);
  v_flat numeric := COALESCE(public.pricing_setting('sell_flat_add', 0), 0);
  v_wrate numeric := COALESCE(public.pricing_setting('sell_weight_rate', 0), 0);
  v_count integer;
BEGIN
  IF v_rate <= 0 THEN v_rate := 3.75; END IF;
  PERFORM set_config('app.skip_audit', '1', true);

  WITH calc AS (
    SELECT id,
      round(COALESCE(cost_usd,0) * v_rate * (1 + v_markup/100.0) + v_flat + COALESCE(weight_kg,0) * v_wrate, 2) AS sar
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
$$;

REVOKE ALL ON FUNCTION public.apply_pricing_formula() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_pricing_formula() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.pricing_setting(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pricing_setting(text, numeric) TO authenticated, service_role;

-- 4) reprice automatically when a formula setting changes
CREATE OR REPLACE FUNCTION public.trg_settings_reprice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.key IN ('usd_to_sar_rate','sell_markup_percent','sell_flat_add','sell_weight_rate')
     AND (TG_OP = 'INSERT' OR NEW.value IS DISTINCT FROM OLD.value) THEN
    PERFORM public.apply_pricing_formula();
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_settings_reprice ON public.platform_settings;
CREATE TRIGGER trg_settings_reprice
AFTER INSERT OR UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.trg_settings_reprice();

-- 5) drop the old batched job machinery
DROP FUNCTION IF EXISTS public.start_price_recalc_job(numeric, numeric, numeric, numeric, integer, boolean);
DROP FUNCTION IF EXISTS public.recalc_job_step(uuid);
DROP FUNCTION IF EXISTS public.cancel_price_recalc_job(uuid);
DROP FUNCTION IF EXISTS public.fail_price_recalc_job(uuid, text);
DROP TABLE IF EXISTS public.price_recalc_jobs;

-- 6) align existing rows with the formula now
SELECT public.apply_pricing_formula();