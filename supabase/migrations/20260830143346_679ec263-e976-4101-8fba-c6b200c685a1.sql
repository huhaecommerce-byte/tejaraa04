-- 1) Automatic SAR 20 welcome credit on signup
CREATE OR REPLACE FUNCTION public.grant_signup_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _amount numeric := 20;
  _bal numeric;
BEGIN
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    (SELECT balance_after FROM public.wallet_transactions
      WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 1), 0)
  INTO _bal;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description)
  VALUES (NEW.user_id, 'credit', _amount, _bal + _amount, 'Welcome credit — SAR 20 on us');

  PERFORM public.queue_email(
    'signup-credit',
    NEW.user_id,
    jsonb_build_object(
      'customerName', NEW.display_name,
      'creditAmount', _amount,
      'catalogUrl', 'https://tejaraa.com/dashboard/catalog',
      'dashboardUrl', 'https://tejaraa.com/dashboard'
    ),
    NEW.user_id::text || ':signup-credit',
    NEW.email
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_signup_credit ON public.profiles;
CREATE TRIGGER trg_grant_signup_credit
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.grant_signup_credit();

-- 2) Settings
INSERT INTO public.platform_settings (key, value, label)
VALUES
  ('first_order_free_shipping', 'true', 'First Order Free Shipping'),
  ('signup_credit_sar', '20', 'Signup Welcome Credit (SAR)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.email_template_settings (template_name, label, enabled)
VALUES
  ('signup-credit', 'Signup Welcome Credit', true),
  ('confirm-reminder', 'Confirm Your Email Reminder', true)
ON CONFLICT (template_name) DO NOTHING;

-- 3) Confirmation reminder tracking
CREATE TABLE IF NOT EXISTS public.signup_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  stage text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stage)
);

GRANT SELECT ON public.signup_reminder_log TO authenticated;
GRANT ALL ON public.signup_reminder_log TO service_role;

ALTER TABLE public.signup_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view signup reminder log"
ON public.signup_reminder_log
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));