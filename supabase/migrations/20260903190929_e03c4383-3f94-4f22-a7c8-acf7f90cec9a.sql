CREATE TABLE public.product_activity_daily (
  activity_date date NOT NULL,
  creator_email text NOT NULL DEFAULT 'Unknown',
  creator_source text NOT NULL DEFAULT 'unknown',
  product_count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (activity_date, creator_email, creator_source)
);

GRANT SELECT ON public.product_activity_daily TO authenticated;
GRANT ALL ON public.product_activity_daily TO service_role;

ALTER TABLE public.product_activity_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can view product activity"
ON public.product_activity_daily
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

INSERT INTO public.product_activity_daily (activity_date, creator_email, creator_source, product_count)
SELECT
  created_at::date,
  COALESCE(created_by_email, 'Unknown'),
  COALESCE(created_by_source, 'unknown'),
  count(*)
FROM public.products
GROUP BY 1, 2, 3;
