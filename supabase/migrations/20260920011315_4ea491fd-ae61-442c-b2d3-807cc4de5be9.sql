
CREATE OR REPLACE FUNCTION public.agency_ensure_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(NEW.invite_code, '') IS NULL THEN
    NEW.invite_code := public.gen_agency_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agency_profiles_invite_code ON public.agency_profiles;
CREATE TRIGGER agency_profiles_invite_code
BEFORE INSERT OR UPDATE ON public.agency_profiles
FOR EACH ROW EXECUTE FUNCTION public.agency_ensure_invite_code();

UPDATE public.agency_profiles
SET invite_code = public.gen_agency_code()
WHERE NULLIF(invite_code, '') IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS agency_profiles_invite_code_key
ON public.agency_profiles (invite_code);
