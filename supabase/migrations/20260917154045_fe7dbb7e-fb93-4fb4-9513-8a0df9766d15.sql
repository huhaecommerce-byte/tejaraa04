CREATE TABLE IF NOT EXISTS public.products (
  bulk_price numeric NOT NULL DEFAULT 0,
  bulk_price_usd numeric NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_email text,
  created_by_source text NOT NULL DEFAULT '',
  description text,
  description_ar text,
  detailed_category text NOT NULL DEFAULT '',
  dropship_price numeric NOT NULL DEFAULT 0,
  dropship_price_usd numeric NOT NULL DEFAULT 0,
  estimated_delivery text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  images text[] NOT NULL DEFAULT '{}'::text[],
  is_featured boolean NOT NULL DEFAULT false,
  labelling_available boolean,
  low_stock_threshold integer NOT NULL DEFAULT 0,
  moq numeric NOT NULL DEFAULT 0,
  name text NOT NULL,
  name_ar text,
  platforms text[],
  price_sar numeric NOT NULL DEFAULT 0,
  price_usd numeric NOT NULL DEFAULT 0,
  search_text text,
  sku text NOT NULL,
  slug text,
  slug_ar text,
  source text NOT NULL DEFAULT '',
  stock_qty integer NOT NULL DEFAULT 0,
  sub_category text NOT NULL DEFAULT '',
  supplier_id uuid,
  top_category text NOT NULL DEFAULT '',
  track_inventory boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  weight_kg numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.profiles (
  avatar_url text,
  billing_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  display_name text,
  email text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL UNIQUE,
  vat_number text
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT '',
  discount_value integer NOT NULL DEFAULT 0,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  max_uses numeric,
  min_order_sar numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  uses_count integer NOT NULL DEFAULT 0,
  valid_from text NOT NULL DEFAULT '',
  valid_until text
);

CREATE TABLE IF NOT EXISTS public.quote_requests (
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  destination text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notes text,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  quoted_price_sar numeric,
  quoted_total_sar numeric,
  status text NOT NULL DEFAULT 'pending',
  target_price_sar numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  valid_until text
);

CREATE TABLE IF NOT EXISTS public.referral_events (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  referral_code text NOT NULL,
  referral_user_id uuid,
  referrer_user_id uuid
);

CREATE TABLE IF NOT EXISTS public.referrals (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_reward_paid boolean NOT NULL DEFAULT false,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid,
  reward_status text NOT NULL DEFAULT '',
  rewarded_at timestamptz,
  user_id uuid NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.release_requests (
  address_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  destination text NOT NULL DEFAULT '',
  fulfillment_type text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  shipped_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  tracking_number text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.request_messages (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_admin boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  request_id uuid NOT NULL,
  request_type text NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.return_requests (
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  photos text[] NOT NULL DEFAULT '{}'::text[],
  reason text NOT NULL,
  refund_amount numeric NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_default boolean NOT NULL DEFAULT false,
  label text NOT NULL DEFAULT '',
  notes text,
  phone text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shop_orders (
  address_line text NOT NULL,
  buyer_type text NOT NULL DEFAULT '',
  city text NOT NULL,
  courier_id uuid,
  courier_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_shipping_sar numeric NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text NOT NULL DEFAULT '',
  order_ref text NOT NULL UNIQUE,
  payment_method text NOT NULL DEFAULT '',
  payment_status text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  shipping_sar numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  subtotal_sar numeric NOT NULL DEFAULT 0,
  total_sar numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  vat_sar numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.signup_otps (
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL PRIMARY KEY,
  expires_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.signup_reminder_log (
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage text NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_events (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  path text NOT NULL DEFAULT '',
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text NOT NULL,
  user_id uuid,
  visitor_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sourcing_requests (
  admin_reply text,
  attachments text[] NOT NULL DEFAULT '{}'::text[],
  category text NOT NULL DEFAULT '',
  converted_product_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  destination text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notes text,
  product_link text,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  quoted_price_sar numeric,
  status text NOT NULL DEFAULT 'pending',
  target_price_sar numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid,
  modules text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS public.store_integrations (
  api_key_encrypted text,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  store_name text NOT NULL DEFAULT '',
  store_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sunsky_callback_events (
  event_type text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processing_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  signature_ok boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.sunsky_categories (
  category_id numeric NOT NULL PRIMARY KEY,
  has_children boolean NOT NULL DEFAULT false,
  level integer NOT NULL DEFAULT 0,
  name text NOT NULL DEFAULT '',
  parent_id numeric,
  product_count integer,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sunsky_import_jobs (
  category_id numeric NOT NULL,
  category_path text NOT NULL DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  failed integer NOT NULL DEFAULT 0,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imported numeric NOT NULL DEFAULT 0,
  last_page integer NOT NULL DEFAULT 0,
  processed integer NOT NULL DEFAULT 0,
  skipped_oos numeric NOT NULL DEFAULT 0,
  started_by uuid,
  status text NOT NULL DEFAULT 'pending',
  total_estimate numeric NOT NULL DEFAULT 0,
  updated numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sunsky_imported_products (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid,
  in_stock boolean NOT NULL DEFAULT false,
  last_category_id numeric,
  last_category_path text,
  last_image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_price_usd numeric,
  last_stock_qty integer,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  markup_override_percent numeric,
  product_id uuid,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sunsky_item_no text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sunsky_orders (
  country_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_order_id uuid,
  labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipping_method text,
  shipping_usd numeric,
  status text NOT NULL DEFAULT 'pending',
  sunsky_order_no text,
  total_usd numeric,
  tracking_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sunsky_settings (
  base_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  default_country text NOT NULL DEFAULT '',
  default_currency text NOT NULL DEFAULT '',
  default_markup_percent numeric NOT NULL DEFAULT 0,
  id boolean NOT NULL DEFAULT true PRIMARY KEY,
  last_balance_check_at timestamptz,
  last_balance_currency text,
  last_balance_value numeric,
  last_sync_at timestamptz,
  mode text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  webhook_secret text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.sunsky_sync_log (
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  error_message text,
  http_status numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latency_ms integer,
  request_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  result text
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  contact_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  lead_time_days integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  notes text NOT NULL DEFAULT '',
  payment_terms text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metadata jsonb,
  reason text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.team_members (
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_email text NOT NULL,
  invite_token text NOT NULL DEFAULT '',
  member_role public.team_member_role NOT NULL DEFAULT 'member',
  member_user_id uuid,
  owner_id uuid NOT NULL,
  status public.team_invite_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_admin boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  source text NOT NULL DEFAULT '',
  ticket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  whatsapp_msg_id text
);

CREATE TABLE IF NOT EXISTS public.tickets (
  category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  last_admin_wa_msg_id text,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  subject text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usage_limit_defaults (
  label text NOT NULL DEFAULT '',
  limit_key text NOT NULL PRIMARY KEY,
  limit_value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  user_id uuid NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  amount numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text,
  type text NOT NULL DEFAULT '',
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  last_movement_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  product_id uuid NOT NULL,
  product_name text NOT NULL DEFAULT '',
  qty_available integer,
  qty_on_hand integer NOT NULL DEFAULT 0,
  qty_reserved integer NOT NULL DEFAULT 0,
  sku text NOT NULL DEFAULT '',
  source_order_id uuid,
  storage_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  environment text NOT NULL DEFAULT '',
  event_id text NOT NULL,
  event_type text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider text NOT NULL DEFAULT '',
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL DEFAULT '',
  direction text NOT NULL,
  error text,
  from_number text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status text NOT NULL DEFAULT '',
  ticket_id uuid,
  to_number text NOT NULL DEFAULT '',
  user_id uuid,
  wa_msg_id text
);
