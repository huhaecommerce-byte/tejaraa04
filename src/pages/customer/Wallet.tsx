import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, RotateCcw, Plus,
  Send, History, TrendingUp, TrendingDown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ActionGrid } from '@/components/customer/aux/ActionGrid';
import { ListRow } from '@/components/customer/aux/ListRow';
import { CardToolbar } from '@/components/customer/CardToolbar';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';
import { Badge } from '@/components/ui/badge';
import { WalletTopupCheckout } from '@/components/customer/WalletTopupCheckout';
import { PaymentHistoryCard } from '@/components/customer/PaymentHistoryCard';

import { CheckCircle2 } from 'lucide-react';

const txnIcon: Record<string, any> = { topup: ArrowUpRight, credit: ArrowUpRight, payment: ArrowDownRight, debit: ArrowDownRight, refund: RotateCcw };

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {};
  items.forEach(t => {
    const d = new Date(t.created_at);
    const key = d.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });
    (groups[key] ||= []).push(t);
  });
  return Object.entries(groups);
}

const WalletPage = () => {
  const { user } = useAuth();
  const { getLimit, numericLimit } = useCurrentPlan();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<'amount' | 'pay' | 'done'>('amount');
  const [amount, setAmount] = useState('');
  const [payingAmount, setPayingAmount] = useState<number | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{ amount: number; balanceAfter: number | null } | null>(null);

  const creditTier = getLimit('wallet_credit');
  const creditLimit = numericLimit('credit_limit_sar');
  const topupBonus = numericLimit('wallet_topup_bonus');
  const creditLabel = creditTier === 'net_30' ? 'Net-30' : creditTier === 'net_7' ? 'Net-7' : 'Prepaid';

  const fetchTransactions = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const txns = data || [];
    setTransactions(txns);
    setBalance(txns.length > 0 ? Number(txns[0].balance_after) : 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchTransactions();
    // Realtime: refresh on any wallet change for this user
    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}`,
      }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleTopUp = () => {
    const val = Number(amount);
    if (!user?.id || !val || val <= 0) { toast.error('Enter a valid amount'); return; }
    if (val < 20 || val > 50000) { toast.error('Minimum top-up is SAR 20'); return; }
    setPayingAmount(val);
    setStep('pay');
  };

  const resetTopup = () => {
    setStep('amount');
    setPayingAmount(null);
    setVerifyingPayment(false);
    setSuccessPayload(null);
    setAmount('');
  };

  const handleTopupSuccess = (payload: { sessionId: string; amountSar: number; balanceAfter: number | null; alreadyCredited: boolean }) => {
    setSuccessPayload({ amount: payload.amountSar, balanceAfter: payload.balanceAfter });
    setStep('done');
    toast.success(`Wallet topped up: SAR ${payload.amountSar.toFixed(2)}`);
    // Refresh history immediately so the new row is visible after auto-close.
    fetchTransactions();
    setTimeout(() => {
      setDialogOpen(false);
      resetTopup();
    }, 2000);
  };

  // Stats: 30-day inflow / outflow
  const now = Date.now();
  const last30 = transactions.filter(t => now - new Date(t.created_at).getTime() < 30 * 86400_000);
  const inflow = last30.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const outflow = last30.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet balance"
        highlight="balance"
        subtitle="Top up to fund orders, labelling, and delivery."
        guide={{
          chip: 'Using store credit',
          intro: 'Top up once, spend instantly across the platform.',
          steps: [
            { title: 'Top-up', description: 'Add funds via bank transfer or online payment.' },
            { title: 'Spend', description: 'Credit auto-applies at checkout for any service.' },
            { title: 'Track', description: 'Every transaction is logged with running balance.' },
          ],
        }}
        actions={
          <>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                if (!open && verifyingPayment) return;
                setDialogOpen(open);
                if (!open) resetTopup();
              }}
            >
              <DialogTrigger asChild>
                <Button className="rounded-full"><Plus className="h-4 w-4" /> Top Up</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {step === 'done' ? 'Wallet topped up' : step === 'pay' ? 'Complete your payment' : 'Top Up Wallet'}
                  </DialogTitle>
                  <DialogDescription>
                    {step === 'done'
                      ? 'Your funds are available now.'
                      : step === 'pay'
                        ? 'Enter your card details below — you stay on this page.'
                        : 'Add funds to your wallet. Pay securely without leaving this page.'}
                  </DialogDescription>
                </DialogHeader>

                {step === 'amount' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Amount (SAR)</Label>
                      <Input type="number" min={20} max={50000} placeholder="100" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1.5" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[50, 100, 500, 1000].map(v => (
                        <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))} className="rounded-full">SAR {v}</Button>
                      ))}
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border/60 p-3 text-xs text-muted-foreground">
                      Minimum SAR 20. Funds are credited automatically once payment succeeds.
                    </div>
                    <Button className="w-full rounded-full" onClick={handleTopUp}>
                      Continue to payment — SAR {Number(amount || 0).toFixed(2)}
                    </Button>
                  </div>
                )}

                {step === 'pay' && payingAmount !== null && (
                  <div className="pt-2">
                    <WalletTopupCheckout
                      amount={payingAmount}
                      onBack={() => setStep('amount')}
                      onSuccess={handleTopupSuccess}
                      onVerifyingChange={setVerifyingPayment}
                    />
                  </div>
                )}

                {step === 'done' && (
                  <div className="py-8 text-center space-y-3">
                    <div className="aux-chip aux-chip-emerald aux-chip-lg mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Payment received</p>
                    <p className="text-xs text-muted-foreground">
                      New balance: SAR {(successPayload?.balanceAfter ?? balance).toFixed(2)}
                    </p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        }
      />

      

      {/* Plan perks ribbon */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-medium">
          Credit terms: <span className="ml-1 text-primary">{creditLabel}</span>
        </Badge>
        {creditLimit > 0 && (
          <Badge variant="outline">Credit limit: SAR {creditLimit.toLocaleString()}</Badge>
        )}
        {topupBonus > 0 && (
          <PlanFeatureChip locked={false} label={`+${topupBonus}% top-up bonus`} />
        )}
      </div>

      {/* Balance + 30d stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="aux-card aux-card-pad sm:col-span-2 md:col-span-1 bg-primary/5 border-primary/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Available Balance</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{loading ? '...' : `SAR ${balance.toFixed(2)}`}</p>
        </div>
        {[
          { label: '30d Inflow', value: `SAR ${inflow.toFixed(0)}`, icon: TrendingUp, accent: 'text-emerald-600' },
          { label: '30d Outflow', value: `SAR ${outflow.toFixed(0)}`, icon: TrendingDown, accent: 'text-amber-600' },
          { label: 'Net 30d', value: `SAR ${(inflow - outflow).toFixed(0)}`, icon: WalletIcon, accent: 'text-primary' },
        ].map((s, i) => (
          <div key={i} className="aux-card aux-card-pad">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.accent}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="mt-2 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div id="wallet-history" className="aux-card aux-card-pad">
          <CardToolbar title="Transaction History" subtitle="All wallet activity" icon={History} />
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="aux-chip aux-chip-emerald aux-chip-lg mx-auto">
                <WalletIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground">Your wallet activity will appear here</p>
              <Button size="sm" className="rounded-full" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Top Up Now</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groupByDate(transactions).map(([date, txs]) => (
                <div key={date}>
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1 px-1">{date}</p>
                  <div className="aux-divide [&>*]:py-1.5">
                    {txs.map((t: any) => {
                      const Icon = txnIcon[t.type] || ArrowUpRight;
                      const isCredit = Number(t.amount) > 0;
                      return (
                        <ListRow
                          key={t.id}
                          icon={Icon}
                          iconAccent={isCredit ? 'emerald' : 'amber'}
                          title={t.description || `Wallet ${t.type}`}
                          subtitle={new Date(t.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          pill={<span className={`aux-pill ${isCredit ? 'aux-pill-emerald' : 'aux-pill-amber'} capitalize`}>{t.type}</span>}
                          value={`${isCredit ? '+' : ''}SAR ${Math.abs(Number(t.amount)).toFixed(2)}`}
                          valueSub={`Bal: ${Number(t.balance_after).toFixed(2)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <PaymentHistoryCard />
      </div>
    </div>
  );
};

export default WalletPage;
