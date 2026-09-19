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
    IF ent_type IN ('order','return') AND (NEW).status IS DISTINCT FROM (OLD).status THEN
      summ := 'Status: ' || (OLD).status || ' → ' || (NEW).status;
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

REVOKE ALL ON FUNCTION public.log_audit_event() FROM PUBLIC, anon, authenticated;