CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric,
  annual_price numeric,
  currency text NOT NULL DEFAULT 'SAR',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  cta text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_id text,
  stripe_annual_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_plans TO authenticated;
GRANT ALL ON public.pricing_plans TO service_role;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by everyone" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Staff manage plans" ON public.pricing_plans FOR ALL TO authenticated
  USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER prevent_delete_plan_in_use BEFORE DELETE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_plan_in_use();

CREATE TABLE public.customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.customer_subscriptions TO authenticated;
GRANT ALL ON public.customer_subscriptions TO service_role;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.customer_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff manage subscriptions" ON public.customer_subscriptions FOR ALL TO authenticated
  USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  product_id text,
  price_id text,
  status text NOT NULL DEFAULT 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'test',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own billing" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff manage billing" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pricing_plans (id, name, description, price, annual_price, sort_order, is_popular, cta, features) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Starter', 'Perfect for testing the waters', 0, 0, 1, false, 'Get Started',
   '["Browse full catalog","Dropship up to 50 orders/mo","Basic labelling service","Standard delivery","Email support"]'::jsonb),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Growth', 'For growing Amazon & Noon sellers', 299, 2990, 2, true, 'Start Growing',
   '["Everything in Starter","Unlimited dropship orders","Priority labelling queue","Bulk order discounts (5%)","Express delivery option","Dedicated account manager","Wallet with credit terms"]'::jsonb),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Enterprise', 'For high-volume sellers', NULL, NULL, 3, false, 'Contact Sales',
   '["Everything in Growth","Custom sourcing requests","Bulk discounts up to 15%","White-label packaging","API access","Priority support 24/7","Custom payment terms"]'::jsonb);