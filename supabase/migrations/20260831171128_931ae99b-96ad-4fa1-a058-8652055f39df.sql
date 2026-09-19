CREATE OR REPLACE FUNCTION public.hunt_catalog_products(
  _terms text[],
  _category text DEFAULT NULL,
  _min_price numeric DEFAULT NULL,
  _max_price numeric DEFAULT NULL,
  _source text DEFAULT NULL,
  _in_stock boolean DEFAULT true,
  _limit integer DEFAULT 24,
  _offset integer DEFAULT 0,
  _relaxed boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, sku text, name text, name_ar text, top_category text,
  sub_category text, detailed_category text, source text, images text[],
  price_sar numeric, price_usd numeric, cost_usd numeric, bulk_price numeric,
  bulk_price_usd numeric, dropship_price numeric, dropship_price_usd numeric,
  moq integer, weight_kg numeric, estimated_delivery text,
  labelling_available boolean, platforms text[], stock_qty integer,
  track_inventory boolean, is_featured boolean, created_at timestamptz,
  match_score real, total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT DISTINCT lower(trim(t)) AS term
    FROM unnest(COALESCE(_terms, ARRAY[]::text[])) AS t
    WHERE length(trim(t)) >= 2
    LIMIT 8
  ), candidates AS (
    SELECT p.*,
      (SELECT COALESCE(sum(
        CASE
          WHEN lower(p.name) = n.term OR lower(COALESCE(p.name_ar, '')) = n.term THEN 12
          WHEN lower(p.name) LIKE n.term || '%' OR lower(COALESCE(p.name_ar, '')) LIKE n.term || '%' THEN 8
          WHEN lower(p.name) LIKE '%' || n.term || '%' OR lower(COALESCE(p.name_ar, '')) LIKE '%' || n.term || '%' THEN 5
          WHEN lower(p.sku) LIKE '%' || n.term || '%' THEN 4
          WHEN lower(p.top_category) LIKE '%' || n.term || '%'
            OR lower(p.sub_category) LIKE '%' || n.term || '%'
            OR lower(p.detailed_category) LIKE '%' || n.term || '%' THEN 2
          ELSE 0
        END
      ), 0) FROM normalized n)::real AS score
    FROM public.products p
    WHERE
      (_relaxed OR _min_price IS NULL OR p.price_sar >= _min_price)
      AND (_relaxed OR _max_price IS NULL OR p.price_sar <= _max_price)
      AND (_source IS NULL OR _source = 'all' OR p.source = _source)
      AND (NOT _in_stock OR NOT p.track_inventory OR p.stock_qty > 0)
      AND (_category IS NULL OR lower(p.top_category) LIKE '%' || lower(_category) || '%'
        OR lower(p.sub_category) LIKE '%' || lower(_category) || '%'
        OR lower(p.detailed_category) LIKE '%' || lower(_category) || '%')
      AND NOT EXISTS (
        SELECT 1 FROM normalized n
        WHERE NOT (
          lower(p.name) LIKE '%' || n.term || '%'
          OR lower(COALESCE(p.name_ar, '')) LIKE '%' || n.term || '%'
          OR lower(p.sku) LIKE '%' || n.term || '%'
          OR lower(p.top_category) LIKE '%' || n.term || '%'
          OR lower(p.sub_category) LIKE '%' || n.term || '%'
          OR lower(p.detailed_category) LIKE '%' || n.term || '%'
        )
      )
  ), counted AS (
    SELECT c.*, count(*) OVER() AS result_count
    FROM candidates c
    WHERE c.score > 0 OR NOT EXISTS (SELECT 1 FROM normalized)
  )
  SELECT c.id, c.sku, c.name, c.name_ar, c.top_category, c.sub_category,
    c.detailed_category, c.source, c.images, c.price_sar, c.price_usd,
    c.cost_usd, c.bulk_price, c.bulk_price_usd, c.dropship_price,
    c.dropship_price_usd, c.moq, c.weight_kg, c.estimated_delivery,
    c.labelling_available, c.platforms, c.stock_qty, c.track_inventory,
    c.is_featured, c.created_at, c.score, c.result_count
  FROM counted c
  ORDER BY c.score DESC, c.is_featured DESC, c.id ASC
  LIMIT LEAST(GREATEST(_limit, 1), 48)
  OFFSET GREATEST(_offset, 0)
$$;

REVOKE ALL ON FUNCTION public.hunt_catalog_products(text[], text, numeric, numeric, text, boolean, integer, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hunt_catalog_products(text[], text, numeric, numeric, text, boolean, integer, integer, boolean) TO authenticated, service_role;