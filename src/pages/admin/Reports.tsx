import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, ShoppingCart, Users, Package, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';

const RANGE_DAYS: Record<string, number> = { '7': 7, '30': 30, '90': 90, '365': 365 };
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [o, p, pr] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name, email, created_at'),
        supabase.from('products').select('id, name, sku'),
      ]);
      setOrders(o.data || []);
      setProfiles(p.data || []);
      setProducts(pr.data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const days = RANGE_DAYS[range];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, range]);

  // GMV / orders per day
  const dailySeries = useMemo(() => {
    const days = RANGE_DAYS[range];
    const map = new Map<string, { date: string; gmv: number; orders: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      map.set(k, { date: k.slice(5), gmv: 0, orders: 0 });
    }
    filtered.forEach((o) => {
      const k = new Date(o.created_at).toISOString().slice(0, 10);
      const row = map.get(k);
      if (row) { row.gmv += Number(o.total) || 0; row.orders += 1; }
    });
    return Array.from(map.values());
  }, [filtered, range]);

  const totals = useMemo(() => {
    const gmv = filtered.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const aov = filtered.length ? gmv / filtered.length : 0;
    const customers = new Set(filtered.map((o) => o.user_id)).size;
    return { gmv, count: filtered.length, aov, customers };
  }, [filtered]);

  // Top products
  const topProducts = useMemo(() => {
    const tally = new Map<string, { id: string; name: string; qty: number; revenue: number }>();
    filtered.forEach((o) => {
      const items = Array.isArray(o.products) ? o.products : [];
      items.forEach((it: any) => {
        const id = it.product_id || it.sku || it.name || 'unknown';
        const name = it.name || products.find((p) => p.id === it.product_id)?.name || 'Unknown';
        const cur = tally.get(id) || { id, name, qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity) || 0;
        cur.revenue += (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
        tally.set(id, cur);
      });
    });
    return Array.from(tally.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filtered, products]);

  // Top customers
  const topCustomers = useMemo(() => {
    const tally = new Map<string, { user_id: string; total: number; orders: number }>();
    filtered.forEach((o) => {
      const cur = tally.get(o.user_id) || { user_id: o.user_id, total: 0, orders: 0 };
      cur.total += Number(o.total) || 0; cur.orders += 1;
      tally.set(o.user_id, cur);
    });
    return Array.from(tally.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((c) => {
        const prof = profiles.find((p) => p.user_id === c.user_id);
        return { ...c, name: prof?.display_name || prof?.email || 'Unknown', email: prof?.email };
      });
  }, [filtered, profiles]);


  // Order status breakdown
  const statusDist = useMemo(() => {
    const tally = new Map<string, number>();
    filtered.forEach((o) => tally.set(o.status, (tally.get(o.status) || 0) + 1));
    return Array.from(tally.entries()).map(([status, count]) => ({ status, count }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PageHeader title="Reports & Analytics" subtitle="Business performance, top performers, and plan distribution" />
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="GMV" value={`SAR ${totals.gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} tone="emerald" loading={loading} />
        <Kpi label="Orders" value={totals.count.toString()} icon={ShoppingCart} tone="sky" loading={loading} />
        <Kpi label="Avg order value" value={`SAR ${totals.aov.toFixed(0)}`} icon={TrendingUp} tone="violet" loading={loading} />
        <Kpi label="Active buyers" value={totals.customers.toString()} icon={Users} tone="amber" loading={loading} />
      </div>

      {/* GMV chart */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/60">
        <CardHeader><CardTitle className="text-base">Gross merchandise value</CardTitle></CardHeader>
        <CardContent className="h-72">
          {loading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySeries}>
                <defs>
                  <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v: any) => `SAR ${Number(v).toLocaleString()}`} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gmvFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Orders per day */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/60">
        <CardHeader><CardTitle className="text-base">Orders per day</CardTitle></CardHeader>
        <CardContent className="h-64">
          {loading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top products + top customers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-border/60">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Top 10 products</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No product sales in this range</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">{p.qty} sold</Badge>
                    <span className="font-bold tabular-nums w-24 text-right">SAR {p.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border/60">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Top 10 customers</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No customer activity in this range</p>
            ) : (
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <a key={c.user_id} href={`/admin/customers/${c.user_id}`} className="flex items-center gap-3 text-sm hover:bg-muted/40 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.orders} orders</Badge>
                    <span className="font-bold tabular-nums w-24 text-right">SAR {c.total.toFixed(0)}</span>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order status */}
      <div className="grid gap-4">


        <Card className="bg-card/80 backdrop-blur-sm border-border/60">
          <CardHeader><CardTitle className="text-base">Order status breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : statusDist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders in this range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDist} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const TONES: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
};

function Kpi({ label, value, icon: Icon, tone, loading }: any) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${TONES[tone]}`}><Icon className="h-4 w-4" /></span>
        </div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold mt-0.5 truncate">{loading ? '—' : value}</p>
      </CardContent>
    </Card>
  );
}

export default Reports;
