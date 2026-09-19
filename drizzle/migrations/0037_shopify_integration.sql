-- Shopify integration for dropshippers

CREATE TABLE public.shopify_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_integration_id uuid,
  name text NOT NULL,
  shop_domain text NOT NULL,
  shop_name text,
  access_token_ciphertext text NOT NULL,
  api_version text NOT NULL DEFAULT '2025-07',
  location_id text,
  location_name text,
  currency text NOT NULL DEFAULT 'SAR',
  market text NOT NULL DEFAULT 'sa',
  pricing_rules jsonb NOT NULL DEFAULT '{"type":"percent","value":15,"perMarket":{"sa":15,"ae":15}}'::jsonb,
  safety_stock integer NOT NULL DEFAULT 0,
  auto_sync boolean NOT NULL DEFAULT true,
  setup_completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  last_auth_at timestamptz,
  last_product_sync_at timestamptz,
  last_inventory_sync_at timestamptz,
  last_order_sync_at timestamptz,
  webhook_secret_hash text,
  webhooks_registered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shop_domain)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_connections TO authenticated;
GRANT ALL ON public.shopify_connections TO service_role;
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopify connections" ON public.shopify_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shopify_product_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.shopify_connections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  partner_sku text NOT NULL,
  shopify_product_id text,
  shopify_variant_id text,
  inventory_item_id text,
  handle text,
  markup_type text NOT NULL DEFAULT 'percent',
  markup_value numeric,
  override_price numeric,
  content_status text NOT NULL DEFAULT 'draft',
  sync_status text NOT NULL DEFAULT 'draft',
  last_error text,
  last_pushed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_product_links TO authenticated;
GRANT ALL ON public.shopify_product_links TO service_role;
ALTER TABLE public.shopify_product_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopify product links" ON public.shopify_product_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX shopify_product_links_product_idx ON public.shopify_product_links(product_id);

CREATE TABLE public.shopify_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.shopify_connections(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  order_number text,
  financial_status text,
  fulfillment_status text,
  currency text NOT NULL DEFAULT 'SAR',
  order_total numeric NOT NULL DEFAULT 0,
  customer_name text,
  customer_email text,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  tejaraa_order_id uuid,
  status text NOT NULL DEFAULT 'new',
  last_error text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  placed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_orders TO authenticated;
GRANT ALL ON public.shopify_orders TO service_role;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopify orders" ON public.shopify_orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shopify_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.shopify_orders(id) ON DELETE CASCADE,
  product_id uuid,
  sku text,
  name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_order_items TO authenticated;
GRANT ALL ON public.shopify_order_items TO service_role;
ALTER TABLE public.shopify_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopify order items" ON public.shopify_order_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shopify_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.shopify_connections(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  entity_type text NOT NULL DEFAULT 'product_link',
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_sync_jobs TO authenticated;
GRANT ALL ON public.shopify_sync_jobs TO service_role;
ALTER TABLE public.shopify_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopify sync jobs" ON public.shopify_sync_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX shopify_sync_jobs_queue_idx ON public.shopify_sync_jobs(status, run_after);

CREATE TABLE public.shopify_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.shopify_connections(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound',
  operation text NOT NULL,
  status text NOT NULL,
  message text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shopify_sync_log TO authenticated;
GRANT ALL ON public.shopify_sync_log TO service_role;
ALTER TABLE public.shopify_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopify sync log" ON public.shopify_sync_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX shopify_sync_log_connection_idx ON public.shopify_sync_log(connection_id, created_at DESC);

CREATE TABLE public.shopify_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES public.shopify_connections(id) ON DELETE CASCADE,
  webhook_id text NOT NULL UNIQUE,
  topic text NOT NULL,
  shop_domain text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.shopify_webhook_events TO service_role;
ALTER TABLE public.shopify_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER shopify_connections_updated_at BEFORE UPDATE ON public.shopify_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER shopify_product_links_updated_at BEFORE UPDATE ON public.shopify_product_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER shopify_orders_updated_at BEFORE UPDATE ON public.shopify_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Any stock or price change in Tejaraa queues a push to every linked Shopify store.
CREATE OR REPLACE FUNCTION public.trg_products_shopify_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stock_qty IS DISTINCT FROM OLD.stock_qty OR NEW.price_sar IS DISTINCT FROM OLD.price_sar THEN
    INSERT INTO public.shopify_sync_jobs (user_id, connection_id, job_type, entity_type, entity_id, payload)
    SELECT l.user_id, l.connection_id, 'sync_product', 'product_link', l.id::text, '{}'::jsonb
    FROM public.shopify_product_links l
    JOIN public.shopify_connections c ON c.id = l.connection_id
    WHERE l.product_id = NEW.id
      AND l.shopify_variant_id IS NOT NULL
      AND c.auto_sync
      AND c.status = 'healthy'
      AND NOT EXISTS (
        SELECT 1 FROM public.shopify_sync_jobs j
        WHERE j.connection_id = l.connection_id
          AND j.job_type = 'sync_product'
          AND j.entity_id = l.id::text
          AND j.status = 'queued'
      );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_shopify_sync AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.trg_products_shopify_sync();