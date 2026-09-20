INSERT INTO public.platform_settings (key, label, value)
SELECT 'agency_auto_approve', 'Auto-approve new agency signups (1 = on, 0 = off)', '1'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings WHERE key = 'agency_auto_approve');

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
    NEW.commission_rate := NULL;
    NEW.approved_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.invite_code := COALESCE(NULLIF(NEW.invite_code, ''), public.gen_agency_code());
    IF public.pricing_setting('agency_auto_approve', 1) = 1 THEN
      NEW.status := 'approved';
      NEW.approved_at := now();
    ELSE
      NEW.status := 'pending';
      NEW.approved_at := NULL;
    END IF;
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

CREATE OR REPLACE FUNCTION public.admin_agency_commissions(_agency_id uuid)
RETURNS SETOF public.agency_commissions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT c.*
      FROM public.agency_commissions c
     WHERE c.agency_id = _agency_id
     ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_agency_commissions(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.agency_admin_get_settings()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN json_build_object(
    'commission_percent', public.pricing_setting('agency_commission_percent', 10),
    'min_payout_sar',     public.pricing_setting('agency_min_payout_sar', 200),
    'approval_days',      public.pricing_setting('agency_approval_days', 14),
    'auto_approve',       public.pricing_setting('agency_auto_approve', 1) = 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_admin_save_settings(
  _commission_percent numeric,
  _min_payout_sar numeric,
  _approval_days integer,
  _auto_approve boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _commission_percent IS NULL OR _commission_percent < 0 OR _commission_percent > 100 THEN
    RAISE EXCEPTION 'commission percent must be between 0 and 100';
  END IF;
  IF _min_payout_sar IS NULL OR _min_payout_sar < 0 THEN
    RAISE EXCEPTION 'minimum payout must be zero or more';
  END IF;
  IF _approval_days IS NULL OR _approval_days < 0 OR _approval_days > 90 THEN
    RAISE EXCEPTION 'hold period must be between 0 and 90 days';
  END IF;

  UPDATE public.platform_settings SET value = _commission_percent::text, updated_at = now() WHERE key = 'agency_commission_percent';
  UPDATE public.platform_settings SET value = _min_payout_sar::text,     updated_at = now() WHERE key = 'agency_min_payout_sar';
  UPDATE public.platform_settings SET value = _approval_days::text,      updated_at = now() WHERE key = 'agency_approval_days';
  UPDATE public.platform_settings SET value = CASE WHEN _auto_approve THEN '1' ELSE '0' END, updated_at = now() WHERE key = 'agency_auto_approve';

  RETURN public.agency_admin_get_settings();
END;
$$;

GRANT EXECUTE ON FUNCTION public.agency_admin_get_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.agency_admin_save_settings(numeric, numeric, integer, boolean) TO authenticated;