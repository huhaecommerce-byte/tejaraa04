ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS courier_id text,
  ADD COLUMN IF NOT EXISTS import_shipping_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_shop_orders_customer_email ON public.shop_orders (lower(customer_email));

CREATE OR REPLACE FUNCTION public.claim_guest_shop_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _claimed int := 0;
  _last public.shop_orders%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('claimed', 0);
  END IF;

  SELECT lower(email) INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL THEN
    RETURN jsonb_build_object('claimed', 0);
  END IF;

  UPDATE public.shop_orders
     SET user_id = _uid, updated_at = now()
   WHERE user_id IS NULL
     AND lower(customer_email) = _email;
  GET DIAGNOSTICS _claimed = ROW_COUNT;

  SELECT * INTO _last
    FROM public.shop_orders
   WHERE user_id = _uid
   ORDER BY created_at DESC
   LIMIT 1;

  IF _last.id IS NOT NULL THEN
    UPDATE public.profiles
       SET display_name = COALESCE(NULLIF(display_name, ''), _last.customer_name),
           phone = COALESCE(NULLIF(phone, ''), _last.customer_phone),
           updated_at = now()
     WHERE user_id = _uid;

    IF NOT EXISTS (SELECT 1 FROM public.shipping_addresses WHERE user_id = _uid) THEN
      INSERT INTO public.shipping_addresses
        (user_id, label, recipient_name, phone, address_line1, city, is_default)
      VALUES
        (_uid, 'Home', _last.customer_name, _last.customer_phone, _last.address_line, _last.city, true);
    END IF;
  END IF;

  RETURN jsonb_build_object('claimed', _claimed);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_shop_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_guest_shop_orders() TO authenticated;