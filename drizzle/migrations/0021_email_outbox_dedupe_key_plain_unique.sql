drop index if exists public.email_outbox_dedupe_key_key;
create unique index if not exists email_outbox_dedupe_key_uidx on public.email_outbox (dedupe_key);