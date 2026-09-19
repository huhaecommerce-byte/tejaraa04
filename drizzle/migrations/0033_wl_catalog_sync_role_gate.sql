CREATE OR REPLACE FUNCTION public.wl_supplier_is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wl_applications a
    WHERE a.user_id = _user_id AND a.status = 'approved'
  ) OR EXISTS (
    SELECT 1 FROM public.wl_user_roles r
    WHERE r.user_id = _user_id AND r.role IN ('supplier','admin')
  ) OR public.has_role(_user_id, 'admin');
$$;
