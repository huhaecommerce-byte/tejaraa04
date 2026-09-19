ALTER TABLE public.wl_products
  ADD COLUMN IF NOT EXISTS category_l1_id integer,
  ADD COLUMN IF NOT EXISTS category_l2_id integer,
  ADD COLUMN IF NOT EXISTS category_l3_id integer,
  ADD COLUMN IF NOT EXISTS category_id integer,
  ADD COLUMN IF NOT EXISTS category_path text;

CREATE INDEX IF NOT EXISTS wl_products_category_id_idx ON public.wl_products (category_id);
CREATE INDEX IF NOT EXISTS wl_products_category_l1_idx ON public.wl_products (category_l1_id);
CREATE INDEX IF NOT EXISTS wl_products_category_l2_idx ON public.wl_products (category_l2_id);