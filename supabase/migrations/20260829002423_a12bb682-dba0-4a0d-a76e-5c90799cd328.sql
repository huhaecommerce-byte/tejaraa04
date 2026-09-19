CREATE OR REPLACE FUNCTION public.product_digest_stats(_since timestamptz, _limit int DEFAULT 6)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lim int := greatest(1, least(coalesce(_limit, 6), 12));
  _new_count bigint;
  _total_catalog bigint;
  _min_price numeric;
  _avg_price numeric;
  _top_categories jsonb;
  _sub_categories jsonb;
  _fresh jsonb;
  _top_sellers jsonb;
  _trending jsonb;
BEGIN
  SELECT count(*), min(nullif(price_sar,0)), avg(nullif(price_sar,0))
    INTO _new_count, _min_price, _avg_price
  FROM products WHERE created_at >= _since;

  SELECT count(*) INTO _total_catalog FROM products;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
    INTO _top_categories
  FROM (
    SELECT top_category AS name, count(*) AS cnt
    FROM products
    WHERE created_at >= _since AND coalesce(top_category,'') <> ''
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ) t;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
    INTO _sub_categories
  FROM (
    SELECT sub_category AS name, count(*) AS cnt
    FROM products
    WHERE created_at >= _since AND coalesce(sub_category,'') <> ''
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ) t;

  SELECT coalesce(jsonb_agg(row_to_json(p)::jsonb ORDER BY (p.created_at) DESC), '[]'::jsonb)
    INTO _fresh
  FROM (
    SELECT id, name, slug, images, price_sar, price_usd, top_category, sub_category, created_at
    FROM products
    WHERE created_at >= _since
    ORDER BY created_at DESC
    LIMIT _lim
  ) p;

  WITH items AS (
    SELECT coalesce(it->>'product_id', it->>'id') AS pid,
           coalesce((it->>'quantity')::numeric, (it->>'qty')::numeric, 1) AS qty
    FROM orders o
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(o.products) = 'array' THEN o.products ELSE '[]'::jsonb END
    ) AS it
    WHERE o.created_at >= _since
  ), agg AS (
    SELECT pid, sum(qty) AS units
    FROM items
    WHERE pid IS NOT NULL AND pid ~* '^[0-9a-f-]{36}$'
    GROUP BY pid ORDER BY 2 DESC LIMIT _lim
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'slug', p.slug, 'images', p.images,
    'price_sar', p.price_sar, 'price_usd', p.price_usd,
    'top_category', p.top_category, 'units', a.units) ORDER BY a.units DESC), '[]'::jsonb)
    INTO _top_sellers
  FROM agg a JOIN products p ON p.id = a.pid::uuid;

  WITH agg AS (
    SELECT product_id, count(*) AS views
    FROM product_view_events
    WHERE created_at >= _since
    GROUP BY 1 ORDER BY 2 DESC LIMIT _lim * 2
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'slug', p.slug, 'images', p.images,
    'price_sar', p.price_sar, 'price_usd', p.price_usd,
    'top_category', p.top_category, 'views', a.views) ORDER BY a.views DESC), '[]'::jsonb)
    INTO _trending
  FROM agg a JOIN products p ON p.id = a.product_id;

  RETURN jsonb_build_object(
    'since', _since,
    'new_count', coalesce(_new_count, 0),
    'total_catalog', coalesce(_total_catalog, 0),
    'min_price', _min_price,
    'avg_price', _avg_price,
    'top_categories', _top_categories,
    'sub_categories', _sub_categories,
    'fresh', _fresh,
    'top_sellers', _top_sellers,
    'trending', _trending
  );
END;
$$;

REVOKE ALL ON FUNCTION public.product_digest_stats(timestamptz, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.product_digest_stats(timestamptz, int) TO service_role;