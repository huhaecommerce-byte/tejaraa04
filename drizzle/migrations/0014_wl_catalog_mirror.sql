ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wl_product_id uuid REFERENCES public.wl_products(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_wl_product_id_key ON public.products (wl_product_id) WHERE wl_product_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.wl_resync_catalog()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_synced integer := 0;
  v_skipped integer := 0;
  r record;
  v_existing uuid;
BEGIN
  IF NOT (public.wl_has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  FOR r IN SELECT * FROM public.wl_products LOOP
    IF r.status::text <> 'active' OR COALESCE(r.is_active, false) = false THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    SELECT id INTO v_existing FROM public.products WHERE wl_product_id = r.id;

    IF v_existing IS NULL THEN
      INSERT INTO public.products (
        name, sku, description, price_sar, dropship_price, bulk_price,
        moq, stock_qty, images, supplier_id, source, created_by_source,
        top_category, sub_category, detailed_category, wl_product_id
      ) VALUES (
        r.name,
        r.sku,
        COALESCE(r.description, ''),
        COALESCE(r.dropship_price, r.wholesale_price, 0),
        COALESCE(r.dropship_price, 0),
        COALESCE(r.wholesale_price, 0),
        COALESCE(r.moq, 0),
        COALESCE(r.stock, 0),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.images) = 'array' THEN r.images ELSE '[]'::jsonb END)), '{}'::text[]),
        r.supplier_id,
        'wholesale',
        'wholesale',
        COALESCE(r.category, ''),
        '',
        '',
        r.id
      );
    ELSE
      UPDATE public.products SET
        name = r.name,
        sku = r.sku,
        description = COALESCE(r.description, ''),
        price_sar = COALESCE(r.dropship_price, r.wholesale_price, 0),
        dropship_price = COALESCE(r.dropship_price, 0),
        bulk_price = COALESCE(r.wholesale_price, 0),
        moq = COALESCE(r.moq, 0),
        stock_qty = COALESCE(r.stock, 0),
        images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.images) = 'array' THEN r.images ELSE '[]'::jsonb END)), '{}'::text[]),
        supplier_id = r.supplier_id,
        top_category = COALESCE(r.category, ''),
        updated_at = now()
      WHERE id = v_existing;
    END IF;

    v_synced := v_synced + 1;
  END LOOP;

  RETURN jsonb_build_object('synced', v_synced, 'skipped', v_skipped);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wl_resync_catalog() FROM anon;
GRANT EXECUTE ON FUNCTION public.wl_resync_catalog() TO authenticated, service_role;