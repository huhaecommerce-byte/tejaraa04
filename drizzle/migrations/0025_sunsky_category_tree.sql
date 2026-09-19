ALTER TABLE public.sunsky_categories
  ADD COLUMN IF NOT EXISTS path text,
  ADD COLUMN IF NOT EXISTS root_id numeric,
  ADD COLUMN IF NOT EXISTS sub_id numeric,
  ADD COLUMN IF NOT EXISTS child_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS sunsky_categories_parent_idx ON public.sunsky_categories(parent_id);
CREATE INDEX IF NOT EXISTS sunsky_categories_pending_idx ON public.sunsky_categories(children_synced_at) WHERE has_children;

CREATE OR REPLACE FUNCTION public.sunsky_rebuild_category_paths()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  WITH RECURSIVE tree AS (
    SELECT c.category_id, c.parent_id, c.name, 1 AS lvl,
           c.name::text AS path,
           c.category_id AS root_id,
           NULL::numeric AS sub_id
    FROM public.sunsky_categories c
    WHERE c.parent_id IS NULL
    UNION ALL
    SELECT c.category_id, c.parent_id, c.name, t.lvl + 1,
           t.path || ' > ' || c.name,
           t.root_id,
           CASE WHEN t.lvl = 1 THEN c.category_id ELSE t.sub_id END
    FROM public.sunsky_categories c
    JOIN tree t ON c.parent_id = t.category_id
    WHERE t.lvl < 8
  ), counts AS (
    SELECT parent_id AS cid, count(*)::int AS kids
    FROM public.sunsky_categories
    WHERE parent_id IS NOT NULL
    GROUP BY parent_id
  )
  UPDATE public.sunsky_categories s
  SET path = t.path,
      root_id = t.root_id,
      sub_id = t.sub_id,
      level = t.lvl,
      child_count = COALESCE(k.kids, 0),
      has_children = COALESCE(s.has_children, false) OR COALESCE(k.kids, 0) > 0
  FROM tree t
  LEFT JOIN counts k ON k.cid = t.category_id
  WHERE s.category_id = t.category_id;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.sunsky_rebuild_category_paths() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sunsky_rebuild_category_paths() TO service_role;