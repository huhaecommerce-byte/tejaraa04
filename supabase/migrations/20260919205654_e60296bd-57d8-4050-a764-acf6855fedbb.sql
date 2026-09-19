DO $$
DECLARE r record; BEGIN
  FOR r IN SELECT id, body FROM public.__import_payload ORDER BY id LOOP
    BEGIN
      EXECUTE r.body;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.__import_fail(id, err) VALUES (r.id, SQLERRM);
    END;
  END LOOP;
END $$;