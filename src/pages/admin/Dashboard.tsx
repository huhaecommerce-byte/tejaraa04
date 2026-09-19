import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, ShoppingCart, Users, Tag, Truck, TrendingUp, Activity, Package, Database, UserPlus, Sparkles } from 'lucide-react';
import { BentoGrid, BentoTile } from '@/components/layout/BentoGrid';
import { SectionRibbon } from '@/components/layout/SectionRibbon';
import { Skeleton } from '@/components/ui/skeleton';
import { LowStockWidget } from '@/components/admin/LowStockWidget';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { cn } from '@/lib/utils';

const DAY_FILTERS = [1, 3, 7, 15, 30, 60, 90];

interface CatalogStats {
  total: number;
  window_days: number;
  new_in_window: number;
  by_user: { email: string; source: string; cnt: number }[];
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, activeOrders: 0, totalCustomers: 0, pendingLabelling: 0, ordersToday: 0, deliveriesInTransit: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [labelQueue, setLabelQueue] = useState<any[]>([]);
  const [days, setDays] = useState(7);
  const [catalog, setCatalog] = useState<CatalogStats | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const loadCatalog = useCallback(async (d: number, silent = false) => {
    if (!silent) setCatalogLoading(true);
    try {
      const since = new Date(Date.now() - d * 86400_000).toISOString();
      const { data: activityRows, error: activityError } = await supabase
        .from('product_activity_daily')
        .select('activity_date,creator_email,creator_source,product_count');
      if (activityError) throw activityError;
      const total = (activityRows || []).reduce((sum, row) => sum + Number(row.product_count || 0), 0);
      const windowStart = since.slice(0, 10);

      const grouped = new Map<string, { email: string; source: string; cnt: number }>();
      let newInWindow = 0;
      for (const row of activityRows || []) {
        if (row.activity_date < windowStart) continue;
        const email = row.creator_email || 'Unknown';
        const source = row.creator_source || 'unknown';
        const count = Number(row.product_count || 0);
        newInWindow += count;
        const key = `${email}|${source}`;
        const current = grouped.get(key);
        if (current) current.cnt += count;
        else grouped.set(key, { email, source, cnt: count });
      }
      setCatalog({
        total,
        window_days: d,
        new_in_window: newInWindow,
        by_user: Array.from(grouped.values()).sort((a, b) => b.cnt - a.cnt),
      });
      setCatalogError(null);
    } catch (e: any) {
      console.error('[Dashboard] catalog stats error', e);
      setCatalogError(e?.message || 'Could not load catalog activity');
    }
    setCatalogLoading(false);
  }, []);


  useEffect(() => { loadCatalog(days); }, [days, loadCatalog]);

  // Live updates: refresh when products change, plus a slow safety poll.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => loadCatalog(days, true), 1500); // debounce bulk imports
    };
    const channel = supabase
      .channel('admin-catalog-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh)
      .subscribe();
    const poll = setInterval(() => loadCatalog(days, true), 60_000);
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [days, loadCatalog]);


  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [ordersRes, profilesRes, labelsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id'),
        supabase.from('labelling_requests').select('*').order('created_at', { ascending: false }),
      ]);
      const orders = ordersRes.data || [];
      const labels = labelsRes.data || [];
      const active = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
      const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
      const inTransit = orders.filter((o: any) => o.status === 'shipped');
      const totalRev = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
      const pendingLabels = labels.filter((l: any) => l.status === 'pending');

      setStats({
        totalRevenue: totalRev, activeOrders: active.length, totalCustomers: profilesRes.data?.length || 0,
        pendingLabelling: pendingLabels.length, ordersToday: todayOrders.length, deliveriesInTransit: inTransit.length,
      });
      setRecentOrders(orders.slice(0, 5));
      setLabelQueue(labels.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations dashboard"
        highlight="dashboard"
        subtitle="Live KPIs across orders, customers and labelling"
      />
      <BentoGrid>
        <BentoTile span={2} rowSpan={2} tone="gradient" className="overflow-hidden">
          <div className="relative h-full flex flex-col">
            <p className="text-xs text-white/80 uppercase tracking-wider">Total revenue</p>
            <p className="text-4xl md:text-5xl font-bold tracking-tight mt-2">
              SAR {loading ? '—' : stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-white/70 mt-2">{stats.ordersToday} orders today · {stats.deliveriesInTransit} in transit</p>
            <div className="mt-auto pt-6 grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-[10px] text-white/70 uppercase">Active</p>
                <p className="text-xl font-bold">{stats.activeOrders}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-[10px] text-white/70 uppercase">Customers</p>
                <p className="text-xl font-bold">{stats.totalCustomers}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-[10px] text-white/70 uppercase">Labels</p>
                <p className="text-xl font-bold">{stats.pendingLabelling}</p>
              </div>
            </div>
            <div aria-hidden className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          </div>
        </BentoTile>

        <BentoTile>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><DollarSign className="h-5 w-5" /></div>
          </div>
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : stats.ordersToday}</p>
        </BentoTile>
        <BentoTile>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center"><ShoppingCart className="h-5 w-5" /></div>
          </div>
          <p className="text-xs text-muted-foreground">Active orders</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : stats.activeOrders}</p>
        </BentoTile>
        <BentoTile>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center"><Users className="h-5 w-5" /></div>
          </div>
          <p className="text-xs text-muted-foreground">Customers</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : stats.totalCustomers}</p>
        </BentoTile>
        <BentoTile>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Truck className="h-5 w-5" /></div>
          </div>
          <p className="text-xs text-muted-foreground">In transit</p>
          <p className="text-2xl font-bold mt-1">{loading ? '—' : stats.deliveriesInTransit}</p>
        </BentoTile>
      </BentoGrid>

      <BentoGrid>
        <BentoTile span={4}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SectionRibbon icon={Database} title="Catalog Activity" tone="primary" />
            <div className="flex flex-wrap gap-1.5">
              {DAY_FILTERS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors',
                    days === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-wider font-semibold">Total products</p>
              </div>
              <p className="text-2xl font-bold mt-1.5 tabular-nums">
                {catalogLoading && !catalog ? '—' : (catalog?.total ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-emerald-500/5 p-3.5">
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-wider font-semibold">Added last {days}d</p>
              </div>
              <p className="text-2xl font-bold mt-1.5 tabular-nums text-emerald-700">
                {catalogLoading ? '—' : (catalog?.new_in_window ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-3.5 w-3.5" />
                <p className="text-[10px] uppercase tracking-wider font-semibold">Contributors</p>
              </div>
              <p className="text-2xl font-bold mt-1.5 tabular-nums">
                {catalogLoading ? '—' : (catalog?.by_user?.length ?? 0)}
              </p>
            </div>
          </div>

          {catalogError ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{catalogError}</p>
              <button onClick={() => loadCatalog(days)} className="text-xs font-semibold underline">Retry</button>
            </div>
          ) : catalogLoading && !catalog ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !catalog?.by_user?.length ? (
            <p className="text-center text-muted-foreground text-sm py-4">No products added in the last {days} days</p>
          ) : (

            <div className="divide-y divide-border/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pb-2">Added by user (last {days} days)</p>
              {catalog.by_user.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                      {u.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{u.email}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">via {u.source}</p>
                    </div>
                  </div>
                  <span className="aurora-chip bg-primary/10 text-primary font-bold tabular-nums shrink-0">{u.cnt.toLocaleString()} products</span>
                </div>
              ))}
            </div>
          )}
        </BentoTile>
      </BentoGrid>

      <BentoGrid>
        <BentoTile span={2}>
          <SectionRibbon icon={Activity} title="Recent Orders" tone="primary" />
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No orders yet</p>
          ) : (
            <div className="divide-y divide-border/40">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Package className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">#{o.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{o.customer_name} · {o.status}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums">SAR {Number(o.total).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </BentoTile>

        <BentoTile span={2}>
          <SectionRibbon icon={Tag} title="Labelling Queue" tone="amber" />
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : labelQueue.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No labelling requests</p>
          ) : (
            <div className="divide-y divide-border/40">
              {labelQueue.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Tag className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">#{l.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{l.customer_name} · {l.items_count} items</p>
                    </div>
                  </div>
                  <span className="aurora-chip bg-muted text-foreground/70 capitalize">{l.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </BentoTile>
      </BentoGrid>

      <BentoGrid>
        <LowStockWidget />
      </BentoGrid>
    </div>
  );
};

export default AdminDashboard;
