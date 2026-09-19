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
  IF to_regclass('public.plan_limits') IS NULL THEN
    RETURN -1; -- unlimited
  END IF;

  IF to_regclass('public.customer_subscriptions') IS NOT NULL THEN
    EXECUTE 'SELECT plan_id FROM public.customer_subscriptions WHERE user_id = $1 AND status = ''active'' ORDER BY started_at DESC LIMIT 1'
      INTO pid USING _user_id;
  END IF;
  IF pid IS NULL THEN
    pid := 'a1b2c3d4-0001-4000-8000-000000000001';
  END IF;

  EXECUTE 'SELECT limit_value FROM public.plan_limits WHERE plan_id = $1 AND limit_key = $2 LIMIT 1'
    INTO raw USING pid, _limit_key;

  IF raw IS NULL THEN RETURN -1; END IF;
  IF raw ILIKE 'unlimited' OR raw = '∞' OR raw ILIKE 'true' OR raw ILIKE 'yes' THEN RETURN -1; END IF;
  IF raw ILIKE 'false' OR raw ILIKE 'no' THEN RETURN 0; END IF;
  raw := regexp_replace(raw, '[^0-9\.\-]', '', 'g');
  IF raw = '' THEN RETURN -1; END IF;
  BEGIN num := raw::numeric; EXCEPTION WHEN OTHERS THEN RETURN -1; END;
  RETURN num;
END;
$fn$;