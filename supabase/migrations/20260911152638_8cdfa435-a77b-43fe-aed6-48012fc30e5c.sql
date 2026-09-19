INSERT INTO public.platform_settings (key, value)
VALUES
  ('products_per_row_mobile', '2'),
  ('products_per_row_tablet', '3'),
  ('products_per_row_desktop', '5')
ON CONFLICT (key) DO NOTHING;