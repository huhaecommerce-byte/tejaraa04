CREATE TABLE IF NOT EXISTS public.catalog_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_usage_log_user_created_idx ON public.catalog_usage_log (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.catalog_usage_log TO authenticated;
GRANT ALL ON public.catalog_usage_log TO service_role;

ALTER TABLE public.catalog_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own catalog usage" ON public.catalog_usage_log;
CREATE POLICY "Users view own catalog usage" ON public.catalog_usage_log
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users log own catalog usage" ON public.catalog_usage_log;
CREATE POLICY "Users log own catalog usage" ON public.catalog_usage_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);