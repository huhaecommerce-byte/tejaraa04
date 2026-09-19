CREATE POLICY "shared_assets_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('avatars','platform-icons','brand-assets'));

CREATE POLICY "shared_assets_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('avatars','platform-icons','brand-assets'));

CREATE POLICY "shared_assets_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('avatars','platform-icons','brand-assets'));

CREATE POLICY "shared_assets_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('avatars','platform-icons','brand-assets') AND (owner = auth.uid() OR public.is_staff_or_admin(auth.uid())));

CREATE POLICY "private_files_own" ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('return-photos','appointment-files')
       AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff_or_admin(auth.uid())))
WITH CHECK (bucket_id IN ('return-photos','appointment-files')
       AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff_or_admin(auth.uid())));
