-- Retail / bulk storefront orders (guest checkout supported)
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  user_id uuid,
  buyer_type text NOT NULL DEFAULT 'retail',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  region text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_sar numeric NOT NULL DEFAULT 0,
  shipping_sar numeric NOT NULL DEFAULT 0,
  vat_sar numeric NOT NULL DEFAULT 0,
  total_sar numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.shop_orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can place a shop order" ON public.shop_orders;
CREATE POLICY "Anyone can place a shop order"
  ON public.shop_orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users read own shop orders" ON public.shop_orders;
CREATE POLICY "Users read own shop orders"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff read all shop orders" ON public.shop_orders;
CREATE POLICY "Staff read all shop orders"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff update shop orders" ON public.shop_orders;
CREATE POLICY "Staff update shop orders"
  ON public.shop_orders FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_shop_orders_created_at ON public.shop_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON public.shop_orders (user_id);