import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SunskyEndpoint } from '@/lib/sunskyEndpoints';

export interface SunskyResponse<T = any> {
  result: 'success' | 'error';
  data?: T;
  messages?: string[];
}

export function useSunsky() {
  const [loading, setLoading] = useState(false);

  const call = useCallback(async <T = any>(
    endpoint: SunskyEndpoint,
    params: Record<string, any> = {},
    opts: { silent?: boolean } = {},
  ): Promise<SunskyResponse<T>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sunsky-proxy', {
        body: { endpoint, params },
      });
      if (error) {
        const msg = error.message || 'SunSky proxy failed';
        if (!opts.silent) toast.error(msg);
        return { result: 'error', messages: [msg] };
      }
      const resp = data as SunskyResponse<T>;
      if (resp.result === 'error' && !opts.silent) {
        toast.error((resp.messages || ['SunSky returned an error']).join(' · '));
      }
      return resp;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading };
}
