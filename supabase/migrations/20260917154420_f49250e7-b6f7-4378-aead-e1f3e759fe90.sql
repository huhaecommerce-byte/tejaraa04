ALTER VIEW public.product_category_counts SET (security_invoker = true);
ALTER VIEW public.product_rating_stats SET (security_invoker = true);
ALTER VIEW public.product_view_counts SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_txt,'')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
$$;

CREATE OR REPLACE FUNCTION public.pricing_setting(_key text, _default numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT NULLIF(value,'')::numeric FROM public.platform_settings WHERE key=_key), _default)
$$;

CREATE OR REPLACE FUNCTION public.weight_fee_in_price(_source text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT value = 'true' FROM public.platform_settings WHERE key = 'weight_fee_in_price_'||coalesce(_source,'')), false)
$$;

CREATE OR REPLACE FUNCTION public.wants_notification(_user_id uuid, _type text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.notification_preferences%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.notification_preferences WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN true; END IF;
  RETURN CASE _type
    WHEN 'order' THEN p.in_app_orders
    WHEN 'quote' THEN p.in_app_quotes
    WHEN 'sourcing' THEN p.in_app_sourcing
    WHEN 'ticket' THEN p.in_app_tickets
    WHEN 'broadcast' THEN p.in_app_broadcasts
    ELSE true END;
END $$;

CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _title text, _body text, _link text, _type text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.wants_notification(_user_id, _type) THEN
    INSERT INTO public.notifications(user_id,title,body,link,type,metadata)
    VALUES (_user_id,_title,_body,_link,_type,coalesce(_metadata,'{}'::jsonb));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admins(_title text, _body text, _link text, _type text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin','staff') LOOP
    PERFORM public.create_notification(r.user_id,_title,_body,_link,_type,_metadata);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_send_notification(_user_id uuid, _title text, _body text, _link text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  INSERT INTO public.notifications(user_id,title,body,link,type) VALUES (_user_id,_title,_body,_link,'admin');
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.broadcast_notification(_title text, _body text, _link text, _audience text DEFAULT 'all')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0;
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN 0; END IF;
  INSERT INTO public.notifications(user_id,title,body,link,type)
  SELECT p.user_id,_title,_body,_link,'broadcast' FROM public.profiles p;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.wallet_get_balance()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT balance_after FROM public.wallet_transactions
    WHERE user_id = public.get_team_owner(auth.uid()) ORDER BY created_at DESC LIMIT 1), 0)
$$;

CREATE OR REPLACE FUNCTION public.wallet_apply(_user_id uuid, _amount numeric, _type text, _description text, _stripe_session_id text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bal numeric;
BEGIN
  SELECT COALESCE((SELECT balance_after FROM public.wallet_transactions WHERE user_id=_user_id ORDER BY created_at DESC LIMIT 1),0) INTO bal;
  IF _amount < 0 AND bal + _amount < 0 THEN
    RETURN jsonb_build_object('ok',false,'error','insufficient_balance','balance',bal);
  END IF;
  bal := bal + _amount;
  INSERT INTO public.wallet_transactions(user_id,amount,balance_after,type,description,stripe_session_id)
  VALUES (_user_id,_amount,bal,_type,coalesce(_description,''),_stripe_session_id);
  RETURN jsonb_build_object('ok',true,'balance',bal);
END $$;

CREATE OR REPLACE FUNCTION public.wallet_admin_adjust(_user_id uuid, _amount numeric, _type text, _description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  RETURN public.wallet_apply(_user_id,_amount,coalesce(_type,'adjustment'),_description);
END $$;

CREATE OR REPLACE FUNCTION public.wallet_credit_from_payment(_user_id uuid, _amount numeric, _description text, _stripe_session_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE stripe_session_id = _stripe_session_id) THEN
    RETURN jsonb_build_object('ok',true,'duplicate',true);
  END IF;
  RETURN public.wallet_apply(_user_id, abs(_amount), 'topup', _description, _stripe_session_id);
END $$;

CREATE OR REPLACE FUNCTION public.wallet_debit_for_order(_order_id uuid, _amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.wallet_apply(public.get_team_owner(auth.uid()), -abs(_amount), 'order', 'Order '||_order_id::text);
END $$;

CREATE OR REPLACE FUNCTION public.wallet_debit_for_release(_release_id uuid, _amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.wallet_apply(public.get_team_owner(auth.uid()), -abs(_amount), 'release', 'Release '||_release_id::text);
END $$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _order_total numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.promo_codes%ROWTYPE; disc numeric := 0;
BEGIN
  SELECT * INTO p FROM public.promo_codes WHERE upper(code)=upper(_code) AND is_active;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid',false,'error','invalid_code'); END IF;
  IF p.max_uses IS NOT NULL AND p.uses_count >= p.max_uses THEN RETURN jsonb_build_object('valid',false,'error','max_uses_reached'); END IF;
  IF _order_total < p.min_order_sar THEN RETURN jsonb_build_object('valid',false,'error','min_order_not_met','min_order_sar',p.min_order_sar); END IF;
  disc := CASE WHEN p.discount_type='percent' THEN round(_order_total * p.discount_value / 100.0, 2) ELSE least(p.discount_value, _order_total) END;
  RETURN jsonb_build_object('valid',true,'code',p.code,'discount',disc,'discount_type',p.discount_type,'discount_value',p.discount_value);
END $$;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.promo_codes SET uses_count = uses_count + 1, updated_at = now() WHERE upper(code)=upper(_code) AND is_active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.apply_referral_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_owner uuid; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT user_id INTO ref_owner FROM public.referrals WHERE upper(referral_code)=upper(_code);
  IF ref_owner IS NULL THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
  IF ref_owner = uid THEN RETURN jsonb_build_object('ok',false,'error','self_referral'); END IF;
  INSERT INTO public.referrals(user_id, referral_code, referred_by)
  VALUES (uid, public.gen_referral_code(), ref_owner)
  ON CONFLICT (user_id) DO UPDATE SET referred_by = COALESCE(public.referrals.referred_by, ref_owner);
  INSERT INTO public.referral_events(event_type, referral_code, referral_user_id, referrer_user_id)
  VALUES ('signup', upper(_code), uid, ref_owner);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.track_referral_visit(_code text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_owner uuid;
BEGIN
  SELECT user_id INTO ref_owner FROM public.referrals WHERE upper(referral_code)=upper(_code);
  IF ref_owner IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  INSERT INTO public.referral_events(event_type, referral_code, referrer_user_id, metadata)
  VALUES ('visit', upper(_code), ref_owner, coalesce(_meta,'{}'::jsonb));
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'INV-'||to_char(now(),'YYYYMM')||'-'||lpad(((SELECT count(*) FROM public.invoices)+1)::text, 5, '0')
$$;

CREATE OR REPLACE FUNCTION public.build_zatca_qr(_seller_name text, _seller_vat text, _timestamp text, _total numeric, _vat numeric)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT encode(convert_to(_seller_name||'|'||_seller_vat||'|'||_timestamp||'|'||_total::text||'|'||_vat::text,'UTF8'),'base64')
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_for_order(_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE; inv_id uuid; vat numeric; sub numeric;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id=_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  SELECT id INTO inv_id FROM public.invoices WHERE order_id=_order_id LIMIT 1;
  IF inv_id IS NOT NULL THEN RETURN inv_id; END IF;
  sub := round(o.total / 1.15, 2); vat := o.total - sub;
  INSERT INTO public.invoices(user_id, order_id, invoice_number, invoice_type, amount, subtotal, vat_amount, vat_rate, status, line_items, buyer_name)
  VALUES (o.user_id,_order_id, public.generate_invoice_number(),'order', o.total, sub, vat, 15, 'issued', o.products, o.customer_name)
  RETURNING id INTO inv_id;
  RETURN inv_id;
END $$;

CREATE OR REPLACE FUNCTION public.get_user_plan_limit(_user_id uuid, _limit_key text)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT NULLIF(limit_value,'')::numeric FROM public.customer_usage_limits WHERE user_id=_user_id AND limit_key=_limit_key),
    (SELECT NULLIF(limit_value,'')::numeric FROM public.usage_limit_defaults WHERE limit_key=_limit_key),
    0)
$$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.payment_events
    WHERE user_id = user_uuid AND status = 'active' AND subscription_id IS NOT NULL)
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invite(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tm public.team_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT * INTO tm FROM public.team_members WHERE invite_token=_token AND status='pending';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_token'); END IF;
  UPDATE public.team_members SET status='accepted', member_user_id=auth.uid(), accepted_at=now() WHERE id=tm.id;
  RETURN jsonb_build_object('ok',true,'owner_id',tm.owner_id);
END $$;

CREATE OR REPLACE FUNCTION public.claim_guest_shop_orders()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0; em text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  UPDATE public.shop_orders SET user_id = auth.uid() WHERE user_id IS NULL AND lower(customer_email)=lower(em);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'claimed',n);
END $$;

CREATE OR REPLACE FUNCTION public.record_page_duration(_id uuid, _ms integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.page_view_events SET duration_ms = _ms WHERE id = _id
$$;

CREATE OR REPLACE FUNCTION public.refresh_category_counts_cache()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.product_category_counts_cache;
  INSERT INTO public.product_category_counts_cache(top_category,sub_category,detailed_category,cnt,updated_at)
  SELECT top_category,sub_category,detailed_category,count(*)::numeric, now() FROM public.products GROUP BY 1,2,3;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.category_counts_meta(id,dirty,last_refresh) VALUES (true,false,now())
  ON CONFLICT (id) DO UPDATE SET dirty=false, last_refresh=now();
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.refresh_category_counts_if_dirty()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d boolean; n integer := 0;
BEGIN
  SELECT dirty INTO d FROM public.category_counts_meta WHERE id;
  IF COALESCE(d,true) THEN n := public.refresh_category_counts_cache(); RETURN jsonb_build_object('refreshed',true,'rows',n); END IF;
  RETURN jsonb_build_object('refreshed',false);
END $$;

CREATE OR REPLACE FUNCTION public.admin_product_add_stats(_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.products),
    'recent', (SELECT count(*) FROM public.products WHERE created_at > now() - (_days||' days')::interval),
    'by_source', COALESCE((SELECT jsonb_object_agg(source, c) FROM (SELECT source, count(*) c FROM public.products GROUP BY source) s),'{}'::jsonb))
$$;

CREATE OR REPLACE FUNCTION public.analytics_summary(_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'page_views', (SELECT count(*) FROM public.page_view_events WHERE created_at > now() - (_days||' days')::interval),
    'visitors', (SELECT count(DISTINCT visitor_id) FROM public.page_view_events WHERE created_at > now() - (_days||' days')::interval),
    'sessions', (SELECT count(DISTINCT session_id) FROM public.page_view_events WHERE created_at > now() - (_days||' days')::interval),
    'orders', (SELECT count(*) FROM public.orders WHERE created_at > now() - (_days||' days')::interval),
    'revenue', COALESCE((SELECT sum(total) FROM public.orders WHERE created_at > now() - (_days||' days')::interval),0))
$$;

CREATE OR REPLACE FUNCTION public.product_digest_stats(_since timestamptz, _limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'new_count', (SELECT count(*) FROM public.products WHERE created_at > _since),
    'products', COALESCE((SELECT jsonb_agg(p) FROM (SELECT id,name,sku,price_sar,images FROM public.products WHERE created_at > _since ORDER BY created_at DESC LIMIT _limit) p),'[]'::jsonb))
$$;

CREATE OR REPLACE FUNCTION public.apply_pricing_formula(_cost_usd numeric DEFAULT 0, _weight_kg numeric DEFAULT 0, _source text DEFAULT '')
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT round((_cost_usd * public.pricing_setting('usd_to_sar', 3.75) * (1 + public.pricing_setting('markup_percent', 30)/100.0))
    + CASE WHEN public.weight_fee_in_price(_source) THEN _weight_kg * public.pricing_setting('weight_fee_sar_kg', 0) ELSE 0 END, 2)
$$;

CREATE OR REPLACE FUNCTION public.reprice_products_batch(_batch_size integer DEFAULT 500)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN 0; END IF;
  WITH b AS (SELECT id FROM public.products ORDER BY updated_at ASC LIMIT _batch_size)
  UPDATE public.products p SET price_sar = public.apply_pricing_formula(p.cost_usd, p.weight_kg, p.source), updated_at = now()
  FROM b WHERE p.id = b.id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_inventory(_inventory_id uuid, _qty_change integer, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.warehouse_inventory%ROWTYPE;
BEGIN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.warehouse_inventory
     SET qty_on_hand = qty_on_hand + _qty_change, last_movement_at = now(), updated_at = now()
   WHERE id = _inventory_id RETURNING * INTO inv;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  INSERT INTO public.inventory_movements(inventory_id, product_id, user_id, created_by, qty_change, qty_after, type, notes)
  VALUES (inv.id, inv.product_id, inv.user_id, auth.uid(), _qty_change, inv.qty_on_hand, 'adjustment', _reason);
  RETURN jsonb_build_object('ok',true,'qty_on_hand',inv.qty_on_hand);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_customers(_search text DEFAULT NULL, _limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE (avatar_url text, created_at timestamptz, display_name text, email text, id uuid, lifetime numeric, order_count numeric, tags jsonb, total_count numeric, user_id uuid, wallet_balance numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH f AS (
    SELECT p.* FROM public.profiles p
     WHERE _search IS NULL OR _search = '' OR p.email ILIKE '%'||_search||'%' OR p.display_name ILIKE '%'||_search||'%'
  )
  SELECT f.avatar_url, f.created_at, f.display_name, f.email, f.id,
    COALESCE((SELECT sum(o.total) FROM public.orders o WHERE o.user_id=f.user_id),0)::numeric,
    COALESCE((SELECT count(*) FROM public.orders o WHERE o.user_id=f.user_id),0)::numeric,
    COALESCE((SELECT jsonb_agg(ct.tag) FROM public.customer_tags ct WHERE ct.customer_id=f.user_id),'[]'::jsonb),
    (SELECT count(*) FROM f)::numeric,
    f.user_id,
    COALESCE((SELECT wt.balance_after FROM public.wallet_transactions wt WHERE wt.user_id=f.user_id ORDER BY wt.created_at DESC LIMIT 1),0)::numeric
  FROM f
  WHERE public.is_staff_or_admin(auth.uid())
  ORDER BY f.created_at DESC
  LIMIT _limit OFFSET _offset
$$;

CREATE OR REPLACE FUNCTION public.analytics_sessions(_days integer DEFAULT 30, _limit integer DEFAULT 100, _search text DEFAULT NULL)
RETURNS TABLE (browser text, converted boolean, country text, device_type text, display_name text, email text, first_seen timestamptz, landing_page text, last_page text, last_seen timestamptz, page_views numeric, referrer text, session_id text, user_id uuid, visitor_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT max(e.browser), false, max(e.country), max(e.device_type),
         max(p.display_name), max(p.email), min(e.created_at),
         (array_agg(e.path ORDER BY e.created_at ASC))[1],
         (array_agg(e.path ORDER BY e.created_at DESC))[1],
         max(e.created_at), count(*)::numeric, max(e.referrer), e.session_id,
         (array_agg(e.user_id ORDER BY e.created_at DESC))[1], max(e.visitor_id)
    FROM public.page_view_events e
    LEFT JOIN public.profiles p ON p.user_id = e.user_id
   WHERE public.is_staff_or_admin(auth.uid())
     AND e.created_at > now() - (_days||' days')::interval
     AND (_search IS NULL OR _search='' OR e.session_id ILIKE '%'||_search||'%' OR e.visitor_id ILIKE '%'||_search||'%')
   GROUP BY e.session_id
   ORDER BY max(e.created_at) DESC
   LIMIT _limit
$$;

CREATE OR REPLACE FUNCTION public.analytics_session_timeline(_session_id text)
RETURNS TABLE (at timestamptz, detail text, kind text, label text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT created_at, path, 'page_view', title FROM public.page_view_events
   WHERE public.is_staff_or_admin(auth.uid()) AND session_id = _session_id
  UNION ALL
  SELECT created_at, path, 'event', name FROM public.site_events
   WHERE public.is_staff_or_admin(auth.uid()) AND session_id = _session_id
  ORDER BY 1
$$;

CREATE OR REPLACE FUNCTION public.hunt_catalog_products(
  _terms text[], _category text DEFAULT NULL, _in_stock boolean DEFAULT NULL,
  _limit integer DEFAULT 24, _max_price numeric DEFAULT NULL, _min_price numeric DEFAULT NULL,
  _offset integer DEFAULT 0, _relaxed boolean DEFAULT false, _source text DEFAULT NULL)
RETURNS TABLE (bulk_price numeric, bulk_price_usd numeric, cost_usd numeric, created_at timestamptz,
  detailed_category text, dropship_price numeric, dropship_price_usd numeric, estimated_delivery text,
  id uuid, images text[], is_featured boolean, labelling_available boolean, match_score numeric,
  moq numeric, name text, name_ar text, platforms text[], price_sar numeric, price_usd numeric,
  sku text, source text, stock_qty integer, sub_category text, top_category text, total_count numeric,
  track_inventory boolean, weight_kg numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH f AS (
    SELECT p.*,
      (SELECT count(*) FROM unnest(COALESCE(_terms,'{}'::text[])) t
        WHERE p.name ILIKE '%'||t||'%' OR COALESCE(p.description,'') ILIKE '%'||t||'%'
           OR p.sku ILIKE '%'||t||'%' OR COALESCE(p.name_ar,'') ILIKE '%'||t||'%')::numeric AS score
      FROM public.products p
     WHERE (_category IS NULL OR _category='' OR p.top_category=_category OR p.sub_category=_category OR p.detailed_category=_category)
       AND (_source IS NULL OR _source='' OR p.source=_source)
       AND (_min_price IS NULL OR p.price_sar >= _min_price)
       AND (_max_price IS NULL OR p.price_sar <= _max_price)
       AND (_in_stock IS NULL OR (_in_stock AND p.stock_qty > 0) OR (NOT _in_stock))
  ), m AS (
    SELECT * FROM f WHERE _relaxed OR COALESCE(array_length(_terms,1),0)=0 OR score > 0
  )
  SELECT m.bulk_price, m.bulk_price_usd, m.cost_usd, m.created_at, m.detailed_category, m.dropship_price,
         m.dropship_price_usd, m.estimated_delivery, m.id, m.images, m.is_featured, m.labelling_available,
         m.score, m.moq, m.name, m.name_ar, m.platforms, m.price_sar, m.price_usd, m.sku, m.source,
         m.stock_qty, m.sub_category, m.top_category, (SELECT count(*) FROM m)::numeric,
         m.track_inventory, m.weight_kg
    FROM m ORDER BY m.score DESC, m.created_at DESC
   LIMIT _limit OFFSET _offset
$$;

CREATE OR REPLACE FUNCTION public.queue_email(_user_id uuid, _template_name text, _payload jsonb, _recipient_email text DEFAULT NULL, _dedupe_key text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text; new_id uuid;
BEGIN
  em := COALESCE(_recipient_email, (SELECT email FROM public.profiles WHERE user_id=_user_id));
  IF em IS NULL THEN RETURN NULL; END IF;
  IF _dedupe_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.email_outbox WHERE dedupe_key=_dedupe_key) THEN RETURN NULL; END IF;
  INSERT INTO public.email_outbox(recipient_user_id, recipient_email, template_name, payload, dedupe_key)
  VALUES (_user_id, em, _template_name, coalesce(_payload,'{}'::jsonb), _dedupe_key)
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.wallet_apply(uuid,numeric,text,text,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wallet_credit_from_payment(uuid,numeric,text,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins(text,text,text,text,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.queue_email(uuid,text,jsonb,text,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_for_order(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_customers(text,integer,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_sessions(integer,integer,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_session_timeline(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_summary(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_customers(text,integer,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reprice_products_batch(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_inventory(uuid,integer,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_send_notification(uuid,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.wallet_admin_adjust(uuid,numeric,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.wallet_get_balance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.wallet_debit_for_order(uuid,numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.wallet_debit_for_release(uuid,numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_team_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_guest_shop_orders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_referral_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_product_add_stats(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.product_digest_stats(timestamptz,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_plan_limit(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff_or_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_team_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.team_can_buy(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid,text) FROM anon;
