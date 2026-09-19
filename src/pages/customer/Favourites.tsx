import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavourites } from '@/hooks/useFavourites';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { ProductCard, type ProductData } from '@/components/storefront/ProductCard';

import { EmptyState, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import UpgradePrompt from '@/components/UpgradePrompt';

const PAGE_SIZE = 20;

const Favourites = () => {
  const { user } = useAuth();
  const { favs, loading: favLoading } = useFavourites();
  const { numericLimit, planName } = useCurrentPlan();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const favLimit = numericLimit('favourites_max');
  const showLimitChip = favLimit > 0 && favLimit !== Infinity;

  useEffect(() => {
    if (!user?.id || favLoading) return;
    const ids = Array.from(favs);
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    supabase.from('products').select('*').in('id', ids).then(({ data }) => {
      setProducts((data || []) as unknown as ProductData[]);
      setLoading(false);
    });
  }, [user?.id, favs, favLoading]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My favourites"
        highlight="favourites"
        subtitle="Quick access to products you've saved"
        guide={{
          chip: 'How favourites work',
          intro: 'Save products once, re-order them in seconds.',
          steps: [
            { title: 'Save', description: 'Tap the heart on any product card to add it here.' },
            { title: 'Reorder fast', description: 'Open from this list anytime to skip the search.' },
            { title: 'Stay organised', description: 'Remove items you no longer need to keep it tidy.' },
          ],
        }}
      />

      {showLimitChip && (
        <div className="flex justify-end">
          <UpgradePrompt
            variant="chip"
            usage={favs.size}
            limit={favLimit}
            limitLabel="favourites"
            message={favs.size >= favLimit ? `Limit reached on ${planName}` : undefined}
          />
        </div>
      )}

      {loading || favLoading ? (
        <div className="product-grid gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8 text-muted-foreground" />}
          title="No favourites yet"
          description="Tap the heart icon on any product to save it here for quick access."
        />
      ) : (
        <>
          <div className="product-grid gap-4">
            {products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {Math.ceil(products.length / PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of {Math.ceil(products.length / PAGE_SIZE)}
              </span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(products.length / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favourites;
