import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { ShoppingCart, Tag, Truck, Warehouse, Undo2 } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
const Orders = lazy(() => import('./Orders'));
const Labelling = lazy(() => import('./Labelling'));
const Delivery = lazy(() => import('./Delivery'));
const WarehouseAdmin = lazy(() => import('./WarehouseAdmin'));
const Returns = lazy(() => import('./Returns'));

const ALL_TABS = [
  { value: 'orders', icon: ShoppingCart, label: 'Orders', sub: 'Customer orders', module: 'orders' as const },
  { value: 'labelling', icon: Tag, label: 'Labelling', sub: 'Pending labels', module: 'labelling' as const },
  { value: 'delivery', icon: Truck, label: 'Delivery', sub: 'Shipments', module: 'delivery' as const },
  { value: 'warehouse', icon: Warehouse, label: 'Warehouse', sub: 'Stored stock', module: 'warehouse' as const },
  { value: 'returns', icon: Undo2, label: 'Returns', sub: 'RMA queue', module: 'returns' as const },
];

const OpsHub = () => {
  const [params, setParams] = useSearchParams();
  const { has } = useStaffPermissions();
  const visible = ALL_TABS.filter((t) => has(t.module));
  const allowed = visible.map((t) => t.value);
  const raw = params.get('tab');
  const tab = allowed.includes(raw || '') ? (raw as string) : (allowed[0] || 'orders');

  if (visible.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">You don't have access to any operations modules.</div>;
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === allowed[0]) next.delete('tab');
        else next.set('tab', v);
        setParams(next, { replace: true });
      }}
      className="w-full"
    >
      <HubTabs variant="admin" tabs={visible} />
      {visible.some(t => t.value === 'orders') && <TabsContent value="orders" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Orders /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'labelling') && <TabsContent value="labelling" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Labelling /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'delivery') && <TabsContent value="delivery" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Delivery /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'warehouse') && <TabsContent value="warehouse" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><WarehouseAdmin /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'returns') && <TabsContent value="returns" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Returns /></Suspense></TabsContent>}
    </Tabs>
  );
};

export default OpsHub;
