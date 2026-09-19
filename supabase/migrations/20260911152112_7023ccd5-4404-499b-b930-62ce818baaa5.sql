DELETE FROM public.platform_settings WHERE key = 'first_order_free_shipping';

INSERT INTO public.platform_settings (key, value, label)
VALUES ('signup_credit_sar', '20', 'Signup Welcome Credit (SAR)')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_signup_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _amount numeric;
  _bal numeric;
BEGIN
  SELECT COALESCE(NULLIF(value, '')::numeric, 0) INTO _amount
  FROM public.platform_settings WHERE key = 'signup_credit_sar';

  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    (SELECT balance_after FROM public.wallet_transactions
      WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 1), 0)
  INTO _bal;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description)
  VALUES (NEW.user_id, 'credit', _amount, _bal + _amount,
          'Welcome credit — SAR ' || trim(to_char(_amount, 'FM999999990.99')) || ' on us');

  PERFORM public.queue_email(
    'signup-credit',
    NEW.user_id,
    jsonb_build_object(
      'customerName', NEW.display_name,
      'creditAmount', trim(to_char(_amount, 'FM999999990.99')),
      'catalogUrl', 'https://tejaraa.com/dashboard/catalog',
      'dashboardUrl', 'https://tejaraa.com/dashboard'
    ),
    NEW.user_id::text || ':signup-credit',
    NEW.email
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_signup_credit() FROM PUBLIC, anon, authenticated;