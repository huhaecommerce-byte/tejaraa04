import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'return-photos';

/** Accepts either a stored path or a legacy public URL and returns the object path. */
export function returnPhotoPath(value: string): string {
  if (!value) return '';
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return value.replace(/^\/+/, '');
  return value.slice(idx + marker.length).split('?')[0];
}

/** Return photos live in a private bucket, so they must be viewed through a signed URL. */
export function useReturnPhotoUrl(value: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = returnPhotoPath(value);
    if (!path) { setUrl(null); return; }
    supabase.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [value]);

  return url;
}
