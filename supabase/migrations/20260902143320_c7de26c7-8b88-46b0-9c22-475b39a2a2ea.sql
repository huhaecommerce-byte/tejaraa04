ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS created_by_email text,
  ADD COLUMN IF NOT EXISTS created_by_source text NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products (created_by);

CREATE OR REPLACE FUNCTION public.products_set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.created_by_email IS NULL AND NEW.created_by IS NOT NULL THEN
    SELECT email INTO NEW.created_by_email FROM auth.users WHERE id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_set_created_by ON public.products;
CREATE TRIGGER trg_products_set_created_by
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_set_created_by();