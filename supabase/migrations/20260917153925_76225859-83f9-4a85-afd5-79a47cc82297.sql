CREATE TYPE public.app_role AS ENUM ('admin','moderator','user','staff');
CREATE TYPE public.team_member_role AS ENUM ('owner','admin','member','viewer');
CREATE TYPE public.team_invite_status AS ENUM ('pending','accepted','revoked');

CREATE TABLE IF NOT EXISTS public.audit_log (
  action text NOT NULL,
  actor_email text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  entity_id uuid,
  entity_type text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.catalog_usage_log (
  action text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.category_counts_meta (
  dirty boolean NOT NULL DEFAULT false,
  id boolean NOT NULL DEFAULT true PRIMARY KEY,
  last_refresh timestamptz
);

CREATE TABLE IF NOT EXISTS public.contact_details (
  color text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  icon text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  region text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_notes (
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tags (
  color text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_usage_limits (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  limit_key text NOT NULL,
  limit_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  UNIQUE (user_id, limit_key)
);

CREATE TABLE IF NOT EXISTS public.email_outbox (
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  dedupe_key text,
  error text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient_email text NOT NULL,
  recipient_user_id uuid,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  subject_override text,
  template_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_send_log (
  created_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id text,
  metadata jsonb,
  recipient_email text NOT NULL,
  status text NOT NULL,
  template_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.email_send_state (
  auth_email_ttl_minutes integer NOT NULL DEFAULT 0,
  batch_size numeric NOT NULL DEFAULT 0,
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  retry_after_until text,
  send_delay_ms integer NOT NULL DEFAULT 0,
  transactional_email_ttl_minutes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_template_settings (
  enabled boolean NOT NULL DEFAULT false,
  label text NOT NULL DEFAULT '',
  template_name text NOT NULL PRIMARY KEY,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  used_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.favourites (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.homepage_hero_settings (
  category_filter text[] NOT NULL DEFAULT '{}'::text[],
  category_filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_desktop boolean NOT NULL DEFAULT false,
  enabled_mobile boolean NOT NULL DEFAULT false,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manual_product_ids text[] NOT NULL DEFAULT '{}'::text[],
  min_stock integer NOT NULL DEFAULT 0,
  order_by text NOT NULL DEFAULT '',
  pause_on_hover boolean NOT NULL DEFAULT false,
  product_count integer NOT NULL DEFAULT 0,
  product_source text NOT NULL DEFAULT '',
  rotation_interval_ms integer NOT NULL DEFAULT 0,
  show_arrows boolean NOT NULL DEFAULT false,
  show_dots boolean NOT NULL DEFAULT false,
  show_out_of_stock boolean NOT NULL DEFAULT false,
  time_window text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT false,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.image_download_log (
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id uuid NOT NULL,
  notes text,
  product_id uuid NOT NULL,
  qty_after integer NOT NULL,
  qty_change integer NOT NULL,
  reference_order_id uuid,
  release_request_id uuid,
  type text NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  amount numeric NOT NULL DEFAULT 0,
  buyer_address text NOT NULL DEFAULT '',
  buyer_name text NOT NULL DEFAULT '',
  buyer_vat_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  currency text NOT NULL DEFAULT 'SAR',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL DEFAULT '',
  invoice_type text NOT NULL DEFAULT '',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_id uuid,
  payment_method text NOT NULL DEFAULT '',
  pdf_url text,
  period_end text,
  period_start text,
  qr_code text NOT NULL DEFAULT '',
  seller_address text NOT NULL DEFAULT '',
  seller_cr_number text NOT NULL DEFAULT '',
  seller_name text NOT NULL DEFAULT '',
  seller_vat_number text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  store_id uuid,
  subtotal numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  vat_amount numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.label_templates (
  canvas_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  thumbnail_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.labelling_requests (
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  items_count integer NOT NULL DEFAULT 0,
  label_data jsonb,
  notes text,
  order_id uuid,
  status text NOT NULL DEFAULT 'pending',
  template_id uuid,
  type text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  created_at timestamptz NOT NULL DEFAULT now(),
  email_orders boolean NOT NULL DEFAULT true,
  email_quotes boolean NOT NULL DEFAULT true,
  email_sourcing boolean NOT NULL DEFAULT true,
  email_tickets boolean NOT NULL DEFAULT true,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  in_app_broadcasts boolean NOT NULL DEFAULT true,
  in_app_orders boolean NOT NULL DEFAULT true,
  in_app_quotes boolean NOT NULL DEFAULT true,
  in_app_sourcing boolean NOT NULL DEFAULT true,
  in_app_tickets boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.notifications (
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  title text NOT NULL,
  type text NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_messages (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_admin boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  order_id uuid NOT NULL,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_templates (
  created_at timestamptz NOT NULL DEFAULT now(),
  destination text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  last_run_at timestamptz,
  name text NOT NULL,
  next_run_at timestamptz,
  notes text,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule_active boolean NOT NULL DEFAULT false,
  schedule_frequency text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  tracking_number text,
  type text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.page_view_events (
  browser text NOT NULL DEFAULT '',
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  device_type text NOT NULL DEFAULT '',
  duration_ms integer,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_landing boolean NOT NULL DEFAULT false,
  language text,
  os text NOT NULL DEFAULT '',
  path text NOT NULL,
  referral_code text,
  referrer text NOT NULL DEFAULT '',
  screen_h numeric,
  screen_w numeric,
  session_id text NOT NULL,
  timezone text,
  title text NOT NULL DEFAULT '',
  user_id uuid,
  utm_campaign text,
  utm_medium text,
  utm_source text,
  visitor_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_events (
  amount_sar numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  currency text,
  environment text NOT NULL DEFAULT '',
  error_message text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_intent_id text,
  plan_id text,
  provider text NOT NULL DEFAULT '',
  session_id text,
  status text NOT NULL,
  subscription_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  value text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.platforms (
  bg_classes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  icon_url text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_activity_daily (
  activity_date date NOT NULL,
  creator_email text NOT NULL DEFAULT '',
  creator_source text NOT NULL DEFAULT '',
  product_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (activity_date, creator_email, creator_source)
);

CREATE TABLE IF NOT EXISTS public.product_alert_runs (
  created_at timestamptz NOT NULL DEFAULT now(),
  failed integer NOT NULL DEFAULT 0,
  frequency text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  new_products numeric NOT NULL DEFAULT 0,
  period_key text NOT NULL,
  queued numeric NOT NULL DEFAULT 0,
  recipients numeric NOT NULL DEFAULT 0,
  sent numeric NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  triggered_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_alert_settings (
  day_of_week numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'weekly',
  id boolean NOT NULL DEFAULT true PRIMARY KEY,
  last_run_at timestamptz,
  max_products numeric NOT NULL DEFAULT 0,
  send_hour numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  window_days integer NOT NULL DEFAULT 7
);

CREATE TABLE IF NOT EXISTS public.product_category_counts_cache (
  cnt numeric NOT NULL DEFAULT 0,
  detailed_category text NOT NULL DEFAULT '',
  sub_category text NOT NULL DEFAULT '',
  top_category text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (top_category, sub_category, detailed_category)
);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid,
  product_id uuid NOT NULL,
  rating numeric NOT NULL,
  title text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_view_events (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  session_id text,
  user_id uuid
);
