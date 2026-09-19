-- Roles
CREATE TYPE public.wl_role AS ENUM ('admin', 'supplier', 'staff', 'finance', 'viewer');

CREATE TABLE public.wl_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.wl_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.wl_user_roles TO authenticated;
GRANT ALL ON public.wl_user_roles TO service_role;
ALTER TABLE public.wl_user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.wl_has_role(_user_id uuid, _role public.wl_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.wl_user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.wl_user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.wl_user_roles FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.wl_partner_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wl_partner_profiles TO authenticated;
GRANT ALL ON public.wl_partner_profiles TO service_role;
ALTER TABLE public.wl_partner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.wl_partner_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.wl_partner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.wl_partner_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.wl_partner_profiles FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));

-- Application status
CREATE TYPE public.wl_application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.wl_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.wl_application_status NOT NULL DEFAULT 'pending',
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_mobile text NOT NULL DEFAULT '',
  account_country text NOT NULL DEFAULT '',
  business_type text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  trading_name text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  documents jsonb NOT NULL DEFAULT '{}'::jsonb,
  warehouses jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_notes text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wl_applications TO authenticated;
GRANT ALL ON public.wl_applications TO service_role;
ALTER TABLE public.wl_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers read own application" ON public.wl_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Suppliers insert own application" ON public.wl_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all applications" ON public.wl_applications FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update applications" ON public.wl_applications FOR UPDATE TO authenticated USING (public.wl_has_role(auth.uid(), 'admin')) WITH CHECK (public.wl_has_role(auth.uid(), 'admin'));

-- Products
CREATE TYPE public.wl_product_status AS ENUM ('draft', 'pending', 'active', 'rejected', 'out_of_stock');

CREATE TABLE public.wl_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sku text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  wholesale_price numeric NOT NULL DEFAULT 0,
  dropship_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AED',
  moq integer NOT NULL DEFAULT 1,
  stock integer NOT NULL DEFAULT 0,
  warehouse text NOT NULL DEFAULT '',
  status public.wl_product_status NOT NULL DEFAULT 'pending',
  review_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_products TO authenticated;
GRANT ALL ON public.wl_products TO service_role;
ALTER TABLE public.wl_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers manage own products" ON public.wl_products FOR ALL TO authenticated USING (auth.uid() = supplier_id) WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "Admins read all products" ON public.wl_products FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.wl_products FOR UPDATE TO authenticated USING (public.wl_has_role(auth.uid(), 'admin')) WITH CHECK (public.wl_has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.wl_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT '',
  supplier_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL DEFAULT '',
  product_summary text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  order_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AED',
  buyer_country text NOT NULL DEFAULT '',
  shipping text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wl_orders TO authenticated;
GRANT ALL ON public.wl_orders TO service_role;
ALTER TABLE public.wl_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers read own orders" ON public.wl_orders FOR SELECT TO authenticated USING (auth.uid() = supplier_id);
CREATE POLICY "Suppliers update own orders" ON public.wl_orders FOR UPDATE TO authenticated USING (auth.uid() = supplier_id) WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "Admins read all orders" ON public.wl_orders FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.wl_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.wl_partner_profiles FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.wl_applications FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.wl_products FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.wl_orders FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();

CREATE OR REPLACE FUNCTION public.wl_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.wl_partner_profiles (id, first_name, last_name, email, mobile, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wl_user_roles (user_id, role) VALUES (NEW.id, 'supplier') ON CONFLICT DO NOTHING;

  IF lower(COALESCE(NEW.email, '')) = 'zurwa.ecommerce@gmail.com' THEN
    INSERT INTO public.wl_user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER wl_on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.wl_handle_new_user();

REVOKE EXECUTE ON FUNCTION public.wl_handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wl_has_role(uuid, public.wl_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wl_has_role(uuid, public.wl_role) TO authenticated;

CREATE TABLE public.wl_settings (
  supplier_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  channels jsonb NOT NULL DEFAULT '{"Our Storefront":true,"B2B Buyers":true,"Dropshipping Network":false,"API Integrations":false}'::jsonb,
  dropship_enabled boolean NOT NULL DEFAULT false,
  dropship_uplift numeric NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  min_order_value numeric NOT NULL DEFAULT 0,
  default_currency text NOT NULL DEFAULT 'AED',
  bank_name text NOT NULL DEFAULT '',
  bank_iban text NOT NULL DEFAULT '',
  bank_account_name text NOT NULL DEFAULT '',
  order_notifications boolean NOT NULL DEFAULT true,
  stock_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wl_settings TO authenticated;
GRANT ALL ON public.wl_settings TO service_role;
ALTER TABLE public.wl_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers manage own settings" ON public.wl_settings FOR ALL TO authenticated USING (auth.uid() = supplier_id) WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "Admins read all settings" ON public.wl_settings FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));
CREATE TRIGGER supplier_settings_updated_at BEFORE UPDATE ON public.wl_settings FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();

CREATE TABLE public.wl_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AED',
  status text NOT NULL DEFAULT 'requested',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wl_payout_requests TO authenticated;
GRANT ALL ON public.wl_payout_requests TO service_role;
ALTER TABLE public.wl_payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers read own payouts" ON public.wl_payout_requests FOR SELECT TO authenticated USING (auth.uid() = supplier_id);
CREATE POLICY "Suppliers request own payouts" ON public.wl_payout_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "Admins read all payouts" ON public.wl_payout_requests FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update payouts" ON public.wl_payout_requests FOR UPDATE TO authenticated USING (public.wl_has_role(auth.uid(), 'admin')) WITH CHECK (public.wl_has_role(auth.uid(), 'admin'));
CREATE TRIGGER payout_requests_updated_at BEFORE UPDATE ON public.wl_payout_requests FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();

ALTER TABLE public.wl_products ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS wl_products_supplier_sku_unique ON public.wl_products (supplier_id, sku) WHERE sku <> '';
ALTER TABLE public.wl_products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.wl_products ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.wl_settings
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS payout_document text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payout_document_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payout_review_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payout_submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payout_reviewed_at timestamp with time zone;

CREATE POLICY "Admins update settings" ON public.wl_settings
  FOR UPDATE TO authenticated
  USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role))
  WITH CHECK (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));

CREATE TABLE public.wl_payout_detail_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  bank_account_name text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  bank_iban text NOT NULL DEFAULT '',
  document_path text NOT NULL DEFAULT '',
  document_name text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX wl_payout_detail_history_supplier_idx ON public.wl_payout_detail_history (supplier_id, created_at DESC);

GRANT SELECT, INSERT ON public.wl_payout_detail_history TO authenticated;
GRANT ALL ON public.wl_payout_detail_history TO service_role;

ALTER TABLE public.wl_payout_detail_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers read own payout history" ON public.wl_payout_detail_history
  FOR SELECT TO authenticated USING (auth.uid() = supplier_id);

CREATE POLICY "Admins read all payout history" ON public.wl_payout_detail_history
  FOR SELECT TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));

CREATE POLICY "Suppliers log own payout history" ON public.wl_payout_detail_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = supplier_id AND auth.uid() = actor_id);

CREATE POLICY "Admins log payout history" ON public.wl_payout_detail_history
  FOR INSERT TO authenticated WITH CHECK (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));

REVOKE EXECUTE ON FUNCTION public.wl_set_updated_at() FROM anon, authenticated, public;

CREATE TABLE public.wl_market_flags (
  code text NOT NULL PRIMARY KEY,
  name text NOT NULL DEFAULT ''::text,
  note text NOT NULL DEFAULT ''::text,
  image_url text NOT NULL DEFAULT ''::text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wl_market_flags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_market_flags TO authenticated;
GRANT ALL ON public.wl_market_flags TO service_role;

ALTER TABLE public.wl_market_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market flags" ON public.wl_market_flags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert market flags" ON public.wl_market_flags FOR INSERT TO authenticated WITH CHECK (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));
CREATE POLICY "Admins update market flags" ON public.wl_market_flags FOR UPDATE TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role)) WITH CHECK (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));
CREATE POLICY "Admins delete market flags" ON public.wl_market_flags FOR DELETE TO authenticated USING (public.wl_has_role(auth.uid(), 'admin'::public.wl_role));

CREATE TRIGGER set_market_flags_updated_at BEFORE UPDATE ON public.wl_market_flags FOR EACH ROW EXECUTE FUNCTION public.wl_set_updated_at();