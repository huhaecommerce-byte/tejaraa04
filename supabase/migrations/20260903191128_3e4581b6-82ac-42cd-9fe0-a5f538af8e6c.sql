CREATE OR REPLACE FUNCTION public.update_product_activity_daily()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_activity_daily (activity_date, creator_email, creator_source, product_count)
    VALUES (NEW.created_at::date, COALESCE(NEW.created_by_email, 'Unknown'), COALESCE(NEW.created_by_source, 'unknown'), 1)
    ON CONFLICT (activity_date, creator_email, creator_source)
    DO UPDATE SET product_count = public.product_activity_daily.product_count + 1;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.product_activity_daily
    SET product_count = GREATEST(product_count - 1, 0)
    WHERE activity_date = OLD.created_at::date
      AND creator_email = COALESCE(OLD.created_by_email, 'Unknown')
      AND creator_source = COALESCE(OLD.created_by_source, 'unknown');
    DELETE FROM public.product_activity_daily WHERE product_count = 0;
    RETURN OLD;
  END IF;

  UPDATE public.product_activity_daily
  SET product_count = GREATEST(product_count - 1, 0)
  WHERE activity_date = OLD.created_at::date
    AND creator_email = COALESCE(OLD.created_by_email, 'Unknown')
    AND creator_source = COALESCE(OLD.created_by_source, 'unknown');
  INSERT INTO public.product_activity_daily (activity_date, creator_email, creator_source, product_count)
  VALUES (NEW.created_at::date, COALESCE(NEW.created_by_email, 'Unknown'), COALESCE(NEW.created_by_source, 'unknown'), 1)
  ON CONFLICT (activity_date, creator_email, creator_source)
  DO UPDATE SET product_count = public.product_activity_daily.product_count + 1;
  DELETE FROM public.product_activity_daily WHERE product_count = 0;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_product_activity_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_activity_daily() TO service_role;

CREATE TRIGGER products_activity_daily_sync
AFTER INSERT OR UPDATE OF created_at, created_by_email, created_by_source OR DELETE
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_product_activity_daily();