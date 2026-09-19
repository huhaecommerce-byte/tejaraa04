import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { ShoppingBag, Heart, Clock } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
const Catalog = lazy(() => import('./Catalog'));
const Favourites = lazy(() => import('./Favourites'));
const BrowsedProducts = lazy(() => import('./BrowsedProducts'));

const TABS = ['browse', 'browsed', 'favourites'] as const;
type Tab = typeof TABS[number];

const ProductsHub = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw || '') ? (raw as Tab) : 'browse';

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === 'browse') next.delete('tab');
        else next.set('tab', v);
        setParams(next, { replace: true });
      }}
      className="w-full"
    >
      <HubTabs
        tabs={[
          { value: 'browse', icon: ShoppingBag, label: 'Browse', sub: 'All products' },
          { value: 'browsed', icon: Clock, label: 'Recently Viewed', sub: 'Last browsed' },
          { value: 'favourites', icon: Heart, label: 'Favourites', sub: 'Your saved items' },
        ]}
      />
      <TabsContent value="browse" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Catalog /></Suspense></TabsContent>
      <TabsContent value="browsed" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><BrowsedProducts /></Suspense></TabsContent>
      <TabsContent value="favourites" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Favourites /></Suspense></TabsContent>
    </Tabs>
  );
};

export default ProductsHub;
