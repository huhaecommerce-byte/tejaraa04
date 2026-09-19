CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'product-alert-digest-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--19d26c1b-de3e-4f1c-a813-24a48fbac621.lovable.app/api/public/send-product-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);

SELECT cron.schedule(
  'process-email-outbox-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--19d26c1b-de3e-4f1c-a813-24a48fbac621.lovable.app/api/public/process-email-outbox',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);