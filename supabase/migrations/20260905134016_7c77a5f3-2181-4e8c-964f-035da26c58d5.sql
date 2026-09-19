DROP TRIGGER IF EXISTS trg_products_apply_pricing ON public.products;
CREATE TRIGGER trg_products_apply_pricing
BEFORE INSERT OR UPDATE OF cost_usd, weight_kg, source ON public.products
FOR EACH ROW EXECUTE FUNCTION public.trg_products_apply_pricing();