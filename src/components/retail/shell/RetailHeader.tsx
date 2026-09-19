import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight, CircleHelp, Globe2, Handshake, Heart, Home,
  List, LogOut, Menu, MessageCircle, Package, Search, ShoppingCart, Store, User, Wallet, Warehouse,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
import { useWholesaleAccess } from '@/hooks/useWholesaleAccess';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

interface CategoryRow { top_category: string; sub_category: string; cnt: number }
interface CategoryGroup { name: string; count: number; children: string[] }

const establishedCategoryFallbacks: CategoryGroup[] = [
  { name: 'Mobiles & tablets', count: 0, children: [] },
  { name: 'Electronics', count: 0, children: [] },
  { name: 'Home & kitchen', count: 0, children: [] },
  { name: 'Fashion', count: 0, children: [] },
  { name: 'Beauty & care', count: 0, children: [] },
  { name: 'Health', count: 0, children: [] },
  { name: 'Sports', count: 0, children: [] },
  { name: 'Automotive', count: 0, children: [] },
  { name: 'Daily needs', count: 0, children: [] },
];

const platformLinks: { label: TranslationKey; to: string; icon: typeof ShoppingCart }[] = [
  { label: 'platform.shop', to: '/', icon: ShoppingCart },
  { label: 'platform.selling', to: '/selling', icon: Store },
  { label: 'platform.suppliers', to: '/partners', icon: Warehouse },
  { label: 'platform.agencies', to: '/agency', icon: Handshake },
];

export function RetailHeader() {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [term, setTerm] = useState('');
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('product_category_counts_cache').select('top_category, sub_category, cnt').limit(1000).then(({ data }) => {
      if (!data) return;
      const grouped = new Map<string, { count: number; children: Map<string, number> }>();
      (data as CategoryRow[]).forEach((row) => {
        if (!row.top_category) return;
        const group = grouped.get(row.top_category) ?? { count: 0, children: new Map<string, number>() };
        group.count += Number(row.cnt) || 0;
        if (row.sub_category) group.children.set(row.sub_category, (group.children.get(row.sub_category) ?? 0) + (Number(row.cnt) || 0));
        grouped.set(row.top_category, group);
      });
      setCategories([...grouped.entries()].map(([name, value]) => ({ name, count: value.count, children: [...value.children.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label]) => label) })).sort((a, b) => b.count - a.count).slice(0, 12));
    });
  }, []);

  useEffect(() => { setMobileOpen(false); setCategoryOpen(false); }, [location.pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const node = event.target as Node;
      if (!categoryRef.current?.contains(node)) setCategoryOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setCategoryOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);

  const availableCategories = useMemo(() => categories.length ? categories : establishedCategoryFallbacks, [categories]);
  const departmentLinks = useMemo(() => availableCategories.slice(0, 9), [availableCategories]);
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = term.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/catalog');
  };
  const accountHref = '/account';
  const activePlatform = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/partners')) return '/partners';
    if (p.startsWith('/agency')) return '/agency';
    if (p.startsWith('/selling')) return '/selling';
    if (p.startsWith('/dropshipping') || p.startsWith('/dashboard')) return '/selling';
    return '/';
  }, [location.pathname]);

  const isDropshippingPortal = location.pathname.startsWith('/dropshipping') || location.pathname.startsWith('/dashboard');
  const hideShopNav = Boolean(user) && isDropshippingPortal;
  const hidePortalHeader = Boolean(user) && isDropshippingPortal;

  // Wallet balance for the dropshipping portal header chip
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!hidePortalHeader || !user?.id) return;
    let active = true;
    const fetchBal = () => {
      supabase.from('wallet_transactions').select('balance_after').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => { if (active) setWalletBalance(Number(data?.[0]?.balance_after ?? 0)); });
    };
    fetchBal();
    const channel = supabase
      .channel(`wallet-header-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, fetchBal)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [hidePortalHeader, user?.id]);



  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-retail-border bg-retail-card font-sans">
        <div className="hidden bg-retail-dark-green text-primary-foreground md:flex">
          <RetailContainer className="flex h-11 w-full items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-2 self-stretch">
              <SellerPlatformSwitcher current={activePlatform === '/partners' ? 'suppliers' : activePlatform === '/agency' ? 'agencies' : activePlatform === '/selling' ? 'selling' : 'shop'} />
              <span className="pb-2 font-bold sm:hidden">{t("shop.brand")}</span>
            </div>
            <LanguageToggle />
          </RetailContainer>
        </div>

        <div className="relative z-20 bg-retail-card">
          {hidePortalHeader ? (
            <RetailContainer className="flex min-h-[64px] items-center justify-between gap-3 py-2 lg:min-h-[72px]">
              <div className="flex items-center gap-2">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={t("common.openNavigation")} className="h-10 w-10 lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                  <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto p-0">
                    <MobileMenu categories={availableCategories} user={user} accountHref={accountHref} logout={logout} />
                  </SheetContent>
                </Sheet>
                <Link to="/" aria-label={t("shop.homeAria")} className="shrink-0"><BrandLogo variant="storefront" className="max-w-[170px]" /></Link>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('tejaraa:open-command-palette'))}
                  aria-label={t("common.search")}
                  className="group hidden w-56 items-center justify-between rounded-xl border border-retail-border bg-retail-light-green/40 px-4 py-2.5 transition-all duration-200 hover:border-retail-green/40 hover:bg-retail-card md:flex xl:w-64"
                >
                  <span className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-retail-muted transition-colors group-hover:text-retail-dark-green" />
                    <span className="text-sm font-medium text-retail-muted">{t("common.searchEllipsis")}</span>
                  </span>
                  <kbd className="rounded border border-retail-border bg-retail-card px-1.5 py-0.5 text-[10px] font-bold text-retail-muted shadow-sm">⌘K</kbd>
                </button>

                <div className="hidden h-8 w-px bg-retail-border md:block" />

                <Link
                  to="/dropshipping/billing?tab=wallet"
                  aria-label={t("common.wallet")}
                  className="hidden items-center gap-3 rounded-xl border-b-2 border-retail-gold/50 bg-retail-dark-green px-4 py-2 shadow-md transition-colors hover:bg-retail-dark-green/90 md:flex"
                >
                  <Wallet className="h-5 w-5 text-retail-gold" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[9px] font-semibold uppercase tracking-tighter text-primary-foreground/70">{t("common.wallet")}</span>
                    <span className="text-sm font-bold text-primary-foreground">SAR {walletBalance !== null ? walletBalance.toFixed(2) : '—'}</span>
                  </span>
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    to="/dropshipping/tickets"
                    aria-label={t("common.support")}
                    className="hidden h-10 w-10 items-center justify-center rounded-full text-retail-muted transition-all hover:bg-retail-light-green/70 hover:text-retail-dark-green lg:inline-flex"
                  >
                    <MessageCircle className="h-[18px] w-[18px]" />
                  </Link>
                  <div className="shrink-0">
                    <NotificationBell variant="buyer" tone="light" />
                  </div>
                </div>

                <div className="flex items-center gap-3 border-l border-retail-border pl-3">
                  <Link to="/dropshipping/profile" className="hidden items-center gap-3 md:flex">
                    <span className="flex flex-col text-right">
                      <span className="text-xs font-medium text-retail-muted">Hello, <span className="font-bold text-retail-dark-green">{user?.name.split(' ')[0]}</span></span>
                      <span className="text-[11px] font-bold uppercase text-retail-green transition-colors hover:text-retail-dark-green">{t("common.myAccount")}</span>
                    </span>
                    <span className="relative rounded-full p-0.5 ring-2 ring-retail-dark-green/10 transition-transform hover:scale-105">
                      <Avatar className="h-9 w-9 shrink-0">
                        {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="bg-retail-light-green text-retail-dark-green text-[10px] font-bold">{(user?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-retail-card bg-retail-green" aria-hidden="true" />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void logout().then(() => navigate('/')); }}
                    aria-label={t("common.logout")}
                    className="group hidden h-8 items-center gap-1.5 rounded-full border border-retail-sale/25 px-2.5 text-retail-sale transition-colors hover:border-retail-sale/50 hover:bg-retail-sale/10 md:inline-flex"
                  >
                    <LogOut className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    <span className="text-[11px] font-semibold leading-none">{t("common.logout")}</span>
                  </button>
                </div>
              </div>
            </RetailContainer>
          ) : (
            <RetailContainer className="grid min-h-[64px] grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 lg:min-h-[72px] lg:grid-cols-[auto_minmax(280px,1fr)_auto] lg:gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={t("common.openNavigation")} className="h-10 w-10 lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto p-0">
                  <MobileMenu categories={availableCategories} user={user} accountHref={accountHref} logout={logout} />
                </SheetContent>
              </Sheet>

              <Link to="/" aria-label={t("shop.homeAria")} className="shrink-0 justify-self-center lg:justify-self-start"><BrandLogo variant="storefront" className="max-w-[170px]" /></Link>

              {!hideShopNav && (
                <form onSubmit={submitSearch} className="order-last col-span-3 w-full lg:order-none lg:col-span-1">
                  <div className="grid h-11 grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-md border-2 border-retail-green bg-retail-card focus-within:ring-2 focus-within:ring-retail-green/20">
                    <input suppressHydrationWarning value={term} onChange={(event) => setTerm(event.target.value)} aria-label={t("shop.searchAria")} placeholder={t("shop.searchPlaceholder")} className="min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-retail-muted" />
                    <Button type="submit" className="h-full rounded-none px-4" aria-label={t("common.search")}><Search className="h-4 w-4" /><span className="hidden xl:inline">{t("common.search")}</span></Button>
                  </div>
                </form>
              )}

              <div className="flex shrink-0 items-center justify-self-end">
                <Link to="/account/wishlist" className="hidden min-w-16 flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold text-retail-text hover:text-retail-green lg:inline-flex"><Heart className="h-5 w-5" />{t("common.wishlist")}</Link>
                <Link to="/cart" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`} className="relative flex min-w-16 flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold text-retail-text hover:text-retail-green"><ShoppingCart className="h-5 w-5" /><span className="hidden xl:inline">{t("common.cart")}</span>{count > 0 && <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-retail-sale px-1 text-[10px] font-bold text-primary-foreground">{count > 99 ? '99+' : count}</span>}</Link>
                <Link to={user ? accountHref : '/login'} className="hidden h-auto min-w-14 items-center gap-2 px-2 py-1 text-left text-retail-text hover:text-retail-green md:inline-flex">
                  <User className="h-5 w-5 shrink-0" />
                  <span className="hidden text-[10px] leading-tight xl:block">
                    <span className="block text-retail-muted">{user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, sign in'}</span>
                    <strong className="text-xs">{t("common.myAccount")}</strong>
                  </span>
                </Link>
              </div>
            </RetailContainer>
          )}
        </div>


        {!hideShopNav && (
          <nav aria-label={t("shop.departmentsAria")} className="hidden h-10 border-t border-retail-border bg-retail-light-green/55 lg:block">
            <RetailContainer className="flex h-full items-center overflow-hidden">
              <div ref={categoryRef} className="relative h-full">
                <Button type="button" variant="ghost" aria-expanded={categoryOpen} aria-controls="retail-category-menu" onClick={() => setCategoryOpen((open) => !open)} className="h-full shrink-0 gap-2 rounded-none border-r border-retail-border pr-4 text-xs font-bold text-retail-dark-green"><Menu className="h-4 w-4" />{t("shop.departments")}</Button>
                {categoryOpen && <CategoryMegaMenu categories={availableCategories} onClose={() => setCategoryOpen(false)} />}
              </div>
              <div className="no-scrollbar flex h-full min-w-0 flex-1 items-center overflow-x-auto">
                {departmentLinks.map((category) => <Link key={category.name} to={`/catalog?q=${encodeURIComponent(category.name)}`} className="flex h-full shrink-0 items-center px-3 text-xs font-semibold text-retail-text hover:bg-retail-card hover:text-retail-green">{category.name}</Link>)}
              </div>
              <Link to="/catalog?source=local" className="flex h-full shrink-0 items-center gap-1.5 border-l border-retail-border pl-4 text-xs font-bold text-retail-green">{t("shop.readyToShip")}</Link>
            </RetailContainer>
          </nav>
        )}
      </header>
      {!hidePortalHeader && <MobileBottomNav count={count} />}
    </>

  );
}

function CategoryMegaMenu({ categories, onClose }: { categories: CategoryGroup[]; onClose: () => void }) {
  return <div id="retail-category-menu" role="menu" className="absolute left-0 top-[calc(100%+8px)] z-50 w-[780px] rounded-lg border border-retail-border bg-retail-card p-5 shadow-xl">
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-retail-border pb-3"><div><p className="text-xs font-bold uppercase text-retail-muted">All categories</p><p className="text-sm font-bold text-retail-text">Browse Tejaraa departments</p></div><Link to="/category" onClick={onClose} className="text-xs font-bold text-retail-green">View all categories →</Link></div>
    <div className="grid grid-cols-4 gap-x-6 gap-y-5">{categories.slice(0, 8).map((category) => <div key={category.name} className="min-w-0"><Link to={`/catalog?q=${encodeURIComponent(category.name)}`} onClick={onClose} className="block truncate text-sm font-bold text-retail-dark-green hover:text-retail-green">{category.name}</Link><ul className="mt-2 space-y-1.5">{category.children.map((child) => <li key={child}><Link to={`/catalog?q=${encodeURIComponent(child)}`} onClick={onClose} className="block truncate text-xs text-retail-muted hover:text-retail-green">{child}</Link></li>)}</ul></div>)}</div>
  </div>;
}


function MobileMenu({ categories, user, accountHref, logout }: { categories: CategoryGroup[]; user: ReturnType<typeof useAuth>['user']; accountHref: string; logout: () => Promise<void> }) {
  const { pathname } = useLocation();
  const isArabic = pathname === '/ar' || pathname.startsWith('/ar/');
  const [activeCategory, setActiveCategory] = useState<CategoryGroup | null>(null);
  const wholesale = useWholesaleAccess();
  return <div className="min-h-full bg-retail-card">
    <SheetHeader className="border-b border-retail-border bg-retail-dark-green p-5 text-left text-primary-foreground"><SheetTitle className="text-primary-foreground">Tejaraa Shop</SheetTitle><SheetDescription className="text-primary-foreground/70">{user ? `Hello, ${user.name}` : 'Shop products across Saudi Arabia'}</SheetDescription></SheetHeader>
    {activeCategory ? <div className="p-4"><Button type="button" variant="ghost" onClick={() => setActiveCategory(null)} className="mb-4 gap-2 px-0 text-sm font-bold text-retail-green"><ChevronRight className="h-4 w-4 rotate-180" />All Categories</Button><h2 className="mb-2 font-display text-lg font-bold">{activeCategory.name}</h2><nav className="divide-y divide-retail-border">{activeCategory.children.map((child) => <SheetClose asChild key={child}><Link to={`/catalog?q=${encodeURIComponent(child)}`} className="block py-3 text-sm">{child}</Link></SheetClose>)}<SheetClose asChild><Link to={`/catalog?q=${encodeURIComponent(activeCategory.name)}`} className="block py-3 text-sm font-bold text-retail-green">View all {activeCategory.name}</Link></SheetClose></nav></div> : <div className="p-4">
      <div className="grid grid-cols-2 gap-2">{platformLinks.map((item) => <SheetClose asChild key={item.label}><Link to={item.to} className={`flex items-center gap-2 rounded-md border p-3 text-xs font-bold ${item.to === '/' ? 'border-retail-green bg-retail-light-green text-retail-green' : 'border-retail-border'}`}><item.icon className="h-4 w-4" />{item.label}</Link></SheetClose>)}</div>
      <section className="mt-5"><div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase text-retail-muted">Categories</h2><SheetClose asChild><Link to="/category" className="text-xs font-bold text-retail-green">View all</Link></SheetClose></div><div className="mt-2 divide-y divide-retail-border">{categories.slice(0, 10).map((category) => <Button key={category.name} type="button" variant="ghost" onClick={() => setActiveCategory(category)} className="flex h-auto w-full justify-between rounded-none py-3 text-left text-sm font-semibold"><span className="truncate">{category.name}</span><ChevronRight className="h-4 w-4 shrink-0 text-retail-muted" /></Button>)}</div></section>
      <nav className="mt-5 border-t border-retail-border pt-3">{user ? <><SheetClose asChild><Link to={accountHref} className="flex items-center gap-3 py-3 text-sm"><User className="h-5 w-5" />My Account</Link></SheetClose><SheetClose asChild><Link to="/account/orders" className="flex items-center gap-3 py-3 text-sm"><Package className="h-5 w-5" />Orders</Link></SheetClose><SheetClose asChild><Link to="/account/wishlist" className="flex items-center gap-3 py-3 text-sm"><Heart className="h-5 w-5" />{t("common.wishlist")}</Link></SheetClose>{wholesale.hasAccess && <SheetClose asChild><Link to={wholesale.portalHref} className="flex items-center gap-3 py-3 text-sm font-bold text-retail-green"><Warehouse className="h-5 w-5" />{wholesale.isConsole ? 'Admin Portal' : 'Wholesale Portal'}</Link></SheetClose>}<SheetClose asChild><Button type="button" variant="ghost" onClick={() => void logout()} className="px-0 text-sm text-retail-sale hover:text-retail-sale">Sign out</Button></SheetClose></> : <div className="grid grid-cols-2 gap-2"><SheetClose asChild><Button asChild><Link to="/shop/signin">Sign in</Link></Button></SheetClose><SheetClose asChild><Button asChild variant="outline"><Link to="/shop/signup">Create account</Link></Button></SheetClose></div>}<SheetClose asChild><Link to="/contact" className="mt-3 flex items-center gap-3 py-3 text-sm"><CircleHelp className="h-5 w-5" />Help Center</Link></SheetClose><SheetClose asChild>{isArabic ? <Link to="/" className="flex items-center gap-3 py-3 text-sm"><Globe2 className="h-5 w-5" />English</Link> : <Link to="/ar" className="flex items-center gap-3 py-3 text-sm"><Globe2 className="h-5 w-5" />العربية</Link>}</SheetClose></nav>
    </div>}
  </div>;
}

function MobileBottomNav({ count }: { count: number }) {
  const items = [{ label: 'Home', to: '/', icon: Home }, { label: 'Categories', to: '/category', icon: List }, { label: 'Cart', to: '/cart', icon: ShoppingCart }, { label: 'Orders', to: '/account/orders', icon: Package }, { label: 'Account', to: '/account', icon: User }];
  return <nav aria-label="Mobile shop navigation" className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(56px+env(safe-area-inset-bottom))] grid-cols-5 border-t border-retail-border bg-retail-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_14px_hsl(var(--foreground)/0.08)] lg:hidden">{items.map((item) => <Link key={item.label} to={item.to} className="relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-retail-muted hover:text-retail-green"><item.icon className="h-5 w-5" /><span>{item.label}</span>{item.label === 'Cart' && count > 0 && <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-retail-sale px-1 text-[9px] text-primary-foreground">{count > 99 ? '99+' : count}</span>}</Link>)}</nav>;
}
