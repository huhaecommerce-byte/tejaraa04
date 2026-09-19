CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS products_created_at_id_idx
  ON public.products (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS products_source_created_idx
  ON public.products (source, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS products_top_cat_created_idx
  ON public.products (top_category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS products_sub_cat_created_idx
  ON public.products (sub_category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS products_detailed_cat_created_idx
  ON public.products (detailed_category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON public.products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_name_ar_trgm_idx
  ON public.products USING gin (name_ar gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_sku_trgm_idx
  ON public.products USING gin (sku gin_trgm_ops);

ANALYZE public.products;