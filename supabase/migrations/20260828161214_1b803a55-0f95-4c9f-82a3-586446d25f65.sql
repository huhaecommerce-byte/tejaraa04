CREATE OR REPLACE FUNCTION public.admin_list_customers(_search text DEFAULT NULL::text, _limit integer DEFAULT 50, _offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, email text, avatar_url text, created_at timestamp with time zone, order_count bigint, lifetime numeric, wallet_balance numeric, tags jsonb, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limit integer := least(greatest(coalesce(_limit, 50), 1), 200);
  v_offset integer := greatest(coalesce(_offset, 0), 0);
  v_q text := nullif(btrim(coalesce(_search, '')), '');
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.is_staff_or_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT p.id, p.user_id, p.display_name, p.email, p.avatar_url, p.created_at AS profile_created_at
    FROM public.profiles p
    WHERE v_q IS NULL
       OR p.display_name ILIKE '%' || v_q || '%'
       OR p.email ILIKE '%' || v_q || '%'
  ),
  counted AS (SELECT count(*) AS n FROM base),
  page AS (
    SELECT * FROM base ORDER BY base.profile_created_at DESC LIMIT v_limit OFFSET v_offset
  )
  SELECT
    pg.id,
    pg.user_id,
    pg.display_name,
    pg.email,
    pg.avatar_url,
    pg.profile_created_at,
    coalesce(o.cnt, 0)::bigint,
    coalesce(o.total, 0)::numeric,
    coalesce(w.balance_after, 0)::numeric,
    coalesce(t.tags, '[]'::jsonb),
    counted.n
  FROM page pg
  CROSS JOIN counted
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt, sum(ord.total) AS total
    FROM public.orders ord WHERE ord.user_id = pg.user_id
  ) o ON true
  LEFT JOIN LATERAL (
    SELECT wt.balance_after
    FROM public.wallet_transactions wt
    WHERE wt.user_id = pg.user_id
    ORDER BY wt.created_at DESC
    LIMIT 1
  ) w ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('tag', ct.tag, 'color', ct.color)) AS tags
    FROM (
      SELECT ctag.tag, ctag.color FROM public.customer_tags ctag
      WHERE ctag.customer_id = pg.user_id ORDER BY ctag.created_at LIMIT 3
    ) ct
  ) t ON true
  ORDER BY pg.profile_created_at DESC;
END;
$function$;