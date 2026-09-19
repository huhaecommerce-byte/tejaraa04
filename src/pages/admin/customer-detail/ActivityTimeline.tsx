import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from "@/lib/router-compat";
import {
  ShoppingCart, MessageSquare, Wallet, ClipboardList, RotateCw, Bell, Activity, Tag,
} from 'lucide-react';

type Event = {
  id: string;
  ts: number;
  icon: any;
  iconClass: string;
  title: string;
  subtitle?: string;
  link?: string;
};

interface Props {
  orders: any[];
  tickets: any[];
  wallet: any[];
  sourcing: any[];
  quotes: any[];
  returns: any[];
  notifications: any[];
  labelling: any[];
  limit?: number;
}

function fmtRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function ActivityTimeline({ orders, tickets, wallet, sourcing, quotes, returns, notifications, labelling, limit = 40 }: Props) {
  const events = useMemo<Event[]>(() => {
    const all: Event[] = [];
    orders.forEach(o => all.push({
      id: `o-${o.id}`, ts: new Date(o.created_at).getTime(), icon: ShoppingCart, iconClass: 'bg-emerald-100 text-emerald-700',
      title: `Order #${o.id.slice(0, 8)} · ${o.status}`, subtitle: `SAR ${Number(o.total).toFixed(0)} · ${o.type}`, link: `/admin/orders/${o.id}`,
    }));
    tickets.forEach(t => all.push({
      id: `t-${t.id}`, ts: new Date(t.created_at).getTime(), icon: MessageSquare, iconClass: 'bg-amber-100 text-amber-700',
      title: t.subject, subtitle: `Ticket · ${t.status} · ${t.priority}`, link: '/admin/tickets',
    }));
    wallet.forEach(w => all.push({
      id: `w-${w.id}`, ts: new Date(w.created_at).getTime(), icon: Wallet,
      iconClass: Number(w.amount) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      title: w.description || w.type, subtitle: `${Number(w.amount) >= 0 ? '+' : ''}SAR ${Number(w.amount).toFixed(2)} · ${w.type}`,
    }));
    sourcing.forEach(s => all.push({
      id: `s-${s.id}`, ts: new Date(s.created_at).getTime(), icon: ClipboardList, iconClass: 'bg-violet-100 text-violet-700',
      title: `Sourcing: ${s.product_name}`, subtitle: `qty ${s.quantity} · ${s.status}`, link: '/admin/sourcing',
    }));
    quotes.forEach(q => all.push({
      id: `q-${q.id}`, ts: new Date(q.created_at).getTime(), icon: ClipboardList, iconClass: 'bg-sky-100 text-sky-700',
      title: `Quote #${q.id.slice(0, 8)}`, subtitle: `qty ${q.quantity} · ${q.status}`, link: '/admin/quotes',
    }));
    returns.forEach(r => all.push({
      id: `r-${r.id}`, ts: new Date(r.created_at).getTime(), icon: RotateCw, iconClass: 'bg-rose-100 text-rose-700',
      title: `Return: ${r.reason}`, subtitle: `refund SAR ${Number(r.refund_amount).toFixed(0)} · ${r.status}`, link: '/admin/returns',
    }));
    labelling.forEach(l => all.push({
      id: `l-${l.id}`, ts: new Date(l.created_at).getTime(), icon: Tag, iconClass: 'bg-teal-100 text-teal-700',
      title: `Labelling ${l.type?.toUpperCase()}`, subtitle: `${l.items_count} item(s) · ${l.status}`, link: '/admin/labelling',
    }));
    notifications.slice(0, 10).forEach(n => all.push({
      id: `n-${n.id}`, ts: new Date(n.created_at).getTime(), icon: Bell, iconClass: 'bg-slate-100 text-slate-700',
      title: n.title, subtitle: n.body?.slice(0, 80),
    }));
    return all.sort((a, b) => b.ts - a.ts).slice(0, limit);
  }, [orders, tickets, wallet, sourcing, quotes, returns, notifications, labelling, limit]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" /> Activity timeline
          <span className="text-[10px] font-normal text-muted-foreground ml-auto">{events.length} events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="relative max-h-[520px] overflow-y-auto">
            <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" />
            <ol className="space-y-1 p-3">
              {events.map(e => {
                const Icon = e.icon;
                const inner = (
                  <div className="flex gap-3 items-start group rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors">
                    <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ring-4 ring-card ${e.iconClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      {e.subtitle && <p className="text-xs text-muted-foreground truncate">{e.subtitle}</p>}
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{fmtRelative(e.ts)}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={e.id}>
                    {e.link ? <Link to={e.link}>{inner}</Link> : inner}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
