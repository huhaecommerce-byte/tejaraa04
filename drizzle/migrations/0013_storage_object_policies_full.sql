DO $mig$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $mig$;

CREATE POLICY "Anyone can view platform icons" ON storage.objects FOR SELECT USING (bucket_id = 'platform-icons');
CREATE POLICY "Admins can upload platform icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'platform-icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update platform icons" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'platform-icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete platform icons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'platform-icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Brand assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "Admins can upload brand assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update brand assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete brand assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Return photos publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'return-photos');
CREATE POLICY "Users upload own return photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'return-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own return photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'return-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Users view own appointment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'appointment-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Users upload own appointment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'appointment-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own appointment files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'appointment-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own appointment files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'appointment-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Users view own return photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'return-photos' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "shared_assets_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('avatars','platform-icons','brand-assets'));
CREATE POLICY "shared_assets_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('avatars','platform-icons','brand-assets'));
CREATE POLICY "shared_assets_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('avatars','platform-icons','brand-assets'));
CREATE POLICY "shared_assets_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('avatars','platform-icons','brand-assets') AND (owner = auth.uid() OR public.is_staff_or_admin(auth.uid())));
CREATE POLICY "private_files_own" ON storage.objects FOR ALL TO authenticated USING (bucket_id IN ('return-photos','appointment-files') AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff_or_admin(auth.uid()))) WITH CHECK (bucket_id IN ('return-photos','appointment-files') AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff_or_admin(auth.uid())));
CREATE POLICY "WL Suppliers upload own documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'partner-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers read own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Admins read supplier documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-documents' AND public.wl_has_role(auth.uid(), 'admin'));
CREATE POLICY "WL Suppliers upload own product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers read own product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers update own product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Suppliers delete own product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'partner-product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "WL Admins read all product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-product-images' AND public.wl_has_role(auth.uid(), 'admin'));