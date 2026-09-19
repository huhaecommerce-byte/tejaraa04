GRANT SELECT ON public.product_category_counts_cache TO authenticated;
GRANT ALL ON public.product_category_counts_cache TO service_role;

CREATE OR REPLACE FUNCTION public.admin_product_add_stats(_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT sum(cnt) FROM public.product_category_counts_cache), 0),
    'window_days', GREATEST(1, LEAST(COALESCE(_days, 7), 365)),
    'new_in_window', (
      SELECT count(*)
      FROM public.products
      WHERE created_at >= now() - make_interval(days => GREATEST(1, LEAST(COALESCE(_days, 7), 365)))
    ),
    'by_user', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('email', t.email, 'source', t.source, 'cnt', t.cnt)
        ORDER BY t.cnt DESC
      )
      FROM (
        SELECT
          COALESCE(created_by_email, 'Unknown') AS email,
          COALESCE(created_by_source, 'unknown') AS source,
          count(*) AS cnt
        FROM public.products
        WHERE created_at >= now() - make_interval(days => GREATEST(1, LEAST(COALESCE(_days, 7), 365)))
        GROUP BY 1, 2
      ) AS t
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_product_add_stats(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_product_add_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_product_add_stats(integer) TO service_role;