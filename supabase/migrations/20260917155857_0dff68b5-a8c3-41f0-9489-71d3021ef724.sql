CREATE POLICY "WL Suppliers upload own documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'partner-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers read own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Admins read supplier documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-documents' AND public.wl_has_role(auth.uid(), 'admin'));
CREATE POLICY "WL Suppliers upload own product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers read own product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers update own product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers delete own product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Admins read all product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-product-images' AND public.wl_has_role(auth.uid(), 'admin'));

CREATE TABLE public.wl_channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  notes text NOT NULL DEFAULT '',
  key_hash text NOT NULL DEFAULT '',
  key_prefix text NOT NULL DEFAULT '',
  push_url text NOT NULL DEFAULT '',
  push_secret text NOT NULL DEFAULT '',
  orders_pull_url text NOT NULL DEFAULT '',
  orders_pull_secret text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  last_push_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_channel_connections TO authenticated;
GRANT ALL ON public.wl_channel_connections TO service_role;
ALTER TABLE public.wl_channel_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage channel connections" ON public.wl_channel_connections
  FOR ALL TO authenticated
  USING (public.wl_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.wl_has_role(auth.uid(), 'admin'));

CREATE TRIGGER channel_connections_updated_at BEFORE UPDATE ON public.wl_channel_connections
  FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();

CREATE TABLE public.wl_channel_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES public.wl_channel_connections(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT '',
  event text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wl_channel_sync_log TO authenticated;
GRANT ALL ON public.wl_channel_sync_log TO service_role;
ALTER TABLE public.wl_channel_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read channel sync log" ON public.wl_channel_sync_log
  FOR SELECT TO authenticated
  USING (public.wl_has_role(auth.uid(), 'admin'));

CREATE INDEX wl_channel_sync_log_connection_idx ON public.wl_channel_sync_log (connection_id, created_at DESC);

ALTER TABLE public.wl_orders
  ADD COLUMN connection_id uuid REFERENCES public.wl_channel_connections(id) ON DELETE SET NULL,
  ADD COLUMN external_reference text NOT NULL DEFAULT '',
  ADD COLUMN external_status text NOT NULL DEFAULT '',
  ADD COLUMN raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX wl_orders_connection_external_ref_idx
  ON public.wl_orders (connection_id, external_reference, supplier_id)
  WHERE connection_id IS NOT NULL AND external_reference <> '';

CREATE TABLE public.wl_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.wl_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.wl_products(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wl_order_items TO authenticated;
GRANT ALL ON public.wl_order_items TO service_role;
ALTER TABLE public.wl_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers read own order items" ON public.wl_order_items
  FOR SELECT TO authenticated
  USING (auth.uid() = supplier_id);

CREATE POLICY "Admins read all order items" ON public.wl_order_items
  FOR SELECT TO authenticated
  USING (public.wl_has_role(auth.uid(), 'admin'));

CREATE INDEX wl_order_items_order_idx ON public.wl_order_items (order_id);
CREATE INDEX wl_order_items_supplier_idx ON public.wl_order_items (supplier_id);

CREATE TABLE public.wl_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text NOT NULL DEFAULT ''::text,
  key_hash text NOT NULL DEFAULT ''::text,
  key_prefix text NOT NULL DEFAULT ''::text,
  pull_url text NOT NULL DEFAULT ''::text,
  pull_secret text NOT NULL DEFAULT ''::text,
  enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamp with time zone,
  last_status text NOT NULL DEFAULT ''::text,
  last_error text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX wl_supplier_integrations_key_hash_key ON public.wl_integrations (key_hash) WHERE key_hash <> '';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_integrations TO authenticated;
GRANT ALL ON public.wl_integrations TO service_role;
ALTER TABLE public.wl_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage supplier integrations" ON public.wl_integrations FOR ALL TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role)) WITH CHECK (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));
CREATE TRIGGER supplier_integrations_updated_at BEFORE UPDATE ON public.wl_integrations FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();

CREATE TABLE public.wl_inventory_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid NOT NULL REFERENCES public.wl_integrations(id) ON DELETE CASCADE,
  request_id text NOT NULL DEFAULT ''::text,
  source text NOT NULL DEFAULT 'push'::text,
  status text NOT NULL DEFAULT 'ok'::text,
  accepted integer NOT NULL DEFAULT 0,
  rejected integer NOT NULL DEFAULT 0,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX wl_supplier_inventory_batches_request_key ON public.wl_inventory_batches (integration_id, request_id) WHERE request_id <> '';
GRANT SELECT ON public.wl_inventory_batches TO authenticated;
GRANT ALL ON public.wl_inventory_batches TO service_role;
ALTER TABLE public.wl_inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read inventory batches" ON public.wl_inventory_batches FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));

CREATE TABLE public.wl_inventory_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid REFERENCES public.wl_integrations(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.wl_inventory_batches(id) ON DELETE CASCADE,
  sku text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'ok'::text,
  message text NOT NULL DEFAULT ''::text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wl_inventory_log TO authenticated;
GRANT ALL ON public.wl_inventory_log TO service_role;
ALTER TABLE public.wl_inventory_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read inventory log" ON public.wl_inventory_log FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));

CREATE OR REPLACE FUNCTION public.wl_enforce_product_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  content_changed boolean;
BEGIN
  IF public.wl_has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'draft' THEN
      NEW.review_notes := '';
      RETURN NEW;
    END IF;
    NEW.status := 'pending';
    NEW.review_notes := '';
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'draft' THEN
    NEW.review_notes := '';
    RETURN NEW;
  END IF;

  content_changed := (
    NEW.name IS DISTINCT FROM OLD.name
    OR NEW.sku IS DISTINCT FROM OLD.sku
    OR NEW.brand IS DISTINCT FROM OLD.brand
    OR NEW.category IS DISTINCT FROM OLD.category
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.moq IS DISTINCT FROM OLD.moq
    OR NEW.warehouse IS DISTINCT FROM OLD.warehouse
    OR NEW.images IS DISTINCT FROM OLD.images
  );

  IF content_changed THEN
    NEW.status := 'pending';
    NEW.review_notes := '';
  ELSE
    NEW.status := OLD.status;
    NEW.review_notes := OLD.review_notes;
  END IF;

  RETURN NEW;
END;
$function$;

ALTER TABLE public.wl_partner_profiles ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '';
ALTER TABLE public.wl_partner_profiles ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS wl_profiles_username_unique
  ON public.wl_partner_profiles (lower(username))
  WHERE username <> '';