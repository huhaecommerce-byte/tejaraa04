-- lovable-cron-fallback-reviewed: 288 runs/day; email outbox and repricing are queue-drain batches that must run within ~5 minutes.
SELECT cron.unschedule('pricing_reprice_checkout_mode');
SELECT cron.unschedule('process-email-outbox-5min');
SELECT cron.unschedule('product-alert-digest-hourly');

SELECT cron.schedule('pricing_reprice_checkout_mode', '*/5 * * * *', $$SELECT public.reprice_products_batch(5000);$$);

SELECT cron.schedule(
  'process-email-outbox-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--697beba0-2fc6-4d09-b664-6ecf8dcd9227.lovable.app/api/public/process-email-outbox',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);

SELECT cron.schedule(
  'product-alert-digest-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--697beba0-2fc6-4d09-b664-6ecf8dcd9227.lovable.app/api/public/send-product-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);