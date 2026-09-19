CREATE OR REPLACE FUNCTION public.wl_sync_product_to_catalog(_wl_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_top text;
  v_sub text;
  v_detail text;
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

  -- Three-level categories come from the shared category tree when the
  -- supplier picked them; otherwise fall back to the legacy single value.
  SELECT c.name INTO v_top FROM public.sunsky_categories c WHERE c.category_id = w.category_l1_id;
  SELECT c.name INTO v_sub FROM public.sunsky_categories c WHERE c.category_id = w.category_l2_id;
  SELECT c.name INTO v_detail FROM public.sunsky_categories c WHERE c.category_id = w.category_l3_id;
  v_top := COALESCE(NULLIF(v_top, ''), v_cat);
  v_sub := COALESCE(NULLIF(v_sub, ''), v_top);
  v_detail := COALESCE(NULLIF(v_detail, ''), v_sub);

  SELECT id INTO v_existing FROM public.products WHERE wl_product_id = w.id;

  IF v_existing IS NOT NULL THEN
    UPDATE public.products SET
      supplier_id = w.supplier_id,
      sku = v_sku,
      name = w.name,
      description = NULLIF(w.description, ''),
      top_category = v_top,
      sub_category = v_sub,
      detailed_category = v_detail,
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
      v_top, v_sub, v_detail,
      'local', v_imgs, v_cost, v_bulk_sar, round(v_bulk_sar / v_rate, 2),
      v_drop_sar, round(v_drop_sar / v_rate, 2),
      GREATEST(COALESCE(w.moq, 1), 1), GREATEST(COALESCE(w.stock, 0), 0),
      true, 'supplier_sync'
    );
  END IF;

  RETURN 'synced';
END;
$function$;