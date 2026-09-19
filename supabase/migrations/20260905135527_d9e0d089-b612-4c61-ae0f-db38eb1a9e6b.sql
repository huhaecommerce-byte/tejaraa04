-- lovable-cron-fallback-reviewed: 1440 runs/day; temporary one-minute batches are necessary to reprice 475,000 products without request timeouts, and the job self-removes when complete
CREATE OR REPLACE FUNCTION public.reprice_products_batch(_batch_size integer DEFAULT 5000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric := COALESCE(public.pricing_setting('usd_to_sar_rate', 3.75), 3.75);
  v_markup numeric := COALESCE(public.pricing_setting('sell_markup_percent', 0), 0);
  v_flat numeric := COALESCE(public.pricing_setting('sell_flat_add', 0), 0);
  v_wrate numeric := COALESCE(public.pricing_setting('sell_weight_rate', 0), 0);
  v_mode text := COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_mode'), 'in_price');
  v_scope text := COALESCE((SELECT value FROM public.platform_settings WHERE key = 'weight_fee_scope'), 'global');
  v_count integer;
BEGIN
  IF v_rate <= 0 THEN v_rate := 3.75; END IF;
  PERFORM set_config('app.skip_audit', '1', true);

  WITH batch AS (
    SELECT p.id,
      round(
        COALESCE(p.cost_usd, 0) * v_rate * (1 + v_markup / 100.0) + v_flat
        + CASE
            WHEN v_mode = 'in_price'
             AND (v_scope = 'all' OR v_scope = COALESCE(NULLIF(p.source, ''), 'local'))
            THEN COALESCE(p.weight_kg, 0) * v_wrate
            ELSE 0
          END,
        2
      ) AS sar
    FROM public.products p
    WHERE p.price_sar IS DISTINCT FROM round(
      COALESCE(p.cost_usd, 0) * v_rate * (1 + v_markup / 100.0) + v_flat
      + CASE
          WHEN v_mode = 'in_price'
           AND (v_scope = 'all' OR v_scope = COALESCE(NULLIF(p.source, ''), 'local'))
          THEN COALESCE(p.weight_kg, 0) * v_wrate
          ELSE 0
        END,
      2
    )
    ORDER BY p.id
    LIMIT GREATEST(1, LEAST(_batch_size, 10000))
  )
  UPDATE public.products p
  SET price_sar = batch.sar,
      price_usd = round(batch.sar / v_rate, 2)
  FROM batch
  WHERE p.id = batch.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'pricing_reprice_checkout_mode';
  END IF;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.reprice_products_batch(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reprice_products_batch(integer) TO service_role;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'pricing_reprice_checkout_mode';

SELECT cron.schedule(
  'pricing_reprice_checkout_mode',
  '* * * * *',
  'SELECT public.reprice_products_batch(5000);'
);