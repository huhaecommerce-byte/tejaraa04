
REVOKE ALL ON FUNCTION public.enqueue_order_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_welcome_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_wallet_topup_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_quote_reply_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_ticket_reply_email() FROM PUBLIC, anon, authenticated;
