CREATE OR REPLACE FUNCTION public.hunt_catalog_products(_terms text[], _category text DEFAULT NULL::text, _min_price numeric DEFAULT NULL::numeric, _max_price numeric DEFAULT NULL::numeric, _source text DEFAULT NULL::text, _in_stock boolean DEFAULT true, _limit integer DEFAULT 24, _offset integer DEFAULT 0, _relaxed boolean DEFAULT false)
 RETURNS TABLE(id uuid, sku text, name text, name_ar text, top_category text, sub_category text, detailed_category text, source text, images text[], price_sar numeric, price_usd numeric, cost_usd numeric, bulk_price numeric, bulk_price_usd numeric, dropship_price numeric, dropship_price_usd numeric, moq integer, weight_kg numeric, estimated_delivery text, labelling_available boolean, platforms text[], stock_qty integer, track_inventory boolean, is_featured boolean, created_at timestamp with time zone, match_score real, total_count bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_terms text[];
  v_term text;
  v_where text := 'TRUE';
  v_score text := '0';
  v_sql text;
BEGIN
  SELECT COALESCE(array_agg(DISTINCT lower(trim(t))), ARRAY[]::text[])
  INTO v_terms
  FROM unnest(COALESCE(_terms, ARRAY[]::text[])) AS t
  WHERE length(trim(t)) >= 2;

  v_terms := v_terms[1:4];

  FOREACH v_term IN ARRAY v_terms LOOP
    v_where := v_where || format(
      ' AND (p.name ILIKE %1$L OR COALESCE(p.name_ar,'''') ILIKE %1$L OR p.sku ILIKE %1$L'
      || ' OR p.top_category ILIKE %1$L OR p.sub_category ILIKE %1$L OR p.detailed_category ILIKE %1$L)',
      '%' || v_term || '%');
    v_score := v_score || format(
      ' + (CASE WHEN p.name ILIKE %1$L OR COALESCE(p.name_ar,'''') ILIKE %1$L THEN 8'
      || ' WHEN p.name ILIKE %2$L OR COALESCE(p.name_ar,'''') ILIKE %2$L THEN 5'
      || ' WHEN p.sku ILIKE %2$L THEN 4 ELSE 2 END)',
      v_term || '%', '%' || v_term || '%');
  END LOOP;

  IF NOT _relaxed AND _min_price IS NOT NULL THEN
    v_where := v_where || format(' AND p.price_sar >= %L', _min_price);
  END IF;
  IF NOT _relaxed AND _max_price IS NOT NULL THEN
    v_where := v_where || format(' AND p.price_sar <= %L', _max_price);
  END IF;
  IF _source IS NOT NULL AND _source <> 'all' THEN
    v_where := v_where || format(' AND p.source = %L', _source);
  END IF;
  IF _in_stock THEN
    v_where := v_where || ' AND (NOT p.track_inventory OR p.stock_qty > 0)';
  END IF;
  IF _category IS NOT NULL AND length(trim(_category)) > 1 THEN
    v_where := v_where || format(
      ' AND (p.top_category ILIKE %1$L OR p.sub_category ILIKE %1$L OR p.detailed_category ILIKE %1$L)',
      '%' || lower(trim(_category)) || '%');
  END IF;

  v_sql := format($q$
    WITH candidates AS (
      SELECT p.*, (%s)::real AS score
      FROM public.products p
      WHERE %s
      LIMIT 800
    ), scored AS (
      SELECT c.*, count(*) OVER() AS result_count FROM candidates c
    )
    SELECT s.id, s.sku, s.name, s.name_ar, s.top_category, s.sub_category,
      s.detailed_category, s.source, s.images, s.price_sar, s.price_usd,
      s.cost_usd, s.bulk_price, s.bulk_price_usd, s.dropship_price,
      s.dropship_price_usd, s.moq, s.weight_kg, s.estimated_delivery,
      s.labelling_available, s.platforms, s.stock_qty, s.track_inventory,
      s.is_featured, s.created_at, s.score, s.result_count
    FROM scored s
    ORDER BY s.score DESC, s.is_featured DESC, s.id ASC
    LIMIT %s OFFSET %s
  $q$, v_score, v_where, LEAST(GREATEST(COALESCE(_limit, 24), 1), 48), GREATEST(COALESCE(_offset, 0), 0));

  RETURN QUERY EXECUTE v_sql;
END;
$function$;