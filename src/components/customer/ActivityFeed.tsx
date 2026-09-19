import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart, Wallet, Inbox, TicketIcon, ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type FeedItem = {
  id: string;
  type: 'order' | 'wallet' | 'sourcing' | 'ticket';
  title: string;
  subtitle: string;
  time: string;
  link: string;
};

const ICONS = {
  order: ShoppingCart,
  wallet: Wallet,
  sourcing: Inbox,
  ticket: TicketIcon,
};

const DOT_COLORS = {
  order: 'bg-primary',
  wallet: 'bg-amber-400',
  sourcing: 'bg-violet-400',
  ticket: 'bg-blue-400',
};

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    if (!user?.id) return;
    const [orders, wallet, sourcing, tickets] = await Promise.all([
      supabase.from('orders').select('id, status, total, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(5),
      supabase.from('wallet_transactions').select('id, type, amount, description, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('sourcing_requests').select('id, product_name, status, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(3),
      supabase.from('tickets').select('id, subject, status, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(3),
    ]);

    const feed: FeedItem[] = [
      ...(orders.data || []).map((o: any) => ({
        id: `o-${o.id}`,
        type: 'order' as const,
        title: `Order #${o.id.slice(0, 8)}`,
        subtitle: `${o.status} · SAR ${Number(o.total).toFixed(2)}`,
        time: o.updated_at,
        link: `/dropshipping/orders/${o.id}`,
      })),
      ...(wallet.data || []).map((w: any) => ({
        id: `w-${w.id}`,
        type: 'wallet' as const,
        title: `${w.type === 'credit' ? '+' : '-'}SAR ${Math.abs(Number(w.amount)).toFixed(2)}`,
        subtitle: w.description || w.type,
        time: w.created_at,
        link: '/dropshipping/billing?tab=wallet',
      })),
      ...(sourcing.data || []).map((s: any) => ({
        id: `s-${s.id}`,
        type: 'sourcing' as const,
        title: s.product_name,
        subtitle: s.status,
        time: s.updated_at,
        link: '/dropshipping/sourcing',
      })),
      ...(tickets.data || []).map((t: any) => ({
        id: `t-${t.id}`,
        type: 'ticket' as const,
        title: t.subject,
        subtitle: t.status,
        time: t.updated_at,
        link: '/dropshipping/tickets',
      })),
    ];

    feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setItems(feed.slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();
    if (!user?.id) return;
    const channel = supabase
      .channel(`feed-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, loadFeed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, loadFeed)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.type];
        return (
          <Link
            key={item.id}
            to={item.link}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
          >
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[item.type]}`} />
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-[11px] text-muted-foreground capitalize truncate">{item.subtitle}</p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">{relativeTime(item.time)}</span>
          </Link>
        );
      })}
      <Link to="/dropshipping/orders" className="flex items-center gap-1 text-xs text-primary font-medium px-3 pt-2 hover:underline">
        View all activity <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
