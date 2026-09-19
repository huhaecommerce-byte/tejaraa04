CREATE TABLE IF NOT EXISTS public.usage_limit_defaults (
  limit_key text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  limit_value text NOT NULL DEFAULT 'unlimited',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.usage_limit_defaults TO authenticated;
GRANT ALL ON public.usage_limit_defaults TO service_role;
ALTER TABLE public.usage_limit_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can read defaults" ON public.usage_limit_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage defaults" ON public.usage_limit_defaults FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.customer_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  limit_key text NOT NULL,
  limit_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, limit_key)
);
GRANT SELECT ON public.customer_usage_limits TO authenticated;
GRANT ALL ON public.customer_usage_limits TO service_role;
ALTER TABLE public.customer_usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own overrides" ON public.customer_usage_limits FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage overrides" ON public.customer_usage_limits FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.usage_limit_defaults (limit_key, label) VALUES
  ('dropshipping_orders','Dropship orders / month'),
  ('bulk_orders_monthly','Bulk orders / month'),
  ('total_units_monthly','Total units ordered / month'),
  ('quote_requests_monthly','Quote requests / month'),
  ('sourcing_requests_monthly','Sourcing requests / month'),
  ('labelling_units_monthly','Labelling units / month'),
  ('release_requests_monthly','Release requests / month'),
  ('favourites_max','Favourites (total)'),
  ('addresses_max','Shipping addresses (total)'),
  ('store_integrations_max','Connected stores (total)'),
  ('team_seats','Team members (total)'),
  ('templates_max','Order templates (total)')
ON CONFLICT (limit_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_user_plan_limit(_user_id uuid, _limit_key text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw text;
  num numeric;
BEGIN
  SELECT limit_value INTO raw FROM public.customer_usage_limits
    WHERE user_id = _user_id AND limit_key = _limit_key LIMIT 1;

  IF raw IS NULL THEN
    SELECT limit_value INTO raw FROM public.usage_limit_defaults
      WHERE limit_key = _limit_key LIMIT 1;
  END IF;

  IF raw IS NULL THEN RETURN -1; END IF;
  raw := btrim(raw);
  IF raw = '' OR raw ILIKE 'unlimited' OR raw = '∞' OR raw ILIKE 'true' OR raw ILIKE 'yes' THEN RETURN -1; END IF;
  IF raw ILIKE 'false' OR raw ILIKE 'no' THEN RETURN 0; END IF;
  raw := regexp_replace(raw, '[^0-9\.\-]', '', 'g');
  IF raw = '' THEN RETURN -1; END IF;
  BEGIN num := raw::numeric; EXCEPTION WHEN OTHERS THEN RETURN -1; END;
  RETURN num;
END;
$$;