import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let cachedUrl: string | null = null;
let listeners: Set<(url: string | null) => void> = new Set();
let fetchPromise: Promise<void> | null = null;

const fetchLogo = async () => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'brand_logo_url')
      .maybeSingle();
    cachedUrl = data?.value && data.value.trim() !== '' ? data.value : null;
    listeners.forEach((cb) => cb(cachedUrl));
  })();
  return fetchPromise;
};

export function refreshBrandLogo() {
  fetchPromise = null;
  fetchLogo();
}

export function useBrandLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(cachedUrl);
  const [loading, setLoading] = useState(cachedUrl === null && !fetchPromise);

  useEffect(() => {
    listeners.add(setLogoUrl);
    fetchLogo().then(() => setLoading(false));
    return () => {
      listeners.delete(setLogoUrl);
    };
  }, []);

  return { logoUrl, loading };
}
