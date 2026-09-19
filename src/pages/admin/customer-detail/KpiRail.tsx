import { Card } from '@/components/ui/card';
import { LucideIcon, ShoppingCart, Wallet, Package, MessageSquare, TrendingUp, TrendingDown, Calendar, Repeat, Coins } from 'lucide-react';

export type KpiTile = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  spark: number[];
  deltaPct?: number; // +12 / -3 / null
  accent?: string; // text color class
};

function Sparkline({ data, accent = 'stroke-primary' }: { data: number[]; accent?: string }) {
  if (!data || data.length < 2) return <div className="h-7" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" strokeWidth={1.5} className={accent} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tile({ tile }: { tile: KpiTile }) {
  const Icon = tile.icon;
  const positive = (tile.deltaPct ?? 0) >= 0;
  const showDelta = tile.deltaPct !== undefined && tile.deltaPct !== null;
  return (
    <Card className="p-3 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
            <Icon className="h-3 w-3" />
            <span className="truncate">{tile.label}</span>
          </div>
          <p className="text-lg font-bold mt-1 truncate tabular-nums">{tile.value}</p>
          {showDelta && (
            <div className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-0.5 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {positive ? '+' : ''}{tile.deltaPct}%
            </div>
          )}
        </div>
        <div className="opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
          <Sparkline data={tile.spark} accent={tile.accent || 'stroke-primary'} />
        </div>
      </div>
    </Card>
  );
}

interface Props {
  orders: any[];
  wallet: any[];
  inventory: any[];
  tickets: any[];
}

function bucketByDay(items: any[], days: number, valueFn: (i: any) => number): number[] {
  const now = Date.now();
  const dayMs = 86400000;
  const buckets = new Array(days).fill(0);
  for (const it of items) {
    const ts = new Date(it.created_at).getTime();
    const idx = Math.floor((now - ts) / dayMs);
    if (idx >= 0 && idx < days) buckets[days - 1 - idx] += valueFn(it);
  }
  return buckets;
}

function deltaPct(curr: number, prev: number): number | undefined {
  if (prev === 0 && curr === 0) return undefined;
  if (prev === 0) return 100;
  return Math.round(((curr - prev) / prev) * 100);
}

export function KpiRail({ orders, wallet, inventory, tickets }: Props) {
  const lifetime = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const aov = orders.length ? lifetime / orders.length : 0;
  const balance = wallet[0]?.balance_after !== undefined ? Number(wallet[0].balance_after) : 0;
  const stored = inventory.reduce((s, i) => s + (Number(i.qty_on_hand) || 0), 0);
  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;

  const lastOrderTs = orders[0]?.created_at ? new Date(orders[0].created_at).getTime() : null;
  const daysSinceLast = lastOrderTs ? Math.floor((Date.now() - lastOrderTs) / 86400000) : null;

  // Repeat rate = % of customers (here % of orders that are repeat = (orders - 1)/orders... use orders > 1)
  const repeatRate = orders.length > 1
    ? Math.round(((orders.length - 1) / orders.length) * 100)
    : 0;

  // Sparklines (last 14 days)
  const spendDaily = bucketByDay(orders, 14, o => Number(o.total) || 0);
  const orderDaily = bucketByDay(orders, 14, () => 1);
  const walletDaily = bucketByDay(wallet, 14, w => Number(w.amount) || 0);
  const ticketDaily = bucketByDay(tickets, 14, () => 1);

  const sumLast7 = (a: number[]) => a.slice(7).reduce((s, x) => s + x, 0);
  const sumPrev7 = (a: number[]) => a.slice(0, 7).reduce((s, x) => s + x, 0);

  const tiles: KpiTile[] = [
    { key: 'lifetime', label: 'Lifetime spend', value: `SAR ${lifetime.toFixed(0)}`, icon: Coins, spark: spendDaily, deltaPct: deltaPct(sumLast7(spendDaily), sumPrev7(spendDaily)), accent: 'stroke-emerald-500' },
    { key: 'orders', label: 'Orders', value: orders.length.toString(), icon: ShoppingCart, spark: orderDaily, deltaPct: deltaPct(sumLast7(orderDaily), sumPrev7(orderDaily)), accent: 'stroke-primary' },
    { key: 'aov', label: 'Avg order', value: `SAR ${aov.toFixed(0)}`, icon: TrendingUp, spark: spendDaily.map((v, i) => orderDaily[i] ? v / orderDaily[i] : 0), accent: 'stroke-violet-500' },
    { key: 'wallet', label: 'Wallet', value: `SAR ${balance.toFixed(0)}`, icon: Wallet, spark: walletDaily, accent: balance < 0 ? 'stroke-rose-500' : 'stroke-amber-500' },
    { key: 'stored', label: 'Stored units', value: stored.toString(), icon: Package, spark: new Array(14).fill(stored / 14), accent: 'stroke-sky-500' },
    { key: 'tickets', label: 'Open tickets', value: openTickets.toString(), icon: MessageSquare, spark: ticketDaily, deltaPct: deltaPct(sumLast7(ticketDaily), sumPrev7(ticketDaily)), accent: openTickets > 0 ? 'stroke-rose-500' : 'stroke-emerald-500' },
    { key: 'days', label: 'Days since last order', value: daysSinceLast === null ? '—' : daysSinceLast.toString(), icon: Calendar, spark: orderDaily, accent: (daysSinceLast ?? 0) > 30 ? 'stroke-rose-500' : 'stroke-emerald-500' },
    { key: 'repeat', label: 'Repeat rate', value: `${repeatRate}%`, icon: Repeat, spark: orderDaily, accent: 'stroke-teal-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map(t => <Tile key={t.key} tile={t} />)}
    </div>
  );
}
