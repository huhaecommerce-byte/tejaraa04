CREATE TABLE public.product_alert_settings (
  id boolean NOT NULL DEFAULT true PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'weekly',
  send_hour integer NOT NULL DEFAULT 9,
  day_of_week integer NOT NULL DEFAULT 0,
  window_days integer NOT NULL DEFAULT 7,
  max_products integer NOT NULL DEFAULT 6,
  last_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_alert_settings_singleton CHECK (id),
  CONSTRAINT product_alert_settings_frequency_chk CHECK (frequency IN ('off','daily','weekly')),
  CONSTRAINT product_alert_settings_hour_chk CHECK (send_hour BETWEEN 0 AND 23),
  CONSTRAINT product_alert_settings_dow_chk CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT product_alert_settings_window_chk CHECK (window_days BETWEEN 1 AND 90),
  CONSTRAINT product_alert_settings_max_chk CHECK (max_products BETWEEN 1 AND 24)
);

GRANT SELECT, INSERT, UPDATE ON public.product_alert_settings TO authenticated;
GRANT ALL ON public.product_alert_settings TO service_role;
ALTER TABLE public.product_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view product alert settings"
  ON public.product_alert_settings FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can insert product alert settings"
  ON public.product_alert_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product alert settings"
  ON public.product_alert_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_product_alert_settings_updated_at
  BEFORE UPDATE ON public.product_alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.product_alert_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.product_alert_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_key text NOT NULL UNIQUE,
  frequency text NOT NULL,
  recipients integer NOT NULL DEFAULT 0,
  queued integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  new_products integer NOT NULL DEFAULT 0,
  triggered_by text NOT NULL DEFAULT 'cron',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_alert_runs TO authenticated;
GRANT ALL ON public.product_alert_runs TO service_role;
ALTER TABLE public.product_alert_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view product alert runs"
  ON public.product_alert_runs FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

CREATE TRIGGER update_product_alert_runs_updated_at
  BEFORE UPDATE ON public.product_alert_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_product_alert_runs_created_at ON public.product_alert_runs (created_at DESC);