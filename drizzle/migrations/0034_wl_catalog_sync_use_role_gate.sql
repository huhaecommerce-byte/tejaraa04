DO $$
DECLARE src text;
BEGIN
  SELECT prosrc INTO src FROM pg_proc WHERE proname = 'wl_sync_product_to_catalog';
  src := replace(src,
    'SELECT EXISTS (
    SELECT 1 FROM public.wl_applications a
    WHERE a.user_id = w.supplier_id AND a.status = ''approved''
  ) INTO v_approved;',
    'v_approved := public.wl_supplier_is_approved(w.supplier_id);');
  EXECUTE 'CREATE OR REPLACE FUNCTION public.wl_sync_product_to_catalog(_wl_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$' || src || '$fn$';
END $$;

SELECT public.wl_sync_product_to_catalog(id) FROM public.wl_products;
