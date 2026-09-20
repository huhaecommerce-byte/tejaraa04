import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation, Navigate } from "@/lib/router-compat";
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { CommandDeck } from '@/components/layout/CommandDeck';
import { customerNavigation } from '@/config/navigation';
import { CommandPalette } from '@/components/customer/CommandPalette';
import { SellerPortalHeader } from '@/components/seller/shell/SellerPortalHeader';
import { safeSetItem } from '@/lib/safeStorage';

const CustomerLayout = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('aurora-panel-collapsed') === '1';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Retail header search trigger opens the same command palette
  useEffect(() => {
    const open = () => setCmdOpen(true);
    window.addEventListener('tejaraa:open-command-palette', open);
    return () => window.removeEventListener('tejaraa:open-command-palette', open);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      safeSetItem('aurora-panel-collapsed', next ? '1' : '0');
      return next;
    });
  };

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const measure = () => setHeaderH(node.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/selling/signin" replace />;

  return (
    <div
      className="dashboard-with-retail-header retail-theme min-h-screen w-full relative bg-gradient-to-br from-[hsl(152_30%_98%)] via-white to-[hsl(45_60%_97%)]"
      style={{ '--dash-header-h': `${headerH}px` } as React.CSSProperties}
    >
      <div ref={headerRef} className="sticky top-0 z-50">
        <SellerPortalHeader />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] -z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 30% 0%, hsl(152 60% 92% / 0.55) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 90% 0%, hsl(45 80% 90% / 0.4) 0%, transparent 70%)',
        }}
      />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <CommandDeck
        sections={customerNavigation}
        variant="customer"
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onSearchClick={() => setCmdOpen(true)}
      />
      {/* Floating mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed left-3 z-30 h-10 w-10 rounded-full bg-white/95 backdrop-blur shadow-md ring-1 ring-border/60 inline-flex items-center justify-center text-foreground/80 hover:bg-white"
        style={{ top: 'calc(var(--dash-header-h, 0px) + 0.75rem)' }}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className={`relative ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[260px]'} flex flex-col min-h-screen transition-[margin] duration-300`}>
        <main className="flex-1 px-3 md:px-6 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
          <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
