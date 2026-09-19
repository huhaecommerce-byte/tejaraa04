import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Search, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
const SourcingRequests = lazy(() => import('./SourcingRequests'));
const QuoteRequests = lazy(() => import('./QuoteRequests'));

const TABS = ['requests', 'quotes'] as const;
type Tab = typeof TABS[number];

const SourcingHub = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw || '') ? (raw as Tab) : 'requests';

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === 'requests') next.delete('tab');
        else next.set('tab', v);
        setParams(next, { replace: true });
      }}
      className="w-full"
    >
      <HubTabs
        tabs={[
          { value: 'requests', icon: Search, label: 'Sourcing Requests', sub: 'Find new products' },
          { value: 'quotes', icon: MessageSquare, label: 'Bulk Quotes', sub: 'Volume pricing' },
        ]}
      />
      <TabsContent value="requests" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><SourcingRequests /></Suspense></TabsContent>
      <TabsContent value="quotes" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><QuoteRequests /></Suspense></TabsContent>
    </Tabs>
  );
};

export default SourcingHub;
