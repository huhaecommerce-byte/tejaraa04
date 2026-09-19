DROP FUNCTION IF EXISTS public.recalculate_all_prices(numeric, numeric, numeric, numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.recalculate_prices_batch(integer, integer, numeric, numeric, numeric, numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.recalculate_prices_cursor(uuid, integer, integer, numeric, numeric, numeric, numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.start_price_recalc_job(numeric, numeric, numeric, numeric, numeric, numeric, numeric, integer, boolean);
DROP TABLE IF EXISTS public.price_tiers;

CREATE OR REPLACE FUNCTION public.start_price_recalc_job(
  p_usd_to_sar_rate numeric,
  p_markup_percent numeric,
  p_flat_add numeric,
  p_weight_rate numeric,
  p_batch_size integer DEFAULT 200,
  p_resume boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job_id uuid;
  est integer;
  existing RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can run price recalculation';
  END IF;

  IF p_resume THEN
    SELECT * INTO existing FROM public.price_recalc_jobs
      WHERE status = 'running' ORDER BY created_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'job_id', existing.id, 'resumed', true,
        'processed', existing.processed, 'updated', existing.updated,
        'total_estimate', existing.total_estimate, 'last_id', existing.last_id,
        'batch_size', existing.batch_size
      );
    END IF;
  END IF;

  SELECT GREATEST(reltuples::integer, 0) INTO est
    FROM pg_class WHERE oid = 'public.products'::regclass;

  INSERT INTO public.price_recalc_jobs (started_by, total_estimate, batch_size, params)
  VALUES (
    auth.uid(), COALESCE(est, 0), GREATEST(p_batch_size, 10),
    jsonb_build_object(
      'usd_to_sar_rate', p_usd_to_sar_rate,
      'markup_percent', p_markup_percent,
      'flat_add', p_flat_add,
      'weight_rate', p_weight_rate
    )
  ) RETURNING id INTO job_id;

  RETURN jsonb_build_object(
    'job_id', job_id, 'resumed', false, 'processed', 0, 'updated', 0,
    'total_estimate', COALESCE(est, 0), 'last_id', NULL,
    'batch_size', GREATEST(p_batch_size, 10)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalc_job_step(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job RECORD;
  v_processed integer := 0;
  v_updated integer := 0;
  v_last uuid;
  p_rate numeric;
  p_mk numeric;
  p_flat numeric;
  p_w numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can run price recalculation';
  END IF;

  SET LOCAL statement_timeout = '45s';
  PERFORM set_config('app.skip_audit', 'on', true);

  SELECT * INTO job FROM public.price_recalc_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF job.status <> 'running' THEN
    RETURN jsonb_build_object('done', true, 'processed', job.processed, 'updated', job.updated,
      'total_estimate', job.total_estimate, 'last_id', job.last_id, 'status', job.status);
  END IF;

  p_rate := COALESCE(NULLIF((job.params->>'usd_to_sar_rate')::numeric, 0), 3.75);
  p_mk   := COALESCE((job.params->>'markup_percent')::numeric, 0);
  p_flat := COALESCE((job.params->>'flat_add')::numeric, 0);
  p_w    := COALESCE((job.params->>'weight_rate')::numeric, 0);

  WITH batch AS (
    SELECT id, cost_usd, weight_kg, price_sar AS old_sar, price_usd AS old_usd
    FROM public.products
    WHERE (job.last_id IS NULL OR id > job.last_id)
    ORDER BY id
    LIMIT job.batch_size
  ),
  computed AS (
    SELECT b.id, b.old_sar, b.old_usd,
      ROUND((COALESCE(b.cost_usd,0) * p_rate * (1 + p_mk/100)
             + p_flat + COALESCE(b.weight_kg,0) * p_w)::numeric, 2) AS new_sar
    FROM batch b
  ),
  final AS (
    SELECT c.id, c.old_sar, c.old_usd, c.new_sar, ROUND((c.new_sar / p_rate)::numeric, 2) AS new_usd
    FROM computed c
  ),
  batch_stats AS (SELECT count(*) AS cnt, max(id::text)::uuid AS max_id FROM batch),
  upd AS (
    UPDATE public.products p SET
      price_sar = f.new_sar,
      price_usd = f.new_usd,
      dropship_price = f.new_sar,
      bulk_price = f.new_sar,
      dropship_price_usd = f.new_usd,
      bulk_price_usd = f.new_usd
    FROM final f
    WHERE p.id = f.id
      AND (f.new_sar IS DISTINCT FROM f.old_sar OR f.new_usd IS DISTINCT FROM f.old_usd)
    RETURNING p.id
  )
  SELECT bs.cnt, bs.max_id, (SELECT count(*) FROM upd)
    INTO v_processed, v_last, v_updated
    FROM batch_stats bs;

  IF COALESCE(v_processed, 0) = 0 THEN
    UPDATE public.price_recalc_jobs SET status = 'completed', completed_at = now() WHERE id = p_job_id;
    SELECT * INTO job FROM public.price_recalc_jobs WHERE id = p_job_id;
    RETURN jsonb_build_object('done', true, 'processed', job.processed, 'updated', job.updated,
      'total_estimate', job.total_estimate, 'last_id', job.last_id, 'status', 'completed');
  END IF;

  UPDATE public.price_recalc_jobs
    SET processed = processed + COALESCE(v_processed, 0),
        updated = updated + COALESCE(v_updated, 0),
        last_id = COALESCE(v_last, last_id)
    WHERE id = p_job_id
    RETURNING * INTO job;

  RETURN jsonb_build_object('done', false, 'processed', job.processed, 'updated', job.updated,
    'total_estimate', job.total_estimate, 'last_id', job.last_id, 'status', job.status,
    'batch_processed', COALESCE(v_processed, 0), 'batch_updated', COALESCE(v_updated, 0));
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.start_price_recalc_job(numeric, numeric, numeric, numeric, integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalc_job_step(uuid) FROM anon;

INSERT INTO public.platform_settings (key, value, label) VALUES
  ('sell_markup_percent', '0', 'Selling markup %'),
  ('sell_flat_add', '0', 'Selling flat fee (SAR)'),
  ('sell_weight_rate', '0', 'Selling weight rate (SAR/kg)')
ON CONFLICT (key) DO NOTHING;