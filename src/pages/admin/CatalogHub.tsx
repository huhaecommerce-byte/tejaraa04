import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Box, Factory, Globe, Palette } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
const Products = lazy(() => import('./Products'));
const Suppliers = lazy(() => import('./Suppliers'));
const Platforms = lazy(() => import('./Platforms'));
const LabelDesigner = lazy(() => import('./LabelDesigner'));

const ALL_TABS = [
  { value: 'products', icon: Box, label: 'Products', sub: 'Catalog items', module: 'catalog' as const },
  { value: 'suppliers', icon: Factory, label: 'Suppliers', sub: 'Supply partners', module: 'suppliers' as const },
  { value: 'platforms', icon: Globe, label: 'Platforms', sub: 'Marketplace logos', module: 'platforms' as const },
  { value: 'designer', icon: Palette, label: 'Label Designer', sub: 'Design templates', module: 'label-designer' as const },
];

const CatalogHub = () => {
  const [params, setParams] = useSearchParams();
  const { has } = useStaffPermissions();
  const visible = ALL_TABS.filter((t) => has(t.module));
  const allowed = visible.map((t) => t.value);
  const raw = params.get('tab');
  const tab = allowed.includes(raw || '') ? (raw as string) : (allowed[0] || 'products');

  if (visible.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">You don't have access to any catalog modules.</div>;
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
      {visible.some(t => t.value === 'products') && <TabsContent value="products" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Products /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'suppliers') && <TabsContent value="suppliers" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Suppliers /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'platforms') && <TabsContent value="platforms" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><Platforms /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'designer') && <TabsContent value="designer" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><LabelDesigner /></Suspense></TabsContent>}
    </Tabs>
  );
};

export default CatalogHub;
