create table if not exists public.signup_otps (
  email text primary key,
  code text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

grant all on public.signup_otps to service_role;

alter table public.signup_otps enable row level security;