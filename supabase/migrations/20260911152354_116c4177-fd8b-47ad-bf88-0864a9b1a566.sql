INSERT INTO public.platform_settings (key, value, label)
VALUES ('product_title_lines', '3', 'Product name lines on cards')
ON CONFLICT (key) DO NOTHING;