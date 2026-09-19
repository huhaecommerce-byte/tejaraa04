DROP TRIGGER IF EXISTS trg_enforce_orders_limit ON public.orders;
DROP FUNCTION IF EXISTS public.enforce_orders_limit();