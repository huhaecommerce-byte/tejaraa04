
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f.sig);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.refresh_category_counts_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  affected integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can refresh the category cache';
  END IF;

  SET LOCAL statement_timeout = '120s';

  TRUNCATE TABLE public.product_category_counts_cache;

  INSERT INTO public.product_category_counts_cache (top_category, sub_category, detailed_category, cnt, updated_at)
  SELECT
    COALESCE(top_category, ''),
    COALESCE(sub_category, ''),
    COALESCE(detailed_category, ''),
    count(*),
    now()
  FROM public.products
  WHERE is_active = true
  GROUP BY 1, 2, 3;

  GET DIAGNOSTICS affected = ROW_COUNT;
  UPDATE public.category_counts_meta SET dirty = false WHERE id = true;
  RETURN affected;
END;
$fn$;

REVOKE ALL ON FUNCTION public.refresh_category_counts_cache() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_category_counts_cache() TO authenticated;

DROP POLICY IF EXISTS "Users can update own pending quote requests" ON public.quote_requests;
CREATE POLICY "Users can update own pending quote requests"
ON public.quote_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE OR REPLACE FUNCTION public.protect_quote_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_module_access(auth.uid(), 'quotes') THEN
    RETURN NEW;
  END IF;
  NEW.admin_reply := OLD.admin_reply;
  NEW.quoted_price_sar := OLD.quoted_price_sar;
  NEW.quoted_total_sar := OLD.quoted_total_sar;
  NEW.valid_until := OLD.valid_until;
  NEW.status := OLD.status;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.protect_quote_admin_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_quote_admin_fields ON public.quote_requests;
CREATE TRIGGER protect_quote_admin_fields
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.protect_quote_admin_fields();

DROP POLICY IF EXISTS "Return photos publicly viewable" ON storage.objects;
CREATE POLICY "Users view own return photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'return-photos'
  AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role))
);
