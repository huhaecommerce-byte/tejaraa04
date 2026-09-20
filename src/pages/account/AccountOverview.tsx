import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Heart, MapPin, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavourites } from '@/hooks/useFavourites';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { money } from '@/lib/retailPricing';
import { cn } from '@/lib/utils';
import type { ShippingAddress } from '@/pages/customer/AddressBook';
import { useLocale } from '@/i18n/LocaleProvider';

type ShopOrder = {
  id: string;
  order_ref: string | null;
  status: string | null;
  total_sar: number | null;
  created_at: string;
};

type ProfileRow = {
  phone: string | null;
  email: string | null;
};

const STATUS_PROGRESS: Record<string, number> = {
  pending: 0.25,
  processing: 0.5,
  shipped: 0.75,
  delivered: 1,
  cancelled: 0,
};

export default function AccountOverview() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { favs } = useFavourites();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [defaultAddress, setDefaultAddress] = useState<ShippingAddress | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try { await (supabase as any).rpc('claim_guest_shop_orders'); } catch { /* non-blocking */ }
      const [
        { data: shop },
        { count },
        { data: addresses },
        { data: profileRow },
      ] = await Promise.all([
        (supabase as any)
          .from('shop_orders')
          .select('id, order_ref, status, total_sar, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase.from('shipping_addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase
          .from('shipping_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase.from('profiles').select('phone, email').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setOrders((shop || []) as ShopOrder[]);
      setAddressCount(count ?? 0);
      setDefaultAddress((addresses?.[0] ?? null) as ShippingAddress | null);
      setProfile(profileRow as ProfileRow | null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const latestOrder = orders[0] ?? null;
  const latestStatus = (latestOrder?.status || 'pending').toLowerCase();
  const latestProgress = STATUS_PROGRESS[latestStatus] ?? 0.25;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const summaryCards = [
    { label: t('shopx.account.orders'), value: orders.length, icon: Package, iconColor: 'text-retail-dark-green', to: '/account/orders' },
    { label: t('shopx.account.wishlist'), value: favs.size, icon: Heart, iconColor: 'text-retail-gold', to: '/account/wishlist' },
    { label: t('shopx.account.addresses'), value: addressCount, icon: MapPin, iconColor: 'text-retail-dark-green', to: '/account/addresses' },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold text-retail-dark-green truncate">
          {t('shopx.account.welcome', { name: user?.name || '' })}
        </h1>
        <Avatar className="h-9 w-9 border-2 border-retail-gold/30">
          <AvatarImage src={user?.avatar_url || ''} alt={user?.name} />
          <AvatarFallback className="bg-retail-gold text-retail-dark-green text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.to} className="group">
              <Card className="h-full border-retail-border bg-card transition-all group-hover:border-retail-gold">
                <CardContent className="flex flex-col items-center justify-center p-3 text-center">
                  <Icon className={cn('h-5 w-5', card.iconColor)} />
                  <p className="mt-1.5 font-display text-lg font-bold text-retail-dark-green">
                    {loading ? '—' : card.value}
                  </p>
                  <p className="text-[11px] font-medium text-retail-muted">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Featured order */}
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : latestOrder ? (
        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-retail-dark-green">{t('shopx.account.latestOrder')}</h2>
            <Button asChild variant="ghost" size="sm" className="h-auto px-1 py-0 text-xs font-bold text-retail-gold hover:text-retail-gold">
              <Link to="/account/orders">{t('shopx.account.viewAll')}</Link>
            </Button>
          </div>
          <Card className="border-retail-border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-retail-green text-retail-green text-[10px] capitalize">
                    {latestStatus}
                  </Badge>
                  <span className="text-[11px] text-retail-muted truncate">
                    {latestOrder.order_ref || latestOrder.id.slice(0, 8)}
                  </span>
                </div>
                <span className="text-sm font-bold text-retail-dark-green whitespace-nowrap">
                  SAR {money(Number(latestOrder.total_sar) || 0)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-retail-gold transition-all"
                  style={{ width: `${latestProgress * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-retail-muted">
                {latestStatus === 'delivered' ? t('shopx.account.delivered') : latestStatus === 'shipped' ? t('shopx.account.onTheWay') : t('shopx.account.orderReceived')}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Secondary grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Shipping address */}
        <section>
          <h2 className="mb-1.5 font-display text-sm font-bold text-retail-dark-green">{t('shopx.account.shippingAddress')}</h2>
          <Card className="border-retail-border bg-card">
            <CardContent className="p-3">
              {defaultAddress ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-retail-dark-green">{defaultAddress.recipient_name || user?.name}</p>
                  <p className="text-xs leading-relaxed text-retail-muted">
                    {defaultAddress.address_line1}
                    {defaultAddress.address_line2 && <>, {defaultAddress.address_line2}</>}
                    <br />
                    {defaultAddress.city}
                    {defaultAddress.region && `, ${defaultAddress.region}`}
                    {defaultAddress.postal_code && ` ${defaultAddress.postal_code}`}
                    {defaultAddress.country && <>, {defaultAddress.country}</>}
                  </p>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-retail-muted">{t('shopx.account.noDefaultAddress')}</p>
                </div>
              )}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-xs font-bold text-retail-gold hover:text-retail-gold"
              >
                <Link to="/account/addresses" className="flex items-center gap-1">
                  {t('shopx.account.manageAddresses')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Account security */}
        <section>
          <h2 className="mb-1.5 font-display text-sm font-bold text-retail-dark-green">{t('shopx.account.accountSecurity')}</h2>
          <Card className="border-retail-border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-retail-green" />
                <span className="text-xs font-bold text-retail-dark-green">{user?.email}</span>
                <span className="ml-auto rounded bg-retail-gold/10 px-1.5 py-0.5 text-[10px] font-bold text-retail-gold">
                  {t('shopx.account.verified')}
                </span>
              </div>
              <p className="text-xs text-retail-muted">
                {t('shopx.account.phone')} <span className="font-medium text-retail-dark-green">{profile?.phone || t('shopx.account.notAdded')}</span>
              </p>
              <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs font-bold">
                <Link to="/account/profile">{t('shopx.account.updateProfile')}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
