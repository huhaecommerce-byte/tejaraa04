CREATE OR REPLACE FUNCTION public.get_user_plan_limit(_user_id uuid, _limit_key text)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  pid uuid;
  raw text;
  num numeric;
BEGIN
  IF to_regclass('public.customer_subscriptions') IS NOT NULL THEN
    EXECUTE 'SELECT plan_id FROM public.customer_subscriptions WHERE user_id = $1 AND status = ''active'' ORDER BY started_at DESC LIMIT 1'
      INTO pid USING _user_id;
  END IF;
  IF pid IS NULL THEN
    pid := 'a1b2c3d4-0001-4000-8000-000000000001';
  END IF;
  SELECT limit_value INTO raw FROM public.plan_limits
    WHERE plan_id = pid AND limit_key = _limit_key LIMIT 1;
  IF raw IS NULL THEN RETURN -1; END IF;
  IF raw ILIKE 'unlimited' OR raw = '∞' OR raw ILIKE 'true' OR raw ILIKE 'yes' THEN
    RETURN -1;
  END IF;
  IF raw ILIKE 'false' OR raw ILIKE 'no' THEN RETURN 0; END IF;
  raw := regexp_replace(raw, '[^0-9\.\-]', '', 'g');
  IF raw = '' THEN RETURN -1; END IF;
  BEGIN num := raw::numeric; EXCEPTION WHEN OTHERS THEN RETURN -1; END;
  RETURN num;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.prevent_delete_plan_in_use()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  in_use_count integer := 0;
BEGIN
  IF to_regclass('public.customer_subscriptions') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.customer_subscriptions WHERE plan_id = $1 AND status IN (''active'',''trialing'',''past_due'')'
      INTO in_use_count USING OLD.id;
  END IF;

  IF in_use_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete plan "%" — % active subscriber(s) still on it. Move them to another plan first.',
      OLD.name, in_use_count
      USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_user_plan_limit(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_plan_limit(uuid, text) TO authenticated, service_role;