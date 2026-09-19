import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Package, Upload, Repeat, Undo2 } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
const Orders = lazy(() => import('./Orders'));
const BulkOrderImport = lazy(() => import('./BulkOrderImport'));
const OrderTemplates = lazy(() => import('./OrderTemplates'));
const Returns = lazy(() => import('./Returns'));

const TABS = ['active', 'returns', 'import', 'templates'] as const;
type Tab = typeof TABS[number];

const OrdersHub = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw || '') ? (raw as Tab) : 'active';

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === 'active') next.delete('tab');
        else next.set('tab', v);
        setParams(next, { replace: true });
      }}
      className="w-full"
    >
      <HubTabs
        tabs={[
          { value: 'active', icon: Package, label: 'Active', sub: 'In progress' },
          { value: 'returns', icon: Undo2, label: 'Returns', sub: 'RMA requests' },
          { value: 'import', icon: Upload, label: 'Bulk Import', sub: 'CSV upload' },
          { value: 'templates', icon: Repeat, label: 'Templates', sub: 'Recurring orders' },
        ]}
      />
      <TabsContent value="active" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Orders /></Suspense></TabsContent>
      <TabsContent value="import" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><BulkOrderImport /></Suspense></TabsContent>
      <TabsContent value="templates" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><OrderTemplates /></Suspense></TabsContent>
      <TabsContent value="returns" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Returns /></Suspense></TabsContent>
    </Tabs>
  );
};

export default OrdersHub;
