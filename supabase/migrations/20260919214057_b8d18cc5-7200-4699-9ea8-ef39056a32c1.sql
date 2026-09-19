SELECT cron.schedule(
  'agency-approve-due-commissions-daily',
  '20 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--c1c68af0-1656-47dd-8c89-807ec1dfb541.lovable.app/api/public/approve-agency-commissions',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);