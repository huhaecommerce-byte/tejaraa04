import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Tag, Truck } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
const Labelling = lazy(() => import('./Labelling'));
const Delivery = lazy(() => import('./Delivery'));

const TABS = ['labelling', 'delivery'] as const;
type Tab = typeof TABS[number];

const FulfillmentHub = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw || '') ? (raw as Tab) : 'labelling';

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === 'labelling') next.delete('tab');
        else next.set('tab', v);
        setParams(next, { replace: true });
      }}
      className="w-full"
    >
      <HubTabs
        tabs={[
          { value: 'labelling', icon: Tag, label: 'Labelling', sub: 'FBA/FBN labels' },
          { value: 'delivery', icon: Truck, label: 'Delivery', sub: 'Shipments & tracking' },
        ]}
      />
      <TabsContent value="labelling" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Labelling /></Suspense></TabsContent>
      <TabsContent value="delivery" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Delivery /></Suspense></TabsContent>
    </Tabs>
  );
};

export default FulfillmentHub;
