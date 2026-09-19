DROP FUNCTION IF EXISTS public.wl_resync_catalog();
-- 1. Link column between a wholesaler listing and its mirrored shop/dropshipping product
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wl_product_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS products_wl_product_id_key ON public.products (wl_product_id) WHERE wl_product_id IS NOT NULL;

-- 2. Image mapper: supplier jsonb images -> public text[] urls (served by /api/public/partner-image)
CREATE OR REPLACE FUNCTION public.wl_catalog_image_urls(_images jsonb)
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT COALESCE(NULLIF((SELECT value FROM public.platform_settings WHERE key = 'partner_image_public_base'), ''),
                    '/api/public/partner-image') AS url
  ), items AS (
    SELECT CASE
      WHEN jsonb_typeof(e) = 'string' AND (e #>> '{}') LIKE 'http%' THEN e #>> '{}'
      WHEN jsonb_typeof(e) = 'string' AND COALESCE(e #>> '{}', '') <> '' THEN (SELECT url FROM base) || '/' || (e #>> '{}')
      WHEN jsonb_typeof(e) = 'object' AND COALESCE(e ->> 'url', '') <> '' THEN e ->> 'url'
      WHEN jsonb_typeof(e) = 'object' AND COALESCE(e ->> 'path', '') <> '' THEN (SELECT url FROM base) || '/' || (e ->> 'path')
      ELSE NULL
    END AS u
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(COALESCE(_images, '[]'::jsonb)) = 'array' THEN _images ELSE '[]'::jsonb END) e
  )
  SELECT COALESCE(array_agg(u) FILTER (WHERE u IS NOT NULL AND u <> ''), '{}'::text[]) FROM items;
$$;

-- 3. Core sync: mirrors one approved + active wholesaler listing into public.products
CREATE OR REPLACE FUNCTION public.wl_sync_product_to_catalog(_wl_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.wl_products;
  v_approved boolean := false;
  v_rate numeric := COALESCE(public.pricing_setting('usd_to_sar_rate', 3.75), 3.75);
  v_aed numeric := COALESCE(public.pricing_setting('usd_to_aed_rate', 3.6725), 3.6725);
  v_fx numeric;
  v_cost numeric;
  v_bulk_sar numeric;
  v_drop_sar numeric;
  v_imgs text[];
  v_cat text;
  v_sku text;
  v_existing uuid;
BEGIN
  SELECT * INTO w FROM public.wl_products WHERE id = _wl_id;
  IF NOT FOUND THEN
    DELETE FROM public.products WHERE wl_product_id = _wl_id;
    RETURN 'removed';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wl_applications a
    WHERE a.user_id = w.supplier_id AND a.status = 'approved'
  ) INTO v_approved;

  v_imgs := public.wl_catalog_image_urls(w.images);

  IF NOT (v_approved AND w.status = 'active' AND w.is_active
          AND COALESCE(array_length(v_imgs, 1), 0) > 0
          AND COALESCE(w.wholesale_price, 0) > 0) THEN
    DELETE FROM public.products WHERE wl_product_id = _wl_id;
    RETURN 'removed';
  END IF;

  IF v_rate <= 0 THEN v_rate := 3.75; END IF;
  IF v_aed <= 0 THEN v_aed := 3.6725; END IF;
  v_fx := CASE upper(COALESCE(NULLIF(w.currency, ''), 'AED'))
            WHEN 'USD' THEN 1
            WHEN 'SAR' THEN v_rate
            ELSE v_aed
          END;

  v_cost := round(COALESCE(w.wholesale_price, 0) / v_fx, 4);
  v_bulk_sar := round(v_cost * v_rate, 2);
  v_drop_sar := CASE WHEN COALESCE(w.dropship_price, 0) > 0
                     THEN round(COALESCE(w.dropship_price, 0) / v_fx * v_rate, 2)
                     ELSE v_bulk_sar END;
  v_cat := COALESCE(NULLIF(w.category, ''), 'General');
  v_sku := COALESCE(NULLIF(w.sku, ''), 'WL-' || upper(left(replace(w.id::text, '-', ''), 10)));

  SELECT id INTO v_existing FROM public.products WHERE wl_product_id = w.id;

  IF v_existing IS NOT NULL THEN
    UPDATE public.products SET
      supplier_id = w.supplier_id,
      sku = v_sku,
      name = w.name,
      description = NULLIF(w.description, ''),
      top_category = v_cat,
      sub_category = v_cat,
      detailed_category = COALESCE(NULLIF(w.brand, ''), v_cat),
      source = 'local',
      images = v_imgs,
      cost_usd = v_cost,
      bulk_price = v_bulk_sar,
      bulk_price_usd = round(v_bulk_sar / v_rate, 2),
      dropship_price = v_drop_sar,
      dropship_price_usd = round(v_drop_sar / v_rate, 2),
      moq = GREATEST(COALESCE(w.moq, 1), 1),
      stock_qty = GREATEST(COALESCE(w.stock, 0), 0),
      track_inventory = true,
      updated_at = now()
    WHERE id = v_existing;
  ELSE
    INSERT INTO public.products (
      wl_product_id, supplier_id, sku, name, description,
      top_category, sub_category, detailed_category,
      source, images, cost_usd, bulk_price, bulk_price_usd,
      dropship_price, dropship_price_usd, moq, stock_qty,
      track_inventory, created_by_source
    ) VALUES (
      w.id, w.supplier_id, v_sku, w.name, NULLIF(w.description, ''),
      v_cat, v_cat, COALESCE(NULLIF(w.brand, ''), v_cat),
      'local', v_imgs, v_cost, v_bulk_sar, round(v_bulk_sar / v_rate, 2),
      v_drop_sar, round(v_drop_sar / v_rate, 2),
      GREATEST(COALESCE(w.moq, 1), 1), GREATEST(COALESCE(w.stock, 0), 0),
      true, 'supplier_sync'
    );
  END IF;

  RETURN 'synced';
END;
$$;

-- 4. Triggers: wholesaler listing changes propagate instantly
CREATE OR REPLACE FUNCTION public.trg_wl_products_catalog_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.products WHERE wl_product_id = OLD.id;
    RETURN OLD;
  END IF;
  PERFORM public.wl_sync_product_to_catalog(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wl_products_catalog_sync ON public.wl_products;
CREATE TRIGGER wl_products_catalog_sync
AFTER INSERT OR UPDATE OR DELETE ON public.wl_products
FOR EACH ROW EXECUTE FUNCTION public.trg_wl_products_catalog_sync();

-- Supplier approval / suspension re-syncs that supplier's whole catalogue
CREATE OR REPLACE FUNCTION public.trg_wl_applications_catalog_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    FOR r IN SELECT id FROM public.wl_products WHERE supplier_id = NEW.user_id LOOP
      PERFORM public.wl_sync_product_to_catalog(r.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wl_applications_catalog_sync ON public.wl_applications;
CREATE TRIGGER wl_applications_catalog_sync
AFTER UPDATE OF status ON public.wl_applications
FOR EACH ROW EXECUTE FUNCTION public.trg_wl_applications_catalog_sync();

-- 5. Admin-callable full resync
CREATE OR REPLACE FUNCTION public.wl_resync_catalog()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_synced int := 0;
  v_skipped int := 0;
  v_result text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can resync the catalogue';
  END IF;
  FOR r IN SELECT id FROM public.wl_products LOOP
    v_result := public.wl_sync_product_to_catalog(r.id);
    IF v_result = 'synced' THEN v_synced := v_synced + 1; ELSE v_skipped := v_skipped + 1; END IF;
  END LOOP;
  DELETE FROM public.products p
  WHERE p.wl_product_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.wl_products w WHERE w.id = p.wl_product_id);
  RETURN json_build_object('synced', v_synced, 'skipped', v_skipped, 'at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.wl_sync_product_to_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wl_resync_catalog() TO authenticated;
GRANT EXECUTE ON FUNCTION public.wl_resync_catalog() TO service_role;
GRANT EXECUTE ON FUNCTION public.wl_catalog_image_urls(jsonb) TO anon, authenticated, service_role;

-- 6. Backfill existing wholesaler listings
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.wl_products LOOP
    PERFORM public.wl_sync_product_to_catalog(r.id);
  END LOOP;
END $$;