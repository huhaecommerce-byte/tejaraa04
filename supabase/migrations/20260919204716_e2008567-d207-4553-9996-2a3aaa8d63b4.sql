DROP TRIGGER IF EXISTS __probe_trigger ON auth.users;
DROP POLICY IF EXISTS "__probe_policy" ON storage.objects;
CREATE POLICY "__probe_policy" ON storage.objects FOR SELECT USING (bucket_id = '__probe');
DROP POLICY "__probe_policy" ON storage.objects;