ALTER TABLE public.noon_connections ADD COLUMN IF NOT EXISTS webhook_secret_hash text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS noon_connections_webhook_secret_hash_idx ON public.noon_connections (webhook_secret_hash) WHERE webhook_secret_hash <> '';
