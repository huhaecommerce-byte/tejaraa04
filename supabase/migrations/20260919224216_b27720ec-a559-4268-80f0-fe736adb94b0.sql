CREATE OR REPLACE FUNCTION public.protect_agency_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_staff_or_admin(auth.uid()) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'approved';
    NEW.commission_rate := NULL;
    NEW.approved_at := now();
    NEW.approved_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.invite_code := COALESCE(NULLIF(NEW.invite_code, ''), public.gen_agency_code());
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.commission_rate := OLD.commission_rate;
  NEW.invite_code := OLD.invite_code;
  NEW.approved_at := OLD.approved_at;
  NEW.approved_by := OLD.approved_by;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_grant_role_on_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'agency')
    ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM public.queue_email('agency-approved', NEW.user_id,
      jsonb_build_object('agencyName', NEW.contact_name, 'code', NEW.invite_code,
                         'rate', COALESCE(NEW.commission_rate, public.pricing_setting('agency_commission_percent', 10))),
      'agency-approved:' || NEW.id, NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agency_profiles_autoapprove ON public.agency_profiles;
CREATE TRIGGER agency_profiles_autoapprove
  AFTER INSERT ON public.agency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.agency_grant_role_on_create();

UPDATE public.agency_profiles
   SET status = 'approved', approved_at = COALESCE(approved_at, now())
 WHERE status = 'pending';

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'agency' FROM public.agency_profiles WHERE status = 'approved'
ON CONFLICT (user_id, role) DO NOTHING;