CREATE OR REPLACE FUNCTION public.log_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ent_type TEXT := TG_ARGV[0];
  act TEXT;
  eid UUID;
  email_val TEXT;
  summ TEXT := '';
  diff_val JSONB := '{}'::jsonb;
BEGIN
  IF current_setting('app.skip_audit', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    act := 'insert';
    eid := (NEW.id);
    diff_val := to_jsonb(NEW);
    summ := 'Created ' || ent_type;
  ELSIF TG_OP = 'UPDATE' THEN
    act := 'update';
    eid := (NEW.id);
    SELECT jsonb_object_agg(key, jsonb_build_object('old', o.value, 'new', n.value))
      INTO diff_val
      FROM jsonb_each(to_jsonb(OLD)) o
      JOIN jsonb_each(to_jsonb(NEW)) n USING (key)
      WHERE o.value IS DISTINCT FROM n.value AND key NOT IN ('updated_at');
    summ := 'Updated ' || ent_type;
    IF ent_type IN ('order','return') THEN
      IF (to_jsonb(NEW) ->> 'status') IS DISTINCT FROM (to_jsonb(OLD) ->> 'status') THEN
        summ := 'Status: ' || COALESCE(to_jsonb(OLD) ->> 'status', '') || ' → ' || COALESCE(to_jsonb(NEW) ->> 'status', '');
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    act := 'delete';
    eid := (OLD.id);
    diff_val := to_jsonb(OLD);
    summ := 'Deleted ' || ent_type;
  END IF;

  BEGIN
    email_val := NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '');
  EXCEPTION WHEN OTHERS THEN
    email_val := NULL;
  END;

  IF email_val IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT p.email INTO email_val FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1;
  END IF;

  INSERT INTO public.audit_log (actor_id, actor_email, action, entity_type, entity_id, summary, diff)
  VALUES (auth.uid(), email_val, act, ent_type, eid, summ, COALESCE(diff_val, '{}'::jsonb));

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_usd numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
  PERFORM set_config('app.skip_audit', 'on', true);
  UPDATE public.products
  SET cost_usd = COALESCE(NULLIF(bulk_price_usd, 0), dropship_price_usd, 0),
      price_sar = COALESCE(NULLIF(dropship_price, 0), bulk_price, 0),
      price_usd = COALESCE(NULLIF(dropship_price_usd, 0), bulk_price_usd, 0);
END $$;

CREATE INDEX IF NOT EXISTS products_price_sar_idx ON public.products (price_sar);