import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavourites } from '@/hooks/useFavourites';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RetailProductGrid } from '@/components/retail/listing/RetailProductGrid';
import { useLocale } from '@/i18n/LocaleProvider';

export default function AccountWishlist() {
  const { t } = useLocale();
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
          <p className="mt-3 text-sm font-bold text-retail-text">{t('shopx.account.wishlistEmptyTitle')}</p>
          <p className="mt-1 text-sm text-retail-muted">{t('shopx.account.wishlistEmptyDescription')}</p>
          <Button asChild className="mt-4 font-bold"><Link to="/category">{t('shopx.account.browseCategories')}</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <RetailProductGrid
      products={products}
      loading={loading || favLoading}
      emptyTitle={t('shopx.account.wishlistEmptyTitle')}
      emptyDescription={t('shopx.account.wishlistEmptyDescription')}
    />
  );
}
