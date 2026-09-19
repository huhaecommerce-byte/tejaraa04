import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Simple shared store so all FavouriteButtons stay in sync
let cache = new Set<string>();
const listeners = new Set<(s: Set<string>) => void>();
let loadedFor: string | null = null;

function emit() {
  const snap = new Set(cache);
  listeners.forEach((l) => l(snap));
}

export function useFavourites() {
  const { user } = useAuth();
  const [favs, setFavs] = useState<Set<string>>(cache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listeners.add(setFavs);
    return () => { listeners.delete(setFavs); };
  }, []);

  useEffect(() => {
    if (!user?.id) { cache = new Set(); loadedFor = null; emit(); setLoading(false); return; }
    if (loadedFor === user.id) { setLoading(false); return; }
    loadedFor = user.id;
    setLoading(true);
    supabase.from('favourites').select('product_id').eq('user_id', user.id).then(({ data }) => {
      cache = new Set((data || []).map((r: any) => r.product_id));
      emit();
      setLoading(false);
    });
  }, [user?.id]);

  const isFavourite = useCallback((productId: string) => favs.has(productId), [favs]);

  const toggle = useCallback(async (productId: string) => {
    if (!user?.id) return false;
    if (cache.has(productId)) {
      cache.delete(productId); emit();
      await supabase.from('favourites').delete().eq('user_id', user.id).eq('product_id', productId);
      return false;
    } else {
      cache.add(productId); emit();
      await supabase.from('favourites').insert({ user_id: user.id, product_id: productId });
      return true;
    }
  }, [user?.id]);

  return { favs, isFavourite, toggle, loading };
}
