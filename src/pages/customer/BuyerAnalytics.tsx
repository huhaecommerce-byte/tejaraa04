import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, ShoppingBag, Target, Package, BarChart3, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';

const BuyerAnalytics = () => {
  const { user } = useAuth();
  const { getLimit, hasFeature } = useCurrentPlan();
  const dashboardTier = getLimit('buyer_dashboard') || 'basic'; // basic | full | cohorts
  const canExport = hasFeature('reports_export');
  const isFull = dashboardTier === 'full' || dashboardTier === 'cohorts';
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [sourcing, setSourcing] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const [o, q, s] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('quote_requests').select('status').eq('user_id', user.id),
        supabase.from('sourcing_requests').select('status').eq('user_id', user.id),
      ]);
      setOrders(o.data || []);
      setQuotes(q.data || []);
      setSourcing(s.data || []);
      setLoading(false);
    })();
  }, [user?.id]);

  const stats = useMemo(() => {
    const totalSpend = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const delivered = orders.filter(o => o.status === 'delivered');
    const aov = orders.length > 0 ? totalSpend / orders.length : 0;
    const slaHit = delivered.length > 0
      ? (delivered.filter((o: any) => {
          const created = new Date(o.created_at).getTime();
          const updated = new Date(o.updated_at).getTime();
          return updated - created <= 7 * 24 * 60 * 60 * 1000;
        }).length / delivered.length) * 100
      : 0;
    const allReqs = quotes.length + sourcing.length;
    const wonReqs = quotes.filter(q => ['quoted', 'accepted', 'completed'].includes(q.status)).length
                  + sourcing.filter(s => ['quoted', 'sourced', 'completed'].includes(s.status)).length;
    const winRate = allReqs > 0 ? (wonReqs / allReqs) * 100 : 0;

    // Monthly spend (last 6 months)
    const monthly: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const k = d.toLocaleString('en', { month: 'short' });
      monthly[k] = 0;
    }
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const months = (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
      if (months < 6 && months >= 0) {
        const k = d.toLocaleString('en', { month: 'short' });
        if (k in monthly) monthly[k] += Number(o.total || 0);
      }
    });
    const monthlyData = Object.entries(monthly).map(([name, v]) => ({ name, v }));

    // Top categories
    const catMap: Record<string, number> = {};
    orders.forEach(o => {
      const products = Array.isArray(o.products) ? o.products : [];
      products.forEach((p: any) => {
        const cat = p.tier || o.type || 'Other';
        catMap[cat] = (catMap[cat] || 0) + Number(p.quantity || 1);
      });
    });
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalSpend, aov, slaHit, winRate, monthlyData, topCategories, deliveredCount: delivered.length };
  }, [orders, quotes, sourcing]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Buyer analytics" highlight="analytics" subtitle="Spend, performance & sourcing insights" />
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );
  }

  const tiles = [
    { label: 'Total spend', value: `SAR ${stats.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, tone: 'primary' },
    { label: 'Orders placed', value: orders.length, icon: ShoppingBag, tone: 'accent' },
    { label: 'Avg order value', value: `SAR ${stats.aov.toFixed(0)}`, icon: TrendingUp, tone: 'emerald' },
    { label: 'On-time delivery', value: `${stats.slaHit.toFixed(0)}%`, icon: Package, tone: 'amber' },
    { label: 'Sourcing win rate', value: `${stats.winRate.toFixed(0)}%`, icon: Target, tone: 'primary' },
    { label: 'Delivered orders', value: stats.deliveredCount, icon: BarChart3, tone: 'emerald' },
  ];

  const toneClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };

  const exportCsv = () => {
    if (!canExport) return;
    const rows = ['Date,Total,Status', ...orders.map(o => `${new Date(o.created_at).toISOString().slice(0,10)},${o.total},${o.status}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `buyer-orders-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyer analytics"
        highlight="analytics"
        subtitle="Spend, performance & sourcing insights"
        actions={
          <>
            {canExport ? (
              <Button size="sm" variant="outline" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
              </Button>
            ) : (
              <PlanFeatureChip label="CSV export — upgrade" />
            )}
            {!isFull && <PlanFeatureChip label="Full dashboard — upgrade" />}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map(t => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${toneClasses[t.tone]} flex items-center justify-center mb-2`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{t.label}</p>
                <p className="text-xl md:text-2xl font-bold mt-1 tabular-nums">{t.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Spend — last 6 months</h3>
              <span className="text-[11px] text-muted-foreground">SAR</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                    {stats.monthlyData.map((_, i) => (
                      <Cell key={i} fill={i === stats.monthlyData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Top order types</h3>
            {stats.topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-2.5">
                {stats.topCategories.map(([name, count], i) => {
                  const max = stats.topCategories[0][1];
                  const pct = (count / max) * 100;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium capitalize truncate">{name}</span>
                        <span className="text-muted-foreground tabular-nums">{count} units</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${pct}%`, transitionDelay: `${i * 80}ms` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
