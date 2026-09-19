import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavourites } from '@/hooks/useFavourites';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RetailProductGrid } from '@/components/retail/listing/RetailProductGrid';

export default function AccountWishlist() {
  const { user } = useAuth();
  const { favs, loading: favLoading } = useFavourites();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || favLoading) return;
    const ids = Array.from(favs);
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    supabase.from('products').select('*').in('id', ids).then(({ data }) => {
      if (cancelled) return;
      setProducts(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id, favs, favLoading]);

  if (!loading && products.length === 0) {
    return (
      <Card className="border-dashed border-retail-border">
        <CardContent className="p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-retail-muted" />
          <p className="mt-3 text-sm font-bold text-retail-text">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-retail-muted">Tap the heart on any product to save it here.</p>
          <Button asChild className="mt-4 font-bold"><Link to="/category">Browse categories</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <RetailProductGrid
      products={products}
      loading={loading || favLoading}
      emptyTitle="Your wishlist is empty"
      emptyDescription="Tap the heart on any product to save it here."
    />
  );
}
