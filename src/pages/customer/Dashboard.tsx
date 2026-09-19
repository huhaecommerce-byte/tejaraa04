import { useState, useEffect } from 'react';
import { Link } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart, Truck, TrendingUp, Activity, Package, Sparkles,
  ShoppingBag, Plus, BarChart3, PieChart as PieIcon, Star, Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingChecklist } from '@/components/customer/OnboardingChecklist';
import { QuickActions } from '@/components/customer/QuickActions';
import { ActivityFeed } from '@/components/customer/ActivityFeed';
import { SpendingDonut } from '@/components/customer/SpendingDonut';
import { TopProductsWidget } from '@/components/customer/TopProductsWidget';
import { OrderStatusBreakdown } from '@/components/customer/OrderStatusBreakdown';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ balance: 0, orders: 0, pending: 0, delivered: 0, monthSpend: 0 });
  const [activity, setActivity] = useState<{ name: string; orders: number; spend: number }[]>([]);
  const [chartMode, setChartMode] = useState<'orders' | 'spend'>('orders');

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const [w, o] = await Promise.all([
        supabase.from('wallet_transactions').select('balance_after').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('orders').select('id, status, total, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      const orders = o.data || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthSpend = orders
        .filter((x: any) => x.created_at >= monthStart)
        .reduce((s: number, x: any) => s + Number(x.total), 0);

      setStats({
        balance: Number(w.data?.[0]?.balance_after ?? 0),
        orders: orders.length,
        pending: orders.filter((x: any) => !['delivered', 'cancelled'].includes(x.status)).length,
        delivered: orders.filter((x: any) => x.status === 'delivered').length,
        monthSpend,
      });

      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        const key = d.toISOString().slice(0, 10);
        const dayOrders = orders.filter((x: any) => x.created_at.slice(0, 10) === key);
        return {
          name: d.toLocaleDateString('en', { day: 'numeric', month: 'short' }),
          orders: dayOrders.length,
          spend: dayOrders.reduce((s: number, x: any) => s + Number(x.total), 0),
        };
      });
      setActivity(days);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel(`dash-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div className="space-y-6">
      <OnboardingChecklist />

      {/* Row 1: Hero + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Hero card */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(152_55%_28%)] via-[hsl(152_50%_22%)] to-[hsl(160_40%_16%)] text-white p-6 md:p-8">
          <div className="relative z-10 flex flex-col h-full min-h-[180px]">
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> {greeting}, {user?.name?.split(' ')[0] || 'there'}
            </div>
            <div className="mt-3">
              <p className="text-xs text-white/60 uppercase tracking-wider">Wallet balance</p>
              <p className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
                SAR {loading ? '—' : stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-white/60 mt-2">
                {stats.orders} orders · {stats.delivered} delivered · SAR {stats.monthSpend.toLocaleString()} this month
              </p>
              {!loading && stats.orders === 0 && stats.balance > 0 && (
                <div className="mt-3 inline-flex items-start gap-2 rounded-xl bg-white/10 ring-1 ring-white/20 px-3 py-2 max-w-md">
                  <Sparkles className="h-4 w-4 mt-0.5 text-amber-300 flex-shrink-0" />
                  <p className="text-xs text-white/90 leading-relaxed">
                    <span className="font-semibold">
                      SAR {stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} welcome credit is yours
                    </span>{' '}
                    — and your first order ships free. Pick any product and check out with your credit, no card needed.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-auto pt-6 flex flex-wrap gap-2">
              <Link to="/dropshipping/catalog" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary bg-white hover:bg-white/90 transition shadow-lg">
                <Inbox className="h-4 w-4" /> Browse Products
              </Link>
              <Link to="/dropshipping/billing?tab=wallet" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[hsl(152_55%_15%)] bg-gradient-to-r from-[hsl(45_90%_60%)] to-[hsl(38_90%_55%)] hover:brightness-105 shadow-[0_6px_20px_-6px_hsl(45_90%_50%/0.55)] transition">
                <Plus className="h-4 w-4" /> Top Up
              </Link>
            </div>
          </div>
          <div aria-hidden className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -right-8 bottom-4 w-24 h-24 rounded-full bg-amber-300/20 blur-xl" />
        </div>

        {/* Stat cards column */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {[
            { label: 'Active Orders', value: stats.pending, icon: ShoppingCart, accent: 'hsl(152 60% 92%)', text: 'hsl(152 69% 28%)' },
            { label: 'Delivered', value: stats.delivered, icon: Truck, accent: 'hsl(45 90% 92%)', text: 'hsl(38 85% 38%)' },
            { label: 'Month Spend', value: `SAR ${Math.round(stats.monthSpend).toLocaleString()}`, icon: TrendingUp, accent: 'hsl(210 80% 92%)', text: 'hsl(210 70% 38%)' },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.accent, color: s.text }}>
                  <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5 truncate">{loading ? '—' : s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Row 2: Quick Actions */}
      <QuickActions />

      {/* Row 3: Smart Widgets — 2 per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" /> Spending Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent><SpendingDonut /></CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Top Products
            </CardTitle>
          </CardHeader>
          <CardContent><TopProductsWidget /></CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Order Status
            </CardTitle>
          </CardHeader>
          <CardContent><OrderStatusBreakdown /></CardContent>
        </Card>

        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Order Activity
            </CardTitle>
            <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as any)}>
              <TabsList className="h-7">
                <TabsTrigger value="orders" className="text-xs px-2 h-5">Orders</TabsTrigger>
                <TabsTrigger value="spend" className="text-xs px-2 h-5">Spending</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity}>
                    <defs>
                      <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152 69% 31%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(152 69% 31%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval={Math.floor(activity.length / 6)}
                    />
                    <YAxis hide />
                    <ReTooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                      formatter={(v: number) => chartMode === 'spend' ? `SAR ${v.toLocaleString()}` : v}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartMode === 'spend' ? 'spend' : 'orders'}
                      stroke="hsl(152 69% 31%)"
                      strokeWidth={2}
                      fill="url(#dashGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Activity Feed — full width */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
