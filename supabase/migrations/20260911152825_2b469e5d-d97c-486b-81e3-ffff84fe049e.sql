INSERT INTO public.platform_settings (key, value)
VALUES
  ('retail_tier_enabled', 'true'),
  ('retail_tier_qty_1', '10'),
  ('retail_tier_off_1', '5'),
  ('retail_tier_qty_2', '50'),
  ('retail_tier_off_2', '10'),
  ('retail_tier_qty_3', '100'),
  ('retail_tier_off_3', '15')
ON CONFLICT (key) DO NOTHING;