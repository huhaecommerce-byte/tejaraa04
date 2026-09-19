DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_referral ON auth.users;
CREATE TRIGGER on_auth_user_referral
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_referral_for_new_user();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['platform_settings','ticket_messages','tickets','sourcing_requests','quote_requests','request_messages','notifications','staff_permissions','user_roles','wallet_transactions','webhook_events','payment_events','sunsky_import_jobs'] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t)
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Anyone can view platform icons" ON storage.objects;
CREATE POLICY "Anyone can view platform icons" ON storage.objects FOR SELECT USING (bucket_id = 'platform-icons');
DROP POLICY IF EXISTS "Admins can upload platform icons" ON storage.objects;
CREATE POLICY "Admins can upload platform icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'platform-icons' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update platform icons" ON storage.objects;
CREATE POLICY "Admins can update platform icons" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'platform-icons' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete platform icons" ON storage.objects;
CREATE POLICY "Admins can delete platform icons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'platform-icons' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Brand assets are publicly accessible" ON storage.objects;
CREATE POLICY "Brand assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
DROP POLICY IF EXISTS "Admins can upload brand assets" ON storage.objects;
CREATE POLICY "Admins can upload brand assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can update brand assets" ON storage.objects;
CREATE POLICY "Admins can update brand assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can delete brand assets" ON storage.objects;
CREATE POLICY "Admins can delete brand assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Return photos publicly viewable" ON storage.objects;
CREATE POLICY "Return photos publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'return-photos');
DROP POLICY IF EXISTS "Users upload own return photos" ON storage.objects;
CREATE POLICY "Users upload own return photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'return-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users delete own return photos" ON storage.objects;
CREATE POLICY "Users delete own return photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'return-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Users view own appointment files" ON storage.objects;
CREATE POLICY "Users view own appointment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'appointment-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));
DROP POLICY IF EXISTS "Users upload own appointment files" ON storage.objects;
CREATE POLICY "Users upload own appointment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'appointment-files' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users update own appointment files" ON storage.objects;
CREATE POLICY "Users update own appointment files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'appointment-files' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users delete own appointment files" ON storage.objects;
CREATE POLICY "Users delete own appointment files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'appointment-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.tablename);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', r.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tablename);
  END LOOP;
  FOR r IN SELECT viewname FROM pg_views WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated, service_role', r.viewname);
  END LOOP;
END $$;