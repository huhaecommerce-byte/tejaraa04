CREATE INDEX IF NOT EXISTS products_top_cat_trgm_idx ON public.products USING gin (top_category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_sub_cat_trgm_idx ON public.products USING gin (sub_category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_detailed_cat_trgm_idx ON public.products USING gin (detailed_category gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.hunt_catalog_products(_terms text[], _category text DEFAULT NULL::text, _min_price numeric DEFAULT NULL::numeric, _max_price numeric DEFAULT NULL::numeric, _source text DEFAULT NULL::text, _in_stock boolean DEFAULT true, _limit integer DEFAULT 24, _offset integer DEFAULT 0, _relaxed boolean DEFAULT false)
 RETURNS TABLE(id uuid, sku text, name text, name_ar text, top_category text, sub_category text, detailed_category text, source text, images text[], price_sar numeric, price_usd numeric, cost_usd numeric, bulk_price numeric, bulk_price_usd numeric, dropship_price numeric, dropship_price_usd numeric, moq integer, weight_kg numeric, estimated_delivery text, labelling_available boolean, platforms text[], stock_qty integer, track_inventory boolean, is_featured boolean, created_at timestamp with time zone, match_score real, total_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH normalized AS (
    SELECT DISTINCT lower(trim(t)) AS term
    FROM unnest(COALESCE(_terms, ARRAY[]::text[])) AS t
    WHERE length(trim(t)) >= 2
    LIMIT 5
  ), candidates AS (
    SELECT p.*
    FROM public.products p
    WHERE
      (_relaxed OR _min_price IS NULL OR p.price_sar >= _min_price)
      AND (_relaxed OR _max_price IS NULL OR p.price_sar <= _max_price)
      AND (_source IS NULL OR _source = 'all' OR p.source = _source)
      AND (NOT _in_stock OR NOT p.track_inventory OR p.stock_qty > 0)
      AND (_category IS NULL OR p.top_category ILIKE '%' || _category || '%'
        OR p.sub_category ILIKE '%' || _category || '%'
        OR p.detailed_category ILIKE '%' || _category || '%')
      AND NOT EXISTS (
        SELECT 1 FROM normalized n
        WHERE NOT (
          p.name ILIKE '%' || n.term || '%'
          OR COALESCE(p.name_ar, '') ILIKE '%' || n.term || '%'
          OR p.sku ILIKE '%' || n.term || '%'
          OR p.top_category ILIKE '%' || n.term || '%'
          OR p.sub_category ILIKE '%' || n.term || '%'
          OR p.detailed_category ILIKE '%' || n.term || '%'
        )
      )
    LIMIT 1500
  ), scored AS (
    SELECT c.*,
      (SELECT COALESCE(sum(
        CASE
          WHEN lower(c.name) = n.term OR lower(COALESCE(c.name_ar, '')) = n.term THEN 12
          WHEN c.name ILIKE n.term || '%' OR COALESCE(c.name_ar, '') ILIKE n.term || '%' THEN 8
          WHEN c.name ILIKE '%' || n.term || '%' OR COALESCE(c.name_ar, '') ILIKE '%' || n.term || '%' THEN 5
          WHEN c.sku ILIKE '%' || n.term || '%' THEN 4
          ELSE 2
        END
      ), 0) FROM normalized n)::real AS score,
      count(*) OVER() AS result_count
    FROM candidates c
  )
  SELECT s.id, s.sku, s.name, s.name_ar, s.top_category, s.sub_category,
    s.detailed_category, s.source, s.images, s.price_sar, s.price_usd,
    s.cost_usd, s.bulk_price, s.bulk_price_usd, s.dropship_price,
    s.dropship_price_usd, s.moq, s.weight_kg, s.estimated_delivery,
    s.labelling_available, s.platforms, s.stock_qty, s.track_inventory,
    s.is_featured, s.created_at, s.score, s.result_count
  FROM scored s
  ORDER BY s.score DESC, s.is_featured DESC, s.id ASC
  LIMIT LEAST(GREATEST(_limit, 1), 48)
  OFFSET GREATEST(_offset, 0)
$function$;