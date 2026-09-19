ALTER TABLE public.shopify_connections
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS client_secret_ciphertext text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;