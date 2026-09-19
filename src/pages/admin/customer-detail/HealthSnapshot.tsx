import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Truck, RotateCw, MessageSquare } from 'lucide-react';

interface Props {
  orders: any[];
  tickets: any[];
  returns: any[];
}

function HealthRow({ icon: Icon, label, value, pct, color }: { icon: any; label: string; value: string; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Icon className="h-3 w-3" /> {label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

export function HealthSnapshot({ orders, tickets, returns }: Props) {
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const onTimeRate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const returnRate = orders.length ? Math.round((returns.length / orders.length) * 100) : 0;
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;
  const ticketResolveRate = tickets.length ? Math.round((closedTickets / tickets.length) * 100) : 100;

  // Last 90d revenue mini-bar
  const now = Date.now();
  const dayMs = 86400000;
  const buckets = new Array(12).fill(0); // 12 buckets of ~7.5 days each
  orders.forEach(o => {
    const age = now - new Date(o.created_at).getTime();
    const idx = 11 - Math.floor(age / (dayMs * 7.5));
    if (idx >= 0 && idx < 12) buckets[idx] += Number(o.total) || 0;
  });
  const max = Math.max(...buckets, 1);
  const last90Total = buckets.reduce((s, x) => s + x, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Health snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <HealthRow icon={Truck} label="On-time delivery" value={`${onTimeRate}%`} pct={onTimeRate}
          color={onTimeRate >= 80 ? 'bg-emerald-500' : onTimeRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'} />
        <HealthRow icon={RotateCw} label="Return rate" value={`${returnRate}%`} pct={returnRate}
          color={returnRate <= 5 ? 'bg-emerald-500' : returnRate <= 15 ? 'bg-amber-500' : 'bg-rose-500'} />
        <HealthRow icon={MessageSquare} label="Ticket resolve rate" value={`${ticketResolveRate}%`} pct={ticketResolveRate}
          color={ticketResolveRate >= 80 ? 'bg-emerald-500' : ticketResolveRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'} />

        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Last 90 days revenue</span>
            <span className="font-semibold text-foreground tabular-nums">SAR {last90Total.toFixed(0)}</span>
          </div>
          <div className="flex items-end gap-0.5 h-12">
            {buckets.map((v, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-sm hover:bg-primary/40 transition-colors"
                style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
                title={`SAR ${v.toFixed(0)}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 tabular-nums">{delivered}</p>
            <p className="text-[10px] text-muted-foreground">Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-rose-600 tabular-nums">{cancelled}</p>
            <p className="text-[10px] text-muted-foreground">Cancelled</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600 tabular-nums">{returns.length}</p>
            <p className="text-[10px] text-muted-foreground">Returns</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
