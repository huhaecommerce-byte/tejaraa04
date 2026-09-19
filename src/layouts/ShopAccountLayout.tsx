import { Outlet, Link, useLocation, Navigate } from "@/lib/router-compat";
import { LayoutGrid, Package, Heart, MapPin, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RetailHeader } from '@/components/retail/shell/RetailHeader';
import { RetailFooter } from '@/components/retail/shell/RetailFooter';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { cn } from '@/lib/utils';

export const ACCOUNT_TABS = [
  { label: 'Overview', to: '/account', icon: LayoutGrid },
  { label: 'My Orders', to: '/account/orders', icon: Package },
  { label: 'Wishlist', to: '/account/wishlist', icon: Heart },
  { label: 'Addresses', to: '/account/addresses', icon: MapPin },
  { label: 'Profile', to: '/account/profile', icon: User },
];

const ShopAccountLayout = () => {
  const { user, isLoading, logout } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retail-page">
        <div className="w-64 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/shop/signin" replace />;

  const isActive = (to: string) => (to === '/account' ? pathname === '/account' : pathname.startsWith(to));

  return (
    <div className="retail-theme flex min-h-screen flex-col bg-retail-page text-retail-text">
      <RetailHeader />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col bg-retail-dark-green text-white lg:flex">
          <div className="border-b border-white/10 p-8">
            <h2 className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-retail-gold text-retail-dark-green text-sm font-black italic">
                T
              </span>
              My Account
            </h2>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {ACCOUNT_TABS.map((tab) => {
              const active = isActive(tab.to);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    active
                      ? 'bg-white/10 text-retail-gold'
                      : 'text-white/70 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-6">
            <Button
              variant="ghost"
              onClick={() => void logout()}
              className="w-full justify-start gap-3 text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </Button>
          </div>
        </aside>

        {/* Mobile nav */}
        <nav className="sticky top-0 z-30 border-b border-retail-border bg-retail-card/95 backdrop-blur lg:hidden">
          <RetailContainer className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
            {ACCOUNT_TABS.map((tab) => {
              const active = isActive(tab.to);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-retail-dark-green text-white'
                      : 'text-retail-muted hover:bg-retail-light-green',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </RetailContainer>
        </nav>

        <main className="flex-1 bg-muted/40">
          <RetailContainer className="py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:py-10 lg:pb-10">
            <Outlet />
          </RetailContainer>
        </main>
      </div>

      <RetailFooter />
    </div>
  );
};

export default ShopAccountLayout;
