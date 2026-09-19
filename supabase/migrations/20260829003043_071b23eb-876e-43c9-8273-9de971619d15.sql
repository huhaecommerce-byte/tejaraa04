CREATE INDEX IF NOT EXISTS products_name_id_idx ON public.products (name, id);
CREATE INDEX IF NOT EXISTS products_price_sar_id_idx ON public.products (price_sar, id);
CREATE INDEX IF NOT EXISTS products_source_price_idx ON public.products (source, price_sar, id);
ANALYZE public.products;