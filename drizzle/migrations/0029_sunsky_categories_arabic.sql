ALTER TABLE public.sunsky_categories
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS path_ar TEXT;

CREATE INDEX IF NOT EXISTS sunsky_categories_name_ar_idx ON public.sunsky_categories (name_ar);

CREATE OR REPLACE FUNCTION public.sunsky_rebuild_category_paths_ar()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated integer;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH RECURSIVE tree AS (
    SELECT c.category_id,
           COALESCE(c.name_ar, c.name) AS built
    FROM public.sunsky_categories c
    WHERE c.parent_id IS NULL
    UNION ALL
    SELECT c.category_id,
           t.built || ' › ' || COALESCE(c.name_ar, c.name)
    FROM public.sunsky_categories c
    JOIN tree t ON c.parent_id = t.category_id
  )
  UPDATE public.sunsky_categories c
  SET path_ar = t.built
  FROM tree t
  WHERE c.category_id = t.category_id
    AND c.path_ar IS DISTINCT FROM t.built;

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sunsky_rebuild_category_paths_ar() TO authenticated;