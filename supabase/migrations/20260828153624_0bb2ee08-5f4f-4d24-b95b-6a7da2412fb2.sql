-- 1) Team member self-update guard: also lock status + invite_email
CREATE OR REPLACE FUNCTION public.guard_team_member_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = OLD.owner_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = OLD.member_user_id THEN
    NEW.owner_id := OLD.owner_id;
    NEW.member_user_id := OLD.member_user_id;
    NEW.member_role := OLD.member_role;
    NEW.invite_email := OLD.invite_email;
    NEW.invite_token := OLD.invite_token;
    -- members may only move their own row from pending -> accepted
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status = 'pending'::team_invite_status
                AND NEW.status = 'accepted'::team_invite_status) THEN
      NEW.status := OLD.status;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Protect admin-controlled columns on return_requests
CREATE OR REPLACE FUNCTION public.protect_return_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_module_access(auth.uid(), 'returns') THEN
    RETURN NEW;
  END IF;
  NEW.refund_amount := OLD.refund_amount;
  NEW.admin_notes := OLD.admin_notes;
  NEW.status := OLD.status;
  NEW.resolved_at := OLD.resolved_at;
  NEW.order_id := OLD.order_id;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_return_admin_fields ON public.return_requests;
CREATE TRIGGER protect_return_admin_fields
BEFORE UPDATE ON public.return_requests
FOR EACH ROW EXECUTE FUNCTION public.protect_return_admin_fields();

-- 3) Protect admin-controlled columns on sourcing_requests
CREATE OR REPLACE FUNCTION public.protect_sourcing_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_module_access(auth.uid(), 'sourcing') THEN
    RETURN NEW;
  END IF;
  NEW.admin_reply := OLD.admin_reply;
  NEW.quoted_price_sar := OLD.quoted_price_sar;
  NEW.converted_product_id := OLD.converted_product_id;
  NEW.status := OLD.status;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_sourcing_admin_fields ON public.sourcing_requests;
CREATE TRIGGER protect_sourcing_admin_fields
BEFORE UPDATE ON public.sourcing_requests
FOR EACH ROW EXECUTE FUNCTION public.protect_sourcing_admin_fields();

-- 4) Referral events: validate code, force real identities
CREATE OR REPLACE FUNCTION public.validate_referral_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner
  FROM public.referrals
  WHERE referral_code = NEW.referral_code
  LIMIT 1;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Unknown referral code';
  END IF;

  -- referrer is always derived from the code, never from the client
  NEW.referrer_user_id := v_owner;

  IF auth.uid() IS NOT NULL THEN
    NEW.referral_user_id := auth.uid();
  ELSE
    NEW.referral_user_id := NULL;
  END IF;

  IF NEW.referral_user_id IS NOT NULL AND NEW.referral_user_id = v_owner THEN
    RAISE EXCEPTION 'Self referral is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_referral_event ON public.referral_events;
CREATE TRIGGER trg_validate_referral_event
BEFORE INSERT ON public.referral_events
FOR EACH ROW EXECUTE FUNCTION public.validate_referral_event();

-- 5) Atomic promo code redemption
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.promo_codes;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.promo_codes
  SET uses_count = uses_count + 1,
      updated_at = now()
  WHERE upper(code) = upper(btrim(_code))
    AND is_active = true
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until >= now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_exhausted');
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'uses_count', v_row.uses_count);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated, service_role;

-- 6) Aggregated, paged customer list for the admin portal
CREATE OR REPLACE FUNCTION public.admin_list_customers(
  _search text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz,
  order_count bigint,
  lifetime numeric,
  wallet_balance numeric,
  tags jsonb,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(_limit, 50), 1), 200);
  v_offset integer := greatest(coalesce(_offset, 0), 0);
  v_q text := nullif(btrim(coalesce(_search, '')), '');
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.is_staff_or_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT p.id, p.user_id, p.display_name, p.email, p.avatar_url, p.created_at
    FROM public.profiles p
    WHERE v_q IS NULL
       OR p.display_name ILIKE '%' || v_q || '%'
       OR p.email ILIKE '%' || v_q || '%'
  ),
  counted AS (SELECT count(*) AS n FROM base),
  page AS (
    SELECT * FROM base ORDER BY created_at DESC LIMIT v_limit OFFSET v_offset
  )
  SELECT
    pg.id,
    pg.user_id,
    pg.display_name,
    pg.email,
    pg.avatar_url,
    pg.created_at,
    coalesce(o.cnt, 0)::bigint,
    coalesce(o.total, 0)::numeric,
    coalesce(w.balance_after, 0)::numeric,
    coalesce(t.tags, '[]'::jsonb),
    counted.n
  FROM page pg
  CROSS JOIN counted
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt, sum(ord.total) AS total
    FROM public.orders ord WHERE ord.user_id = pg.user_id
  ) o ON true
  LEFT JOIN LATERAL (
    SELECT wt.balance_after
    FROM public.wallet_transactions wt
    WHERE wt.user_id = pg.user_id
    ORDER BY wt.created_at DESC
    LIMIT 1
  ) w ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('tag', ct.tag, 'color', ct.color)) AS tags
    FROM (
      SELECT tag, color FROM public.customer_tags
      WHERE customer_id = pg.user_id ORDER BY created_at LIMIT 3
    ) ct
  ) t ON true
  ORDER BY pg.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_customers(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_customers(text, integer, integer) TO authenticated, service_role;