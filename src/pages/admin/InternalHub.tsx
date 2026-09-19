import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { CreditCard, Tag, LayoutGrid, MessageSquare, ScrollText, Settings, Receipt } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { HubTabs } from '@/components/layout/HubTabs';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

const PromoCodes = lazy(() => import('./PromoCodes'));
const HomepageSections = lazy(() => import('./HomepageSections'));
const ContactAdmin = lazy(() => import('./ContactAdmin'));
const AuditLog = lazy(() => import('./AuditLog'));
const SettingsAdmin = lazy(() => import('./Settings'));
import { PaymentEventsTable } from '@/components/admin/PaymentEventsTable';

const ALL_TABS = [
  
  { value: 'payments', icon: Receipt, label: 'Payments', sub: 'Live events & health', module: 'pricing' as const },
  { value: 'promo', icon: Tag, label: 'Promo Codes', sub: 'Discounts', module: 'promo' as const },
  { value: 'homepage', icon: LayoutGrid, label: 'Homepage', sub: 'Public layout', module: 'homepage' as const },
  { value: 'contact', icon: MessageSquare, label: 'Contact', sub: 'Public info', module: 'contact' as const },
  { value: 'audit', icon: ScrollText, label: 'Audit Log', sub: 'Change history', module: 'audit' as const },
  { value: 'settings', icon: Settings, label: 'Settings', sub: 'System config', module: 'settings' as const },
];

const InternalHub = () => {
  const [params, setParams] = useSearchParams();
  const { has } = useStaffPermissions();
  const visible = ALL_TABS.filter((t) => has(t.module));
  const allowed = visible.map((t) => t.value);
  const raw = params.get('tab');
  const tab = allowed.includes(raw || '') ? (raw as string) : (allowed[0] || 'pricing');

  if (visible.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">You don't have access to any internal modules.</div>;
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
      
      {visible.some(t => t.value === 'payments') && <TabsContent value="payments" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><PaymentEventsTable /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'promo') && <TabsContent value="promo" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><PromoCodes /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'homepage') && <TabsContent value="homepage" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><HomepageSections /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'contact') && <TabsContent value="contact" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><ContactAdmin /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'audit') && <TabsContent value="audit" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><AuditLog /></Suspense></TabsContent>}
      {visible.some(t => t.value === 'settings') && <TabsContent value="settings" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><SettingsAdmin /></Suspense></TabsContent>}
    </Tabs>
  );
};

export default InternalHub;
