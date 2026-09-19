import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Plus, Search, Package, Truck, CheckCircle2, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { StatTile } from '@/components/customer/StatTile';
import { SegmentedToggle } from '@/components/customer/SegmentedToggle';
import { OrderRowCard } from '@/components/customer/OrderRowCard';

const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { limits } = useCurrentPlan();
  const [orders, setOrders] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'high' | 'low'>('newest');
  const [view, setView] = useState<'list' | 'card'>('list');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      // Link any guest (cash-on-delivery) orders placed with this email first
      try {
        await (supabase as any).rpc('claim_guest_shop_orders');
      } catch { /* non-blocking */ }

      const [{ data }, { data: shop }] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('shop_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const storeOrders = (shop || []).map((o: any) => ({
        id: o.order_ref || o.id,
        kind: 'store',
        type: `store · ${o.payment_method === 'card' ? 'card' : 'COD'}`,
        status: o.status === 'new' || !o.status ? 'pending' : o.status,
        total: o.total_sar,
        destination: [o.city, o.region].filter(Boolean).join(', '),
        tracking_number: o.tracking_number || null,
        created_at: o.created_at,
        products: (Array.isArray(o.items) ? o.items : []).map((i: any) => ({
          product_id: i.product_id,
          quantity: i.qty ?? i.quantity ?? 1,
        })),
      }));

      {
        const list = [...(data || []), ...storeOrders].sort(
          (a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at),
        );
        setOrders(list);
        // Fetch product images for thumbnails
        const ids = Array.from(
          new Set(
            list.flatMap((o: any) =>
              (Array.isArray(o.products) ? o.products : []).map((p: any) => p.product_id).filter(Boolean),
            ),
          ),
        );
        if (ids.length > 0) {
          const { data: prods } = await supabase.from('products').select('id, images').in('id', ids);
          const map: Record<string, string> = {};
          prods?.forEach((p: any) => {
            if (p.images?.[0]) map[p.id] = p.images[0];
          });
          setProductImages(map);
        }
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const orderLimit = limits.dropshipping_orders;
  const isLimited = orderLimit !== 'unlimited' && typeof orderLimit === 'number';

  // KPIs
  const kpis = useMemo(() => {
    const inTransit = orders.filter((o) =>
      ['processing', 'labelling', 'shipped'].includes(o.status),
    ).length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const deliveredMonth = orders.filter(
      (o) => o.status === 'delivered' && new Date(o.created_at) >= monthStart,
    ).length;
    const totalSpent = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + (Number(o.total) || 0), 0);
    return {
      total: orders.length,
      inTransit,
      deliveredMonth,
      totalSpent,
    };
  }, [orders]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.destination || '').toLowerCase().includes(q) ||
          (o.tracking_number || '').toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'newest') return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === 'oldest') return +new Date(a.created_at) - +new Date(b.created_at);
      if (sort === 'high') return Number(b.total) - Number(a.total);
      return Number(a.total) - Number(b.total);
    });
    return sorted;
  }, [orders, tab, search, sort]);

  const counts: Record<string, number> = TABS.reduce(
    (acc, t) => {
      acc[t] = t === 'all' ? orders.length : orders.filter((o) => o.status === t).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="My orders"
        highlight="orders"
        subtitle={
          isLimited
            ? `${orders.length} / ${orderLimit} orders this month`
            : 'Track and manage all your orders'
        }
        guide={{
          chip: 'Managing active orders',
          intro: 'Keep every active order on track in one view.',
          steps: [
            { title: 'Track', description: 'Live status updates per order, from pending to delivered.' },
            { title: 'Act', description: 'Open details to request return, message us, or re-order.' },
            { title: 'Filter', description: 'Use status tabs to focus on what needs attention now.' },
          ],
        }}
        actions={
          <Button onClick={() => navigate('/dropshipping/catalog')} className="rounded-full">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        }
      />

      {/* KPI strip - compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Total orders', value: kpis.total, icon: Package, chip: 'aux-chip-emerald' },
          { label: 'In transit', value: kpis.inTransit, icon: Truck, chip: 'aux-chip-sky' },
          { label: 'Delivered this month', value: kpis.deliveredMonth, icon: CheckCircle2, chip: 'aux-chip-emerald' },
          { label: 'Total spent (SAR)', value: kpis.totalSpent.toFixed(0), icon: Wallet, chip: 'aux-chip-amber' },
        ].map((k) => (
          <div key={k.label} className="aux-card flex items-center gap-2.5 p-3">
            <div className={`aux-chip ${k.chip} shrink-0`}>
              <k.icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight aux-num truncate">{k.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="aux-tabs overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            data-active={tab === t}
            onClick={() => setTab(t)}
            className="capitalize whitespace-nowrap"
          >
            {t} {counts[t] > 0 && <span className="ml-1 opacity-70">({counts[t]})</span>}
          </button>
        ))}
      </div>

      {/* Search + sort + view */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order # or destination…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="high">Highest total</SelectItem>
            <SelectItem value="low">Lowest total</SelectItem>
          </SelectContent>
        </Select>
        <SegmentedToggle
          options={[
            { label: 'List', value: 'list' },
            { label: 'Cards', value: 'card' },
          ]}
          value={view}
          onChange={(v) => setView(v as 'list' | 'card')}
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="aux-card aux-card-pad space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="aux-card aux-card-pad">
          <div className="text-center py-12 space-y-3">
            <div className="aux-chip aux-chip-emerald aux-chip-lg mx-auto">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">
              No orders {search ? 'match your search' : tab !== 'all' ? `with status "${tab}"` : 'yet'}
            </p>
            <p className="text-xs text-muted-foreground">Browse products to place your first order</p>
            <Button size="sm" className="rounded-full" onClick={() => navigate('/dropshipping/catalog')}>
              <Plus className="h-3.5 w-3.5" /> Browse Products
            </Button>
          </div>
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((o) => (
            <OrderRowCard key={o.id} order={o} productImages={productImages} variant="card" />
          ))}
        </div>
      ) : (
        <div className="aux-card aux-card-pad">
          <div className="aux-divide">
            {filtered.map((o) => (
              <OrderRowCard key={o.id} order={o} productImages={productImages} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
