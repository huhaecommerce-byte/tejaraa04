-- SEO slug support for products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS slug_ar text;

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(_txt, '')), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.products_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = ''
     OR (TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name AND NEW.slug = OLD.slug) THEN
    base := left(public.slugify(NEW.name), 80);
    IF base = '' THEN base := 'product'; END IF;
    NEW.slug := base || '-' || left(replace(NEW.id::text, '-', ''), 8);
  END IF;

  IF NEW.name_ar IS NOT NULL AND NEW.name_ar <> '' THEN
    NEW.slug_ar := NEW.slug;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_set_slug ON public.products;
CREATE TRIGGER trg_products_set_slug
BEFORE INSERT OR UPDATE OF name, slug ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_set_slug();

-- Backfill existing rows
UPDATE public.products
SET slug = left(nullif(public.slugify(name), ''), 80) || '-' || left(replace(id::text, '-', ''), 8)
WHERE slug IS NULL OR slug = '';

UPDATE public.products
SET slug = 'product-' || left(replace(id::text, '-', ''), 8)
WHERE slug IS NULL OR slug = '' OR slug LIKE '-%';

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_cat_keyset_idx
  ON public.products (top_category, sub_category, detailed_category, id);
CREATE INDEX IF NOT EXISTS products_top_cat_idx ON public.products (top_category, id);