CREATE OR REPLACE FUNCTION public.record_page_duration(_id uuid, _ms integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _ms IS NULL OR _ms < 300 OR _ms > 3600000 THEN RETURN; END IF;
  UPDATE public.page_view_events
    SET duration_ms = _ms
  WHERE id = _id
    AND duration_ms IS NULL
    AND created_at > now() - interval '6 hours';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_page_duration(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.record_page_duration(uuid, integer) TO anon, authenticated;
