-- =========================================================
-- Agency / VA partner program
-- =========================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency';

-- ---------- settings defaults ----------
INSERT INTO public.platform_settings (key, value) VALUES
  ('agency_commission_percent', '10'),
  ('agency_min_payout_sar', '200'),
  ('agency_approval_days', '14')
ON CONFLICT (key) DO NOTHING;

-- ---------- email templates ----------
INSERT INTO public.email_template_settings (template_name, label, enabled) VALUES
  ('agency-approved', 'Agency application approved', true),
  ('agency-rejected', 'Agency application rejected', true),
  ('agency-new-client', 'Agency: new dropshipper onboarded', true),
  ('agency-payout-update', 'Agency payout update', true)
ON CONFLICT (template_name) DO NOTHING;

-- =========================================================
-- Tables
-- =========================================================

CREATE TABLE public.agency_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  website text,
  audience text,
  status text NOT NULL DEFAULT 'pending',
  invite_code text NOT NULL UNIQUE,
  commission_rate numeric,
  payout_method text,
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agency_profiles_status_chk CHECK (status IN ('pending','approved','rejected','suspended')),
  CONSTRAINT agency_profiles_rate_chk CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100))
);
GRANT SELECT, INSERT, UPDATE ON public.agency_profiles TO authenticated;
GRANT ALL ON public.agency_profiles TO service_role;
ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agency_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'link',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agency_clients_agency_idx ON public.agency_clients(agency_id);
GRANT SELECT ON public.agency_clients TO authenticated;
GRANT ALL ON public.agency_clients TO service_role;
ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agency_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  amount_sar numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  method text,
  note text,
  admin_note text,
  reference text,
  decided_at timestamptz,
  decided_by uuid,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agency_payout_status_chk CHECK (status IN ('pending','approved','paid','declined')),
  CONSTRAINT agency_payout_amount_chk CHECK (amount_sar > 0)
);
CREATE INDEX agency_payout_requests_agency_idx ON public.agency_payout_requests(agency_id);
GRANT SELECT ON public.agency_payout_requests TO authenticated;
GRANT ALL ON public.agency_payout_requests TO service_role;
ALTER TABLE public.agency_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agency_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL,
  order_id uuid NOT NULL UNIQUE,
  order_ref text,
  order_total_sar numeric NOT NULL DEFAULT 0,
  profit_base_sar numeric NOT NULL DEFAULT 0,
  rate_percent numeric NOT NULL DEFAULT 0,
  amount_sar numeric NOT NULL DEFAULT 0,
  usd_to_sar_rate numeric,
  status text NOT NULL DEFAULT 'pending',
  reversal_reason text,
  approved_at timestamptz,
  paid_at timestamptz,
  payout_request_id uuid REFERENCES public.agency_payout_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agency_commissions_status_chk CHECK (status IN ('pending','approved','paid','reversed'))
);
CREATE INDEX agency_commissions_agency_idx ON public.agency_commissions(agency_id, status);
CREATE INDEX agency_commissions_client_idx ON public.agency_commissions(client_user_id);
GRANT SELECT ON public.agency_commissions TO authenticated;
GRANT ALL ON public.agency_commissions TO service_role;
ALTER TABLE public.agency_commissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agency_payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id uuid NOT NULL REFERENCES public.agency_payout_requests(id) ON DELETE CASCADE,
  commission_id uuid REFERENCES public.agency_commissions(id) ON DELETE CASCADE,
  adjustment_id uuid,
  amount_sar numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agency_payout_items_req_idx ON public.agency_payout_items(payout_request_id);
GRANT SELECT ON public.agency_payout_items TO authenticated;
GRANT ALL ON public.agency_payout_items TO service_role;
ALTER TABLE public.agency_payout_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agency_ledger_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  amount_sar numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  payout_request_id uuid REFERENCES public.agency_payout_requests(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agency_adjustment_status_chk CHECK (status IN ('approved','paid','void'))
);
CREATE INDEX agency_ledger_adjustments_agency_idx ON public.agency_ledger_adjustments(agency_id);
GRANT SELECT ON public.agency_ledger_adjustments TO authenticated;
GRANT ALL ON public.agency_ledger_adjustments TO service_role;
ALTER TABLE public.agency_ledger_adjustments ENABLE ROW LEVEL SECURITY;

-- updated_at triggers
CREATE TRIGGER agency_profiles_updated BEFORE UPDATE ON public.agency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agency_clients_updated BEFORE UPDATE ON public.agency_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agency_commissions_updated BEFORE UPDATE ON public.agency_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agency_payout_requests_updated BEFORE UPDATE ON public.agency_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agency_ledger_adjustments_updated BEFORE UPDATE ON public.agency_ledger_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Helper functions
-- =========================================================

CREATE OR REPLACE FUNCTION public.gen_agency_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE c text;
BEGIN
  LOOP
    c := 'AG' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.agency_profiles WHERE invite_code = c);
  END LOOP;
  RETURN c;
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.agency_profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_approved_agency(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_profiles
    WHERE user_id = _user_id AND status = 'approved'
  );
$$;

-- =========================================================
-- RLS policies
-- =========================================================

CREATE POLICY "agency owns profile" ON public.agency_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "agency applies" ON public.agency_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "agency edits own profile" ON public.agency_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff manage agencies" ON public.agency_profiles
  FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "agency sees own clients" ON public.agency_clients
  FOR SELECT TO authenticated USING (agency_id = public.agency_id_for_user(auth.uid()));
CREATE POLICY "staff manage agency clients" ON public.agency_clients
  FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "agency sees own commissions" ON public.agency_commissions
  FOR SELECT TO authenticated USING (agency_id = public.agency_id_for_user(auth.uid()));
CREATE POLICY "staff manage agency commissions" ON public.agency_commissions
  FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "agency sees own payouts" ON public.agency_payout_requests
  FOR SELECT TO authenticated USING (agency_id = public.agency_id_for_user(auth.uid()));
CREATE POLICY "staff manage agency payouts" ON public.agency_payout_requests
  FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "agency sees own payout items" ON public.agency_payout_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.agency_payout_requests r
      WHERE r.id = payout_request_id AND r.agency_id = public.agency_id_for_user(auth.uid())
    )
  );
CREATE POLICY "staff manage agency payout items" ON public.agency_payout_items
  FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "agency sees own adjustments" ON public.agency_ledger_adjustments
  FOR SELECT TO authenticated USING (agency_id = public.agency_id_for_user(auth.uid()));
CREATE POLICY "staff manage agency adjustments" ON public.agency_ledger_adjustments
  FOR ALL TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- =========================================================
-- Guard: applicants cannot self-approve or set their rate
-- =========================================================

CREATE OR REPLACE FUNCTION public.protect_agency_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_staff_or_admin(auth.uid()) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.commission_rate := NULL;
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.invite_code := COALESCE(NULLIF(NEW.invite_code, ''), public.gen_agency_code());
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.commission_rate := OLD.commission_rate;
  NEW.invite_code := OLD.invite_code;
  NEW.approved_at := OLD.approved_at;
  NEW.approved_by := OLD.approved_by;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER agency_profiles_protect
  BEFORE INSERT OR UPDATE ON public.agency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_agency_admin_fields();

-- =========================================================
-- Attribution: link a dropshipper to an agency at signup
-- =========================================================

CREATE OR REPLACE FUNCTION public.apply_agency_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); a public.agency_profiles%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT * INTO a FROM public.agency_profiles WHERE upper(invite_code) = upper(trim(_code));
  IF a.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF a.status <> 'approved' THEN RETURN jsonb_build_object('ok', false, 'error', 'agency_inactive'); END IF;
  IF a.user_id = uid THEN RETURN jsonb_build_object('ok', false, 'error', 'self_referral'); END IF;
  IF EXISTS (SELECT 1 FROM public.agency_clients WHERE client_user_id = uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_linked');
  END IF;
  INSERT INTO public.agency_clients (agency_id, client_user_id) VALUES (a.id, uid);
  RETURN jsonb_build_object('ok', true, 'agency', a.company_name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_agency_code(text) FROM anon;

-- =========================================================
-- Profit + commission engine
-- =========================================================

CREATE OR REPLACE FUNCTION public.agency_order_profit(_items jsonb, _rate numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    (COALESCE((item->>'unit_price_sar')::numeric, 0)
      - COALESCE(p.cost_usd, 0) * _rate)
    * GREATEST(COALESCE((item->>'qty')::numeric, 1), 0)
  ), 0)
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(_items) = 'array' THEN _items ELSE '[]'::jsonb END) AS item
  LEFT JOIN public.products p
    ON p.id = NULLIF(item->>'product_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.trg_shop_orders_agency_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client public.agency_clients%ROWTYPE;
  v_agency public.agency_profiles%ROWTYPE;
  v_rate numeric;
  v_fx numeric;
  v_profit numeric;
  v_amount numeric;
  v_pay text := lower(COALESCE(NEW.payment_status, ''));
  v_status text := lower(COALESCE(NEW.status, ''));
  v_first boolean;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_client FROM public.agency_clients WHERE client_user_id = NEW.user_id;
  IF v_client.id IS NULL THEN RETURN NEW; END IF;

  -- Reversal on cancel / refund / return
  IF v_pay IN ('refunded', 'reversed') OR v_status IN ('cancelled', 'canceled', 'refunded', 'returned') THEN
    UPDATE public.agency_commissions
       SET status = 'reversed',
           reversal_reason = COALESCE(NULLIF(v_status, ''), v_pay)
     WHERE order_id = NEW.id AND status <> 'paid';
    RETURN NEW;
  END IF;

  IF v_pay NOT IN ('paid', 'completed', 'succeeded') THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.agency_commissions WHERE order_id = NEW.id) THEN RETURN NEW; END IF;

  SELECT * INTO v_agency FROM public.agency_profiles WHERE id = v_client.agency_id;
  IF v_agency.id IS NULL OR v_agency.status <> 'approved' THEN RETURN NEW; END IF;

  v_fx := COALESCE(public.pricing_setting('usd_to_sar_rate', 0), public.pricing_setting('usd_to_sar', 3.75), 3.75);
  IF v_fx <= 0 THEN v_fx := 3.75; END IF;

  v_rate := COALESCE(v_agency.commission_rate, public.pricing_setting('agency_commission_percent', 10));
  v_profit := GREATEST(public.agency_order_profit(NEW.items, v_fx), 0);
  v_amount := round(v_profit * v_rate / 100.0, 2);

  v_first := NOT EXISTS (
    SELECT 1 FROM public.agency_commissions
    WHERE agency_id = v_agency.id AND client_user_id = NEW.user_id
  );

  INSERT INTO public.agency_commissions (
    agency_id, client_user_id, order_id, order_ref, order_total_sar,
    profit_base_sar, rate_percent, amount_sar, usd_to_sar_rate, status
  ) VALUES (
    v_agency.id, NEW.user_id, NEW.id, NEW.order_ref, COALESCE(NEW.total_sar, 0),
    v_profit, v_rate, v_amount, v_fx, 'pending'
  ) ON CONFLICT (order_id) DO NOTHING;

  IF v_first AND v_amount > 0 THEN
    PERFORM public.queue_email(
      'agency-new-client',
      v_agency.user_id,
      jsonb_build_object(
        'agencyName', v_agency.contact_name,
        'orderRef', NEW.order_ref,
        'amount', v_amount
      ),
      'agency-new-client:' || v_agency.id || ':' || NEW.user_id,
      v_agency.email
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER shop_orders_agency_commission
  AFTER INSERT OR UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_shop_orders_agency_commission();

-- Unlock commissions once the order has been delivered long enough
CREATE OR REPLACE FUNCTION public.agency_approve_due_commissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_days integer; v_count integer;
BEGIN
  v_days := GREATEST(COALESCE(public.pricing_setting('agency_approval_days', 14), 14)::integer, 0);
  UPDATE public.agency_commissions c
     SET status = 'approved', approved_at = now()
    FROM public.shop_orders o
   WHERE o.id = c.order_id
     AND c.status = 'pending'
     AND lower(COALESCE(o.status, '')) = 'delivered'
     AND o.updated_at < now() - make_interval(days => v_days);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =========================================================
-- Balances, dashboards, payouts
-- =========================================================

CREATE OR REPLACE FUNCTION public.agency_balance(_agency_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'lifetime', COALESCE((SELECT SUM(amount_sar) FROM public.agency_commissions WHERE agency_id = _agency_id AND status IN ('approved','paid')), 0)
                + COALESCE((SELECT SUM(amount_sar) FROM public.agency_ledger_adjustments WHERE agency_id = _agency_id AND status <> 'void'), 0),
    'pending', COALESCE((SELECT SUM(amount_sar) FROM public.agency_commissions WHERE agency_id = _agency_id AND status = 'pending'), 0),
    'available', GREATEST(
      COALESCE((SELECT SUM(amount_sar) FROM public.agency_commissions WHERE agency_id = _agency_id AND status = 'approved' AND payout_request_id IS NULL), 0)
      + COALESCE((SELECT SUM(amount_sar) FROM public.agency_ledger_adjustments WHERE agency_id = _agency_id AND status = 'approved' AND payout_request_id IS NULL), 0), 0),
    'requested', COALESCE((SELECT SUM(amount_sar) FROM public.agency_payout_requests WHERE agency_id = _agency_id AND status IN ('pending','approved')), 0),
    'paid', COALESCE((SELECT SUM(amount_sar) FROM public.agency_payout_requests WHERE agency_id = _agency_id AND status = 'paid'), 0),
    'clients', COALESCE((SELECT COUNT(*) FROM public.agency_clients WHERE agency_id = _agency_id), 0),
    'orders', COALESCE((SELECT COUNT(*) FROM public.agency_commissions WHERE agency_id = _agency_id AND status <> 'reversed'), 0),
    'this_month', COALESCE((SELECT SUM(amount_sar) FROM public.agency_commissions WHERE agency_id = _agency_id AND status <> 'reversed' AND created_at >= date_trunc('month', now())), 0)
  );
$$;

CREATE OR REPLACE FUNCTION public.agency_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE a public.agency_profiles%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.agency_profiles WHERE user_id = auth.uid();
  IF a.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_an_agency'); END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'status', a.status,
    'code', a.invite_code,
    'company', a.company_name,
    'rate', COALESCE(a.commission_rate, public.pricing_setting('agency_commission_percent', 10)),
    'min_payout', public.pricing_setting('agency_min_payout_sar', 200),
    'balance', public.agency_balance(a.id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_list_clients()
RETURNS TABLE(
  client_user_id uuid,
  display_name text,
  email_masked text,
  joined_at timestamptz,
  orders bigint,
  earned numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ac.client_user_id,
         COALESCE(p.display_name, 'Dropshipper'),
         CASE WHEN p.email IS NULL OR position('@' in p.email) < 2 THEN NULL
              ELSE left(p.email, 2) || '***@' || split_part(p.email, '@', 2) END,
         ac.joined_at,
         COALESCE(COUNT(c.id) FILTER (WHERE c.status <> 'reversed'), 0),
         COALESCE(SUM(c.amount_sar) FILTER (WHERE c.status <> 'reversed'), 0)
  FROM public.agency_clients ac
  LEFT JOIN public.profiles p ON p.user_id = ac.client_user_id
  LEFT JOIN public.agency_commissions c ON c.client_user_id = ac.client_user_id AND c.agency_id = ac.agency_id
  WHERE ac.agency_id = public.agency_id_for_user(auth.uid())
  GROUP BY ac.client_user_id, p.display_name, p.email, ac.joined_at
  ORDER BY ac.joined_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.agency_request_payout(_amount numeric, _note text DEFAULT NULL, _method text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.agency_profiles%ROWTYPE;
  v_avail numeric;
  v_min numeric;
  v_req uuid;
  v_running numeric := 0;
  r record;
BEGIN
  SELECT * INTO a FROM public.agency_profiles WHERE user_id = auth.uid();
  IF a.id IS NULL OR a.status <> 'approved' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_an_agency'); END IF;

  v_min := COALESCE(public.pricing_setting('agency_min_payout_sar', 200), 200);
  v_avail := COALESCE((public.agency_balance(a.id)->>'available')::numeric, 0);

  IF _amount IS NULL OR _amount <= 0 THEN _amount := v_avail; END IF;
  IF _amount < v_min THEN RETURN jsonb_build_object('ok', false, 'error', 'below_minimum', 'minimum', v_min); END IF;
  IF _amount > v_avail THEN RETURN jsonb_build_object('ok', false, 'error', 'insufficient_balance', 'available', v_avail); END IF;

  INSERT INTO public.agency_payout_requests (agency_id, amount_sar, method, note, status)
  VALUES (a.id, 0, COALESCE(_method, a.payout_method), _note, 'pending')
  RETURNING id INTO v_req;

  FOR r IN
    SELECT id, amount_sar FROM public.agency_commissions
     WHERE agency_id = a.id AND status = 'approved' AND payout_request_id IS NULL
     ORDER BY created_at
  LOOP
    EXIT WHEN v_running + r.amount_sar > _amount;
    UPDATE public.agency_commissions SET payout_request_id = v_req WHERE id = r.id;
    INSERT INTO public.agency_payout_items (payout_request_id, commission_id, amount_sar)
    VALUES (v_req, r.id, r.amount_sar);
    v_running := v_running + r.amount_sar;
  END LOOP;

  FOR r IN
    SELECT id, amount_sar FROM public.agency_ledger_adjustments
     WHERE agency_id = a.id AND status = 'approved' AND payout_request_id IS NULL
     ORDER BY created_at
  LOOP
    EXIT WHEN v_running + r.amount_sar > _amount;
    UPDATE public.agency_ledger_adjustments SET payout_request_id = v_req WHERE id = r.id;
    INSERT INTO public.agency_payout_items (payout_request_id, adjustment_id, amount_sar)
    VALUES (v_req, r.id, r.amount_sar);
    v_running := v_running + r.amount_sar;
  END LOOP;

  IF v_running <= 0 THEN
    DELETE FROM public.agency_payout_requests WHERE id = v_req;
    RETURN jsonb_build_object('ok', false, 'error', 'nothing_to_pay');
  END IF;

  UPDATE public.agency_payout_requests SET amount_sar = v_running WHERE id = v_req;
  PERFORM public.notify_admins(
    'Agency payout requested',
    a.company_name || ' requested SAR ' || v_running,
    '/admin/agency-payouts', 'agency', jsonb_build_object('agency_id', a.id)
  );
  RETURN jsonb_build_object('ok', true, 'id', v_req, 'amount', v_running);
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_admin_decide_payout(_id uuid, _action text, _reference text DEFAULT NULL, _admin_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.agency_payout_requests%ROWTYPE; a public.agency_profiles%ROWTYPE;
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  SELECT * INTO r FROM public.agency_payout_requests WHERE id = _id;
  IF r.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  SELECT * INTO a FROM public.agency_profiles WHERE id = r.agency_id;

  IF _action = 'approve' THEN
    UPDATE public.agency_payout_requests
       SET status = 'approved', decided_at = now(), decided_by = auth.uid(), admin_note = COALESCE(_admin_note, admin_note)
     WHERE id = _id;
  ELSIF _action = 'paid' THEN
    UPDATE public.agency_payout_requests
       SET status = 'paid', paid_at = now(), decided_at = COALESCE(decided_at, now()), decided_by = auth.uid(),
           reference = COALESCE(_reference, reference), admin_note = COALESCE(_admin_note, admin_note)
     WHERE id = _id;
    UPDATE public.agency_commissions SET status = 'paid', paid_at = now() WHERE payout_request_id = _id;
    UPDATE public.agency_ledger_adjustments SET status = 'paid' WHERE payout_request_id = _id;
  ELSIF _action = 'decline' THEN
    UPDATE public.agency_commissions SET payout_request_id = NULL WHERE payout_request_id = _id;
    UPDATE public.agency_ledger_adjustments SET payout_request_id = NULL WHERE payout_request_id = _id;
    DELETE FROM public.agency_payout_items WHERE payout_request_id = _id;
    UPDATE public.agency_payout_requests
       SET status = 'declined', decided_at = now(), decided_by = auth.uid(), admin_note = COALESCE(_admin_note, admin_note)
     WHERE id = _id;
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'bad_action');
  END IF;

  PERFORM public.queue_email(
    'agency-payout-update',
    a.user_id,
    jsonb_build_object('agencyName', a.contact_name, 'amount', r.amount_sar, 'status', _action, 'reference', _reference),
    'agency-payout:' || _id || ':' || _action,
    a.email
  );
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_admin_set_status(_agency_id uuid, _status text, _reason text DEFAULT NULL, _rate numeric DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE a public.agency_profiles%ROWTYPE;
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF _status NOT IN ('pending','approved','rejected','suspended') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_status');
  END IF;

  UPDATE public.agency_profiles
     SET status = _status,
         rejection_reason = CASE WHEN _status = 'rejected' THEN _reason ELSE rejection_reason END,
         commission_rate = COALESCE(_rate, commission_rate),
         approved_at = CASE WHEN _status = 'approved' THEN COALESCE(approved_at, now()) ELSE approved_at END,
         approved_by = CASE WHEN _status = 'approved' THEN auth.uid() ELSE approved_by END
   WHERE id = _agency_id
   RETURNING * INTO a;

  IF a.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  IF _status = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (a.user_id, 'agency')
    ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM public.queue_email('agency-approved', a.user_id,
      jsonb_build_object('agencyName', a.contact_name, 'code', a.invite_code,
                         'rate', COALESCE(a.commission_rate, public.pricing_setting('agency_commission_percent', 10))),
      'agency-approved:' || a.id, a.email);
  ELSIF _status = 'rejected' THEN
    PERFORM public.queue_email('agency-rejected', a.user_id,
      jsonb_build_object('agencyName', a.contact_name, 'reason', _reason),
      'agency-rejected:' || a.id || ':' || to_char(now(), 'YYYYMMDDHH24MI'), a.email);
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', a.status);
END;
$$;

CREATE OR REPLACE FUNCTION public.agency_admin_adjust(_agency_id uuid, _amount numeric, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF _amount IS NULL OR _amount = 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_amount'); END IF;
  INSERT INTO public.agency_ledger_adjustments (agency_id, amount_sar, reason, created_by)
  VALUES (_agency_id, _amount, COALESCE(_reason, 'Manual adjustment'), auth.uid());
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_agencies(_status text DEFAULT NULL, _search text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  company_name text,
  contact_name text,
  email text,
  phone text,
  country text,
  status text,
  invite_code text,
  commission_rate numeric,
  created_at timestamptz,
  clients bigint,
  lifetime numeric,
  pending numeric,
  available numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.user_id, a.company_name, a.contact_name, a.email, a.phone, a.country,
         a.status, a.invite_code, a.commission_rate, a.created_at,
         COALESCE((SELECT COUNT(*) FROM public.agency_clients ac WHERE ac.agency_id = a.id), 0),
         COALESCE((public.agency_balance(a.id)->>'lifetime')::numeric, 0),
         COALESCE((public.agency_balance(a.id)->>'pending')::numeric, 0),
         COALESCE((public.agency_balance(a.id)->>'available')::numeric, 0)
  FROM public.agency_profiles a
  WHERE public.is_staff_or_admin(auth.uid())
    AND (_status IS NULL OR _status = '' OR a.status = _status)
    AND (_search IS NULL OR _search = '' OR a.company_name ILIKE '%' || _search || '%'
         OR a.contact_name ILIKE '%' || _search || '%' OR a.email ILIKE '%' || _search || '%'
         OR a.invite_code ILIKE '%' || _search || '%')
  ORDER BY a.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_agency_clients(_agency_id uuid)
RETURNS TABLE(
  client_user_id uuid,
  display_name text,
  email text,
  joined_at timestamptz,
  orders bigint,
  earned numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ac.client_user_id, COALESCE(p.display_name, 'Dropshipper'), p.email, ac.joined_at,
         COALESCE(COUNT(c.id) FILTER (WHERE c.status <> 'reversed'), 0),
         COALESCE(SUM(c.amount_sar) FILTER (WHERE c.status <> 'reversed'), 0)
  FROM public.agency_clients ac
  LEFT JOIN public.profiles p ON p.user_id = ac.client_user_id
  LEFT JOIN public.agency_commissions c ON c.client_user_id = ac.client_user_id AND c.agency_id = ac.agency_id
  WHERE ac.agency_id = _agency_id AND public.is_staff_or_admin(auth.uid())
  GROUP BY ac.client_user_id, p.display_name, p.email, ac.joined_at
  ORDER BY ac.joined_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.agency_admin_set_status(uuid, text, text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.agency_admin_decide_payout(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.agency_admin_adjust(uuid, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_agencies(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_agency_clients(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.agency_request_payout(numeric, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.agency_dashboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.agency_list_clients() FROM anon;
REVOKE EXECUTE ON FUNCTION public.agency_approve_due_commissions() FROM anon;