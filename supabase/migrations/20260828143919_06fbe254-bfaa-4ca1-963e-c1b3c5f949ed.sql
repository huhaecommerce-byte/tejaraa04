ALTER TABLE public.homepage_hero_settings
  ADD COLUMN IF NOT EXISTS enabled_desktop boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enabled_mobile boolean NOT NULL DEFAULT true;