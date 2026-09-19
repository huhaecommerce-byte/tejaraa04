import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Inbox, FileText } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
const SourcingInbox = lazy(() => import('./SourcingInbox'));
const QuotesAdmin = lazy(() => import('./QuotesAdmin'));

const ALL_TABS = [
  { value: 'sourcing', icon: Inbox, label: 'Sourcing Inbox', sub: 'Buyer requests', module: 'sourcing' as const },
  { value: 'quotes', icon: FileText, label: 'Bulk Quotes', sub: 'Volume pricing', module: 'quotes' as const },
];

const SourcingHub = () => {
  const [params, setParams] = useSearchParams();
  const { has } = useStaffPermissions();
  const visible = ALL_TABS.filter((t) => has(t.module));
  const allowed = visible.map((t) => t.value);
  const raw = params.get('tab');
  const tab = allowed.includes(raw || '') ? (raw as string) : (allowed[0] || 'sourcing');

  if (visible.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">You don't have access to any sourcing modules.</div>;
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
      {visible.some(t => t.value === 'sourcing') && <TabsContent value="sourcing" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><SourcingInbox /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'quotes') && <TabsContent value="quotes" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><QuotesAdmin /></Suspense></TabsContent>}
    </Tabs>
  );
};

export default SourcingHub;
