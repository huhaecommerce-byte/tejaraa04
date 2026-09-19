DROP TRIGGER IF EXISTS audit_products ON public.products;

CREATE TRIGGER audit_products
AFTER UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('product');

DELETE FROM public.audit_log
WHERE entity_type = 'product' AND action = 'create';