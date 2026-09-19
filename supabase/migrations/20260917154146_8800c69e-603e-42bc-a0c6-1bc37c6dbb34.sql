ALTER TYPE public.team_member_role ADD VALUE IF NOT EXISTS 'buyer';

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin')
      OR EXISTS (SELECT 1 FROM public.staff_permissions sp WHERE sp.user_id=_user_id AND _module = ANY(sp.modules))
$$;

CREATE OR REPLACE FUNCTION public.get_team_owner(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT tm.owner_id FROM public.team_members tm
      WHERE tm.member_user_id = _user_id AND tm.status = 'accepted' LIMIT 1),
    _user_id)
$$;

CREATE OR REPLACE FUNCTION public.team_can_buy(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.team_members tm
     WHERE tm.member_user_id = _user_id AND tm.status='accepted' AND tm.member_role='viewer')
$$;

CREATE OR REPLACE VIEW public.product_category_counts AS
  SELECT top_category, sub_category, detailed_category, count(*)::numeric AS cnt
    FROM public.products GROUP BY 1,2,3;

CREATE OR REPLACE VIEW public.product_rating_stats AS
  SELECT product_id, avg(rating)::numeric AS avg_rating, count(*)::numeric AS review_count
    FROM public.product_reviews GROUP BY product_id;

CREATE OR REPLACE VIEW public.product_view_counts AS
  SELECT product_id,
         count(*)::numeric AS total_views,
         count(*) FILTER (WHERE created_at > now() - interval '7 days')::numeric AS views_7d,
         count(*) FILTER (WHERE created_at > now() - interval '30 days')::numeric AS views_30d,
         count(*) FILTER (WHERE created_at > now() - interval '90 days')::numeric AS views_90d
    FROM public.product_view_events GROUP BY product_id;

DO $$
DECLARE
  t text;
  public_read text[] := ARRAY['products','platforms','platform_settings','contact_details','homepage_sections','homepage_hero_settings','promo_codes','product_reviews','product_category_counts_cache','suppliers','category_counts_meta','usage_limit_defaults','email_template_settings','product_alert_settings','sunsky_categories','sunsky_settings'];
  owned text[] := ARRAY['catalog_usage_log','customer_usage_limits','favourites','image_download_log','invoices','labelling_requests','notification_preferences','notifications','order_templates','orders','profiles','quote_requests','referrals','release_requests','return_requests','shipping_addresses','sourcing_requests','store_integrations','tickets','wallet_transactions','warehouse_inventory','signup_reminder_log','user_roles','staff_permissions'];
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()))', t||'_admin_all', t);

    IF t = ANY(public_read) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t||'_public_read', t);
    END IF;

    IF t = ANY(owned) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())', t||'_own_select', t);
      IF t <> 'user_roles' AND t <> 'staff_permissions' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', t||'_own_insert', t);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t||'_own_update', t);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid())', t||'_own_delete', t);
      END IF;
    END IF;
  END LOOP;
END $$;

GRANT SELECT ON public.product_category_counts, public.product_rating_stats, public.product_view_counts TO anon, authenticated;

CREATE POLICY contact_messages_anon_insert ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.contact_messages TO anon;
CREATE POLICY page_view_events_anon_insert ON public.page_view_events FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.page_view_events TO anon;
CREATE POLICY site_events_anon_insert ON public.site_events FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.site_events TO anon;
CREATE POLICY product_view_events_anon_insert ON public.product_view_events FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.product_view_events TO anon;
CREATE POLICY shop_orders_guest_insert ON public.shop_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT, SELECT ON public.shop_orders TO anon;
CREATE POLICY shop_orders_own_select ON public.shop_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY product_reviews_own_write ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY order_messages_own ON public.order_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ticket_messages_own ON public.ticket_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY request_messages_own ON public.request_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY team_members_owner ON public.team_members FOR ALL TO authenticated USING (owner_id = auth.uid() OR member_user_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY referral_events_insert ON public.referral_events FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.referral_events TO anon;
