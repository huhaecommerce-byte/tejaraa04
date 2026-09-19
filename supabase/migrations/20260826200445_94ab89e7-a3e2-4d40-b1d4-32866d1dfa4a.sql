DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
USING (
  is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until > now())
  AND (max_uses IS NULL OR uses_count < max_uses)
);
CREATE POLICY "Admins can view all promo codes"
ON public.promo_codes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));