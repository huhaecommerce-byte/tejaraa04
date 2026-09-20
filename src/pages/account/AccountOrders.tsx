import { useEffect, useMemo, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Package, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { money } from '@/lib/retailPricing';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';

type ShopOrder = {
  id: string;
  order_ref: string | null;
  status: string | null;
  total_sar: number | null;
  payment_method: string | null;
  city: string | null;
  region: string | null;
  tracking_number: string | null;
  items: any;
  created_at: string;
};

const FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export default function AccountOrders() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try { await (supabase as any).rpc('claim_guest_shop_orders'); } catch { /* non-blocking */ }
      const { data } = await (supabase as any)
        .from('shop_orders')
        .select('id, order_ref, status, total_sar, payment_method, city, region, tracking_number, items, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setOrders((data || []) as ShopOrder[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const normalised = useMemo(
    () => orders.map((o) => ({ ...o, uiStatus: !o.status || o.status === 'new' ? 'pending' : o.status })),
    [orders],
  );
  const visible = filter === 'all' ? normalised : normalised.filter((o) => o.uiStatus === filter);

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={filter === value ? 'default' : 'outline'}
            onClick={() => setFilter(value)}
            className="shrink-0 font-bold capitalize"
          >
            {t(`shopx.account.filter${value.charAt(0).toUpperCase()}${value.slice(1)}` as any)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed border-retail-border">
          <CardContent className="p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-retail-muted" />
            <p className="mt-3 text-sm font-bold text-retail-text">{t('shopx.account.noOrdersTitle')}</p>
            <p className="mt-1 text-sm text-retail-muted">{t('shopx.account.noOrdersDescription')}</p>
            <Button asChild className="mt-4 font-bold"><Link to="/catalog">{t('shopx.account.startShopping')}</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const qty = items.reduce((sum: number, item: any) => sum + (Number(item.qty ?? item.quantity) || 1), 0);
            return (
              <Card key={order.id} className="border-retail-border">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-retail-text">{order.order_ref || order.id.slice(0, 8)}</p>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', order.uiStatus === 'delivered' && 'border-retail-green text-retail-green')}
                      >
                        {order.uiStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-retail-muted">
                      {new Date(order.created_at).toLocaleDateString()} · {qty === 1 ? t('shopx.account.itemsCountOne', { count: qty }) : t('shopx.account.itemsCountOther', { count: qty })} ·{' '}
                      {order.payment_method === 'card' ? t('shopx.account.card') : t('shopx.account.cod')}
                      {order.city ? ` · ${[order.city, order.region].filter(Boolean).join(', ')}` : ''}
                    </p>
                    {order.tracking_number && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-retail-green">
                        <Truck className="h-3.5 w-3.5" />{t('shopx.account.tracking', { number: order.tracking_number })}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-lg font-bold text-retail-dark-green">SAR {money(Number(order.total_sar) || 0)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
