import { lazy, Suspense } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Wallet as WalletIcon, FileText, Gift, BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
const Wallet = lazy(() => import('./Wallet'));
const Invoices = lazy(() => import('./Invoices'));
const Referrals = lazy(() => import('./Referrals'));
const BuyerAnalytics = lazy(() => import('./BuyerAnalytics'));

import { TabErrorBoundary } from '@/components/customer/aux/TabErrorBoundary';


const TABS = ['wallet', 'analytics', 'invoices', 'referrals'] as const;
type Tab = typeof TABS[number];

const TabBody = ({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) => (
  <>
    <Icon />
    <div className="flex flex-col leading-tight">
      <span>{label}</span>
      <span className="hidden sm:block text-xs font-normal opacity-70">{sub}</span>
    </div>
  </>
);

const BillingHub = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw || '') ? (raw as Tab) : 'wallet';

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          if (v === 'wallet') next.delete('tab');
          else next.set('tab', v);
          setParams(next, { replace: true });
        }}
        className="w-full"
      >
      <TabsList className="mb-4 flex w-full flex-wrap sm:[&>button]:flex-1">
        <TabsTrigger value="wallet"><TabBody icon={WalletIcon} label="Wallet" sub="Balance & top-ups" /></TabsTrigger>
        
        <TabsTrigger value="analytics"><TabBody icon={BarChart3} label="Analytics" sub="Spend & performance" /></TabsTrigger>
        <TabsTrigger value="invoices"><TabBody icon={FileText} label="Invoices" sub="Tax invoices" /></TabsTrigger>
        <TabsTrigger value="referrals"><TabBody icon={Gift} label="Refer & Earn" sub="Invite friends, earn 25 SAR" /></TabsTrigger>
      </TabsList>
      <TabsContent value="wallet" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><TabErrorBoundary label="Wallet"><Wallet /></TabErrorBoundary></Suspense></TabsContent>
      
      <TabsContent value="analytics" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><TabErrorBoundary label="Analytics"><BuyerAnalytics /></TabErrorBoundary></Suspense></TabsContent>
      <TabsContent value="invoices" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><TabErrorBoundary label="Invoices"><Invoices /></TabErrorBoundary></Suspense></TabsContent>
      <TabsContent value="referrals" className="mt-0"><Suspense fallback={<div className="py-16 flex justify-center text-sm text-muted-foreground">Loading…</div>}><TabErrorBoundary label="Refer & Earn"><Referrals /></TabErrorBoundary></Suspense></TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingHub;
