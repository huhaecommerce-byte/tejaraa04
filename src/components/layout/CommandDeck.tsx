import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from "@/lib/router-compat";
import { LogOut, Shield, Store, ChevronsLeft, ChevronsRight, ChevronRight, Search, Wallet, MessageCircle, ShieldCheck, Home, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavSection } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import { UsageCounters } from '@/components/customer/UsageCounters';
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts';
import { NotificationBell } from '@/components/NotificationBell';
import { supabase } from '@/integrations/supabase/client';
import { safeSetItem } from '@/lib/safeStorage';

interface Props {
  sections: NavSection[];
  variant?: 'customer' | 'admin' | 'agency';
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  staffBadge?: string;
  onSearchClick?: () => void;
}

const STORAGE_KEY = 'command-deck:open-groups';

export function CommandDeck({ sections, variant = 'customer', collapsed: collapsedProp, onToggle, mobileOpen = false, onMobileClose, staffBadge, onSearchClick }: Props) {
  const { user, logout } = useAuth();
  // Desktop collapse state must never apply to the mobile drawer —
  // on mobile the sidebar always renders fully expanded.
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsMobileViewport(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const collapsed = collapsedProp && !isMobileViewport;
  const navigate = useNavigate();
  const location = useLocation();
  const pendingCounts = useAdminPendingCounts();
  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();
  const handleLogout = async () => { await logout(); navigate(variant === 'agency' ? '/agency/signin' : '/'); };
  const [balance, setBalance] = useState<number | null>(null);

  const showWallet = variant === 'customer';

  useEffect(() => {
    if (!user?.id || !showWallet) return;
    const fetchBal = () => {
      supabase
        .from('wallet_transactions')
        .select('balance_after')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => setBalance(Number(data?.[0]?.balance_after ?? 0)));
    };
    fetchBal();
    const channel = supabase
      .channel(`wallet-deck-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, fetchBal)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, showWallet]);

  const formatBadge = (n: number) => (n > 99 ? '99+' : String(n));

  const isItemActive = (url: string) => {
    const path = url.split('?')[0];
    if (path === '/dropshipping' || path === '/admin') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isChildActive = (url: string) => {
    const [path, query] = url.split('?');
    if (location.pathname !== path) return false;
    if (!query) {
      return !location.search.includes('tab=');
    }
    const param = new URLSearchParams(query).get('tab');
    const current = new URLSearchParams(location.search).get('tab');
    return param === current;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { '/dropshipping/catalog': true };
    } catch { return { '/dropshipping/catalog': true }; }
  });

  useEffect(() => {
    sections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item.children && isItemActive(item.url)) {
          setOpenGroups((prev) => prev[item.url] === undefined ? { ...prev, [item.url]: true } : prev);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleGroup = (key: string) => setOpenGroups((p) => ({ ...p, [key]: !p[key] }));




  return (
    <TooltipProvider delayDuration={200}>
      {mobileOpen && <div className="command-deck-backdrop" onClick={onMobileClose} />}
      <aside
        className={`command-deck ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('a') && onMobileClose) onMobileClose();
        }}
      >
        {/* Brand / controls */}
        <div className="command-deck-brand">
          {variant !== 'customer' && variant !== 'agency' && (
            <Link to="/" className="group" aria-label="Home">
              <BrandLogo
                variant="sidebar"
                collapsed={collapsed}
                subLabel="ADMIN"
              />
            </Link>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={variant === 'agency' ? '/agency' : '/'}
                aria-label={variant === 'agency' ? 'Agency programme' : 'Homepage'}
                className="h-9 w-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/15 hover:border-white/25 inline-flex items-center justify-center text-white/90 hover:text-white transition-all"
              >
                <Home className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Homepage</TooltipContent>
          </Tooltip>
          <button
            onClick={onToggle}
            className="command-deck-collapse hidden lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden h-9 w-9 rounded-xl inline-flex items-center justify-center text-white/80 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 transition"
              aria-label="Close menu"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {variant === 'admin' && !collapsed && (
          <div className="px-4 -mt-1 mb-1 space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300/80 font-semibold">
              Internal tools
            </p>
            {staffBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/30">
                <ShieldCheck className="h-3 w-3" /> {staffBadge}
              </span>
            )}
          </div>
        )}

        {/* Search trigger (admin panel only — the buyer panel keeps these in the retail header) */}
        {variant !== 'customer' && !collapsed && onSearchClick && (
          <div className="px-3 pb-2">
            <button
              onClick={onSearchClick}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 hover:bg-white/10 text-[12.5px] text-white/40 ring-1 ring-white/10 hover:ring-white/20 outline-none transition text-left relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
              Search...
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/40">⌘K</kbd>
            </button>
          </div>
        )}
        {variant !== 'customer' && collapsed && onSearchClick && (
          <div className="px-3 pb-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onSearchClick}
                  className="h-9 w-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/15 hover:border-white/25 inline-flex items-center justify-center text-white/70 hover:text-white transition-all"
                  aria-label="Search (⌘K)"
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Search (⌘K)</TooltipContent>
            </Tooltip>
          </div>
        )}

        <nav className="command-deck-nav">
          {sections.map((section) => {
            const accentClass = section.accent ? `command-deck-accent-${section.accent}` : '';
            const showSectionChrome = variant === 'admin' && !collapsed;

            const renderItem = (item: typeof section.items[number]) => {
              const Icon = item.icon;
              const active = isItemActive(item.url);
              const hasChildren = !!item.children?.length && !collapsed;
              const isOpen = !!openGroups[item.url];
              const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey] : 0;
              const showBadge = badgeCount > 0;

              const link = (
                <NavLink
                  to={item.url}
                  end={item.url === '/dropshipping' || item.url === '/admin'}
                  className={`command-deck-item ${active ? 'is-active' : ''} ${collapsed ? 'is-collapsed' : ''}`}
                  onClick={() => {
                    if (hasChildren) {
                      if (!isOpen) toggleGroup(item.url);
                    }
                  }}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-[18px] w-[18px] command-deck-icon" />
                    {collapsed && showBadge && <span className="command-deck-badge-dot" aria-hidden />}
                  </span>
                  {!collapsed && <span className="truncate">{item.title}</span>}
                  {!collapsed && showBadge && (
                    <span className="command-deck-badge ml-auto" aria-label={`${badgeCount} pending`}>
                      {formatBadge(badgeCount)}
                    </span>
                  )}
                  {!collapsed && hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleGroup(item.url); }}
                      className={`${showBadge ? '' : 'ml-auto'} -m-2 p-2 rounded hover:bg-white/10 touch-manipulation`}
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      <ChevronRight className={`command-deck-chevron ${isOpen ? 'is-open' : ''}`} />
                    </button>
                  )}
                  {!collapsed && !hasChildren && !showBadge && active && <span className="command-deck-dot ml-auto" />}
                </NavLink>
              );

              const wrapped = collapsed ? (
                <Tooltip key={item.url}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.url}>{link}</div>
              );

              return (
                <div key={item.url}>
                  {wrapped}
                  {hasChildren && isOpen && (
                    <div className="command-deck-children">
                      {item.children!.map((child) => (
                        <Link
                          key={child.url}
                          to={child.url}
                          className={`command-deck-subitem ${isChildActive(child.url) ? 'is-active' : ''}`}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            if (showSectionChrome) {
              return (
                <div key={section.id}>
                  <div className="command-deck-section-label">{section.label}</div>
                  <div className={`command-deck-section ${accentClass}`}>
                    <span className="command-deck-section-bar" aria-hidden />
                    {section.items.map(renderItem)}
                  </div>
                </div>
              );
            }

            return (
              <div key={section.id} className="command-deck-group">
                {section.items.map(renderItem)}
              </div>
            );
          })}
        </nav>

        {/* Usage counters — buyer panel only, not when collapsed */}
        {variant === 'customer' && !collapsed && (
          <div className="px-3 pb-2">
            <UsageCounters />
          </div>
        )}

        {/* Utility row: wallet / support / notifications — buyer panel keeps these in the retail header */}
        {variant === 'admin' && (
          <div className={`px-3 pb-2 ${collapsed ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-1.5'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/admin/tickets"
                  aria-label="Support"
                  className="h-9 w-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/15 hover:border-white/25 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] inline-flex items-center justify-center text-white/90 hover:text-white transition-all shrink-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? 'right' : 'top'}>Support</TooltipContent>
            </Tooltip>
            <div className="shrink-0">
              <NotificationBell variant="admin" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="command-deck-footer">
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={variant === 'admin' ? '/dropshipping' : '/admin'}
                  className="command-deck-footer-btn"
                  aria-label={variant === 'admin' ? 'Switch to Buyer Panel' : 'Switch to Admin Panel'}
                >
                  {variant === 'admin' ? <Store className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  {!collapsed && (
                    <span className="text-[12px] font-medium">
                      {variant === 'admin' ? 'Buyer Panel' : 'Admin Panel'}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {variant === 'admin' ? 'Switch to Buyer Panel' : 'Switch to Admin Panel'}
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Buyer panel keeps the account block + logout in the retail header */}
          {variant !== 'customer' && (
            <div className="command-deck-user">
              <Link to={variant === 'agency' ? '/agency/portal/profile' : '/admin'} className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar className="h-8 w-8 ring-2 ring-white/15 shrink-0">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-primary/30 text-white text-[10px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-white truncate">{user?.name || 'Profile'}</div>
                    <div className="text-[10.5px] text-white/50 truncate capitalize">{variant === 'agency' ? 'Agency partner' : user?.role || 'user'}</div>
                  </div>
                )}
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleLogout} className="command-deck-logout" aria-label="Logout">
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
