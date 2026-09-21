CREATE TABLE IF NOT EXISTS public.project_export_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_key text NOT NULL,
  file_name text NOT NULL,
  size_bytes bigint,
  downloaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_by_email text,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.project_export_downloads TO authenticated;
GRANT ALL ON public.project_export_downloads TO service_role;

ALTER TABLE public.project_export_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view export downloads" ON public.project_export_downloads;
CREATE POLICY "Staff can view export downloads"
ON public.project_export_downloads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can log export downloads" ON public.project_export_downloads;
CREATE POLICY "Staff can log export downloads"
ON public.project_export_downloads FOR INSERT TO authenticated
WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) AND downloaded_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_project_export_downloads_at ON public.project_export_downloads (downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_export_downloads_key ON public.project_export_downloads (export_key);