DROP FUNCTION IF EXISTS public.sunsky_rebuild_category_paths_ar();

CREATE FUNCTION public.sunsky_rebuild_category_paths_ar()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_staff_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH RECURSIVE tree AS (
    SELECT category_id, parent_id, COALESCE(name_ar, name) AS p
    FROM public.sunsky_categories
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.category_id, c.parent_id, t.p || ' › ' || COALESCE(c.name_ar, c.name)
    FROM public.sunsky_categories c
    JOIN tree t ON c.parent_id = t.category_id
  ), upd AS (
    UPDATE public.sunsky_categories c
    SET path_ar = t.p
    FROM tree t
    WHERE c.category_id = t.category_id
      AND c.path_ar IS DISTINCT FROM t.p
    RETURNING 1
  )
  SELECT count(*)::int INTO n FROM upd;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sunsky_rebuild_category_paths_ar() TO authenticated;