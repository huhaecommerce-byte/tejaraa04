
ALTER FUNCTION public.refresh_category_counts_cache() SET statement_timeout = '0';

CREATE OR REPLACE FUNCTION public.refresh_category_counts_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '0'
AS $function$
DECLARE
  affected integer;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR current_user IN ('service_role', 'postgres', 'supabase_admin')
  ) THEN
    RAISE EXCEPTION 'Only admins can refresh the category cache';
  END IF;

  TRUNCATE TABLE public.product_category_counts_cache;

  INSERT INTO public.product_category_counts_cache (top_category, sub_category, detailed_category, cnt, updated_at)
  SELECT COALESCE(top_category, ''), COALESCE(sub_category, ''), COALESCE(detailed_category, ''), count(*), now()
  FROM public.products
  GROUP BY 1, 2, 3;

  GET DIAGNOSTICS affected = ROW_COUNT;
  UPDATE public.category_counts_meta SET dirty = false, last_refresh = now() WHERE id = true;
  RETURN affected;
END;
$function$;
