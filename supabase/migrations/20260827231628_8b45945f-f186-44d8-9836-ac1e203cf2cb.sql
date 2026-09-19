
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text UNIQUE,
  template_name text NOT NULL,
  recipient_email text NOT NULL,
  recipient_user_id uuid,
  subject_override text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_outbox TO authenticated;
GRANT ALL ON public.email_outbox TO service_role;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_outbox_admin_all" ON public.email_outbox;
CREATE POLICY "email_outbox_admin_all" ON public.email_outbox
  FOR ALL TO authenticated
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS email_outbox_status_idx ON public.email_outbox (status, scheduled_at);
CREATE INDEX IF NOT EXISTS email_outbox_created_idx ON public.email_outbox (created_at DESC);

DROP TRIGGER IF EXISTS trg_email_outbox_updated_at ON public.email_outbox;
CREATE TRIGGER trg_email_outbox_updated_at
  BEFORE UPDATE ON public.email_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.email_template_settings (
  template_name text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_settings TO authenticated;
GRANT ALL ON public.email_template_settings TO service_role;
ALTER TABLE public.email_template_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_template_settings_read" ON public.email_template_settings;
CREATE POLICY "email_template_settings_read" ON public.email_template_settings
  FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

DROP POLICY IF EXISTS "email_template_settings_write" ON public.email_template_settings;
CREATE POLICY "email_template_settings_write" ON public.email_template_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_template_settings (template_name, label) VALUES
  ('welcome', 'Welcome email'),
  ('order-confirmation', 'Order confirmation'),
  ('order-processing', 'Order processing'),
  ('order-labelling', 'Order labelling / prep'),
  ('order-shipped', 'Order shipped'),
  ('order-delivered', 'Order delivered'),
  ('order-cancelled', 'Order cancelled'),
  ('abandoned-checkout', 'Abandoned checkout reminder'),
  ('wallet-topup', 'Wallet top-up receipt'),
  ('quote-reply', 'Quote / sourcing reply'),
  ('ticket-reply', 'Support ticket reply'),
  ('custom-message', 'Custom message')
ON CONFLICT (template_name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.queue_email(
  _template_name text,
  _user_id uuid,
  _payload jsonb,
  _dedupe_key text DEFAULT NULL,
  _recipient_email text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _enabled boolean;
  _id uuid;
BEGIN
  SELECT enabled INTO _enabled FROM public.email_template_settings WHERE template_name = _template_name;
  IF _enabled IS NOT NULL AND _enabled = false THEN
    RETURN NULL;
  END IF;

  _email := _recipient_email;
  IF _email IS NULL AND _user_id IS NOT NULL THEN
    SELECT email INTO _email FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  END IF;
  IF _email IS NULL OR _email = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.email_outbox (dedupe_key, template_name, recipient_email, recipient_user_id, payload)
  VALUES (_dedupe_key, _template_name, _email, _user_id, COALESCE(_payload, '{}'::jsonb))
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_email(text, uuid, jsonb, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_email(text, uuid, jsonb, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_order_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _template text;
  _status text := lower(coalesce(NEW.status, ''));
  _items jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND lower(coalesce(OLD.status, '')) = _status THEN
    RETURN NEW;
  END IF;

  _template := CASE _status
    WHEN 'pending' THEN 'order-confirmation'
    WHEN 'confirmed' THEN 'order-confirmation'
    WHEN 'new' THEN 'order-confirmation'
    WHEN 'processing' THEN 'order-processing'
    WHEN 'labelling' THEN 'order-labelling'
    WHEN 'shipped' THEN 'order-shipped'
    WHEN 'in_transit' THEN 'order-shipped'
    WHEN 'delivered' THEN 'order-delivered'
    WHEN 'cancelled' THEN 'order-cancelled'
    WHEN 'canceled' THEN 'order-cancelled'
    ELSE NULL
  END;

  IF _template IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'name', COALESCE(item->>'name', item->>'product_name', 'Item'),
      'qty', COALESCE(item->>'qty', item->>'quantity', '1'),
      'lineTotal', COALESCE(item->>'line_total', item->>'total', item->>'price')
    )), '[]'::jsonb)
  INTO _items
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.products) = 'array' THEN NEW.products ELSE '[]'::jsonb END) AS item;

  PERFORM public.queue_email(
    _template,
    NEW.user_id,
    jsonb_build_object(
      'orderNumber', '#' || upper(substr(NEW.id::text, 1, 8)),
      'customerName', NEW.customer_name,
      'destination', NEW.destination,
      'total', to_char(NEW.total, 'FM999999990.00'),
      'currency', 'SAR',
      'trackingNumber', NEW.tracking_number,
      'items', _items,
      'orderUrl', 'https://tejaraa.com/dashboard/orders/' || NEW.id::text,
      'placedAt', to_char(NEW.created_at, 'DD Mon YYYY')
    ),
    NEW.id::text || ':' || _template
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_order_email_ins ON public.orders;
CREATE TRIGGER trg_enqueue_order_email_ins
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_order_email();

DROP TRIGGER IF EXISTS trg_enqueue_order_email_upd ON public.orders;
CREATE TRIGGER trg_enqueue_order_email_upd
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_order_email();

CREATE OR REPLACE FUNCTION public.enqueue_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.queue_email(
    'welcome',
    NEW.user_id,
    jsonb_build_object('customerName', NEW.display_name, 'dashboardUrl', 'https://tejaraa.com/dashboard'),
    NEW.user_id::text || ':welcome',
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_welcome_email ON public.profiles;
CREATE TRIGGER trg_enqueue_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_welcome_email();

CREATE OR REPLACE FUNCTION public.enqueue_wallet_topup_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(coalesce(NEW.type, '')) NOT IN ('topup', 'top_up', 'credit') OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  PERFORM public.queue_email(
    'wallet-topup',
    NEW.user_id,
    jsonb_build_object(
      'amount', to_char(NEW.amount, 'FM999999990.00'),
      'balance', to_char(NEW.balance_after, 'FM999999990.00'),
      'currency', 'SAR',
      'reference', NEW.description,
      'walletUrl', 'https://tejaraa.com/dashboard/wallet'
    ),
    NEW.id::text || ':wallet-topup'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_wallet_topup_email ON public.wallet_transactions;
CREATE TRIGGER trg_enqueue_wallet_topup_email
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_wallet_topup_email();

CREATE OR REPLACE FUNCTION public.enqueue_quote_reply_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(OLD.status, '') = coalesce(NEW.status, '')
     AND coalesce(OLD.admin_reply, '') = coalesce(NEW.admin_reply, '') THEN
    RETURN NEW;
  END IF;

  PERFORM public.queue_email(
    'quote-reply',
    NEW.user_id,
    jsonb_build_object(
      'kind', 'bulk quote',
      'reference', '#' || upper(substr(NEW.id::text, 1, 8)),
      'status', initcap(NEW.status),
      'message', NEW.admin_reply,
      'quoted', CASE WHEN NEW.quoted_price_sar IS NULL THEN NULL ELSE to_char(NEW.quoted_price_sar, 'FM999999990.00') END,
      'currency', 'SAR',
      'actionUrl', 'https://tejaraa.com/dashboard/quotes',
      'actionLabel', 'View my quote'
    ),
    NEW.id::text || ':quote:' || coalesce(NEW.status, '') || ':' || md5(coalesce(NEW.admin_reply, ''))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_quote_reply_email ON public.quote_requests;
CREATE TRIGGER trg_enqueue_quote_reply_email
  AFTER UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_quote_reply_email();

CREATE OR REPLACE FUNCTION public.enqueue_ticket_reply_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _subject text;
BEGIN
  IF NOT NEW.is_admin THEN
    RETURN NEW;
  END IF;

  SELECT user_id, subject INTO _owner, _subject FROM public.tickets WHERE id = NEW.ticket_id;
  IF _owner IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.queue_email(
    'ticket-reply',
    _owner,
    jsonb_build_object(
      'kind', 'support ticket',
      'reference', '#' || upper(substr(NEW.ticket_id::text, 1, 8)),
      'status', _subject,
      'message', NEW.message,
      'actionUrl', 'https://tejaraa.com/dashboard/tickets',
      'actionLabel', 'Open my ticket'
    ),
    NEW.id::text || ':ticket-reply'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_ticket_reply_email ON public.ticket_messages;
CREATE TRIGGER trg_enqueue_ticket_reply_email
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_ticket_reply_email();
