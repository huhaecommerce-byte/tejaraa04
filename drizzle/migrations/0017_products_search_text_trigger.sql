CREATE OR REPLACE FUNCTION public.products_set_search_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_text := lower(coalesce(NEW.name,'') || ' ' || coalesce(NEW.name_ar,'') || ' ' || coalesce(NEW.sku,'') || ' ' ||
    coalesce(NEW.top_category,'') || ' ' || coalesce(NEW.sub_category,'') || ' ' || coalesce(NEW.detailed_category,''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_search_text_trg ON public.products;
CREATE TRIGGER products_set_search_text_trg
BEFORE INSERT OR UPDATE OF name, name_ar, sku, top_category, sub_category, detailed_category
ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_set_search_text();

CREATE INDEX IF NOT EXISTS products_search_text_trgm_idx ON public.products USING gin (search_text gin_trgm_ops);