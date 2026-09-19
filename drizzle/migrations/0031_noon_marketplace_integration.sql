ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gtin text;
CREATE INDEX IF NOT EXISTS products_gtin_idx ON public.products (gtin) WHERE gtin IS NOT NULL;

CREATE TABLE public.noon_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_integration_id uuid REFERENCES public.store_integrations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Noon',
  mode text NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox','production')),
  key_id text NOT NULL,
  private_key_ciphertext text NOT NULL,
  project_code text NOT NULL,
  credential_label text NOT NULL DEFAULT '',
  enabled_markets text[] NOT NULL DEFAULT ARRAY['sa','ae']::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','healthy','error','disabled')),
  pricing_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_auth_at timestamptz,
  last_product_sync_at timestamptz,
  last_inventory_sync_at timestamptz,
  last_order_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_connections TO authenticated;
GRANT ALL ON public.noon_connections TO service_role;
ALTER TABLE public.noon_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon connections" ON public.noon_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.noon_connections(id) ON DELETE CASCADE,
  market text NOT NULL CHECK (market IN ('sa','ae')),
  warehouse_code text NOT NULL,
  warehouse_name text NOT NULL DEFAULT '',
  processing_time integer NOT NULL DEFAULT 1 CHECK (processing_time BETWEEN 0 AND 30),
  safety_stock integer NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, market, warehouse_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_warehouses TO authenticated;
GRANT ALL ON public.noon_warehouses TO service_role;
ALTER TABLE public.noon_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon warehouses" ON public.noon_warehouses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_category_cache (
  category_code text PRIMARY KEY,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.noon_category_cache TO authenticated;
GRANT ALL ON public.noon_category_cache TO service_role;
ALTER TABLE public.noon_category_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read Noon categories" ON public.noon_category_cache FOR SELECT TO authenticated USING (true);

CREATE TABLE public.noon_attribute_cache (
  category_code text PRIMARY KEY REFERENCES public.noon_category_cache(category_code) ON DELETE CASCADE,
  schema_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.noon_attribute_cache TO authenticated;
GRANT ALL ON public.noon_attribute_cache TO service_role;
ALTER TABLE public.noon_attribute_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read Noon attributes" ON public.noon_attribute_cache FOR SELECT TO authenticated USING (true);

CREATE TABLE public.noon_category_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.noon_connections(id) ON DELETE CASCADE,
  source_category text NOT NULL,
  noon_category_code text NOT NULL,
  noon_category_name text NOT NULL DEFAULT '',
  attribute_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, source_category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_category_mappings TO authenticated;
GRANT ALL ON public.noon_category_mappings TO service_role;
ALTER TABLE public.noon_category_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon category mappings" ON public.noon_category_mappings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_product_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.noon_connections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  partner_sku text NOT NULL,
  noon_category_code text,
  noon_sku_parent text,
  noon_variant_sku text,
  psku_code text,
  selected_markets text[] NOT NULL DEFAULT ARRAY['sa','ae']::text[],
  attribute_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_status text NOT NULL DEFAULT 'draft',
  content_status text NOT NULL DEFAULT 'not_submitted',
  qc_status text NOT NULL DEFAULT 'not_submitted',
  image_status text NOT NULL DEFAULT 'not_submitted',
  offer_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_pushed_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, product_id),
  UNIQUE (connection_id, partner_sku)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_product_links TO authenticated;
GRANT ALL ON public.noon_product_links TO service_role;
ALTER TABLE public.noon_product_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon product links" ON public.noon_product_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_product_market_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_link_id uuid NOT NULL REFERENCES public.noon_product_links(id) ON DELETE CASCADE,
  market text NOT NULL CHECK (market IN ('sa','ae')),
  markup_type text NOT NULL DEFAULT 'percent' CHECK (markup_type IN ('percent','fixed')),
  markup_value numeric(12,2) NOT NULL DEFAULT 0,
  override_price numeric(12,2),
  minimum_margin_percent numeric(7,2) NOT NULL DEFAULT 0,
  calculated_price numeric(12,2),
  published_price numeric(12,2),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_link_id, market)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_product_market_settings TO authenticated;
GRANT ALL ON public.noon_product_market_settings TO service_role;
ALTER TABLE public.noon_product_market_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon market settings" ON public.noon_product_market_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.noon_connections(id) ON DELETE CASCADE,
  external_reference text NOT NULL,
  market text NOT NULL DEFAULT '',
  warehouse_code text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  external_status text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'SAR',
  order_total numeric(12,2) NOT NULL DEFAULT 0,
  customer_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipment_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  placed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_reference)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_orders TO authenticated;
GRANT ALL ON public.noon_orders TO service_role;
ALTER TABLE public.noon_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon orders" ON public.noon_orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.noon_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  partner_sku text NOT NULL,
  name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT '',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_order_items TO authenticated;
GRANT ALL ON public.noon_order_items TO service_role;
ALTER TABLE public.noon_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon order items" ON public.noon_order_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL UNIQUE,
  project_code text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  order_reference text NOT NULL DEFAULT '',
  connection_id uuid REFERENCES public.noon_connections(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'received',
  attempt_count integer NOT NULL DEFAULT 0,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT ON public.noon_webhook_events TO authenticated;
GRANT ALL ON public.noon_webhook_events TO service_role;
ALTER TABLE public.noon_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read Noon webhook events" ON public.noon_webhook_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.noon_connections c WHERE c.id = connection_id AND c.user_id = auth.uid()));

CREATE TABLE public.noon_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  connection_id uuid REFERENCES public.noon_connections(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','dead')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 6,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX noon_sync_jobs_ready_idx ON public.noon_sync_jobs (status, run_after);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noon_sync_jobs TO authenticated;
GRANT ALL ON public.noon_sync_jobs TO service_role;
ALTER TABLE public.noon_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage Noon sync jobs" ON public.noon_sync_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.noon_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.noon_connections(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'outbound',
  operation text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  market text NOT NULL DEFAULT '',
  status text NOT NULL,
  provider_request_id text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX noon_sync_log_connection_created_idx ON public.noon_sync_log (connection_id, created_at DESC);
GRANT SELECT ON public.noon_sync_log TO authenticated;
GRANT ALL ON public.noon_sync_log TO service_role;
ALTER TABLE public.noon_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read Noon sync logs" ON public.noon_sync_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.noon_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER noon_connections_updated BEFORE UPDATE ON public.noon_connections FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();
CREATE TRIGGER noon_warehouses_updated BEFORE UPDATE ON public.noon_warehouses FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();
CREATE TRIGGER noon_category_mappings_updated BEFORE UPDATE ON public.noon_category_mappings FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();
CREATE TRIGGER noon_product_links_updated BEFORE UPDATE ON public.noon_product_links FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();
CREATE TRIGGER noon_market_settings_updated BEFORE UPDATE ON public.noon_product_market_settings FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();
CREATE TRIGGER noon_orders_updated BEFORE UPDATE ON public.noon_orders FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();
CREATE TRIGGER noon_jobs_updated BEFORE UPDATE ON public.noon_sync_jobs FOR EACH ROW EXECUTE FUNCTION public.noon_set_updated_at();