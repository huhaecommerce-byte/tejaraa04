DROP POLICY IF EXISTS "Users can insert messages on own orders" ON public.order_messages;
CREATE POLICY "Users can insert messages on own orders"
ON public.order_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(is_admin, false) = false
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_messages.order_id AND o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create messages on own tickets" ON public.ticket_messages;
CREATE POLICY "Users can create messages on own tickets"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(is_admin, false) = false
  AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can insert referral events" ON public.referral_events;
REVOKE INSERT ON public.referral_events FROM anon, authenticated;