import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation } from '@/lib/router-compat';
import { Clock, ShieldAlert, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAgency } from '@/hooks/useAgency';
import { useAccessTier } from '@/hooks/useAccessTier';

import { agencyNavigation } from '@/config/navigation';
import { CommandDeck } from '@/components/layout/CommandDeck';
import { Menu } from 'lucide-react';
import { AgencyPortalHeader } from '@/components/agency/shell/AgencyPortalHeader';
import { safeSetItem } from '@/lib/safeStorage';
import { useLocale } from '@/i18n/LocaleProvider';

const StatusCard = ({
  icon, title, text, action,
}: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) => (
  <div className="retail-theme flex min-h-screen flex-col bg-retail-page">
    <AgencyPortalHeader />
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-retail-border bg-retail-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-retail-light-green text-retail-green">
          {icon}
        </div>
        <h2 className="mb-2 font-display text-xl font-bold text-retail-dark-green">{title}</h2>
        <p className="mb-6 text-sm leading-6 text-retail-muted">{text}</p>
        {action}
      </div>
    </div>
  </div>
);

const AgencyLayout = () => {
  const { t } = useLocale();
  const { user, isLoading } = useAuth();
  const { agency, isLoading: agencyLoading } = useAgency();
  const access = useAccessTier();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('aurora-panel-collapsed') === '1';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      safeSetItem('aurora-panel-collapsed', next ? '1' : '0');
      return next;
    });
  };

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const headerRef = useRef<HTMLDivElement>(null);
  // Fallback matches the rendered header height (switcher strip + identity row)
  // so the sidebar never sits on top of the header before measurement lands.
  const [headerH, setHeaderH] = useState(108);
  const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  useIsomorphicLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const measure = () => setHeaderH(node.offsetHeight || 108);
    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  });


  if (isLoading || agencyLoading || access.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/agency/signin" replace />;

  // Supplier / internal accounts sit on the top tier: they may browse the
  // partner portal even without an agency profile of their own.
  const supplierBrowsing = !agency?.ok && access.canUseSupplier;

  if (!supplierBrowsing) {
    if (!agency?.ok) {
      return (
        <StatusCard
          icon={<ShieldAlert className="h-6 w-6" />}
          title={t('agency.layout.noAccountTitle')}
          text={t('agency.layout.noAccountText')}
          action={<Button asChild><Link to="/agency/apply">{t('agency.layout.createPartnerAccount')}</Link></Button>}
        />
      );
    }

    if (agency.status === 'pending') {
      return (
        <StatusCard
          icon={<Clock className="h-6 w-6" />}
          title={t('agency.layout.pendingTitle')}
          text={t('agency.layout.pendingText')}
          action={<Button variant="outline" asChild><Link to="/">{t('agency.layout.backToTejaraa')}</Link></Button>}
        />
      );
    }

    if (agency.status === 'rejected' || agency.status === 'suspended') {
      return (
        <StatusCard
          icon={<XCircle className="h-6 w-6" />}
          title={agency.status === 'rejected' ? t('agency.layout.rejectedTitle') : t('agency.layout.suspendedTitle')}
          text={t('agency.layout.contactText')}
          action={<Button variant="outline" asChild><Link to="/contact">{t('agency.layout.contactUs')}</Link></Button>}
        />
      );
    }
  }

  return (
    <div
      className="dashboard-with-retail-header retail-theme min-h-screen w-full relative bg-gradient-to-br from-[hsl(152_30%_98%)] via-white to-[hsl(45_60%_97%)]"
      style={{ '--dash-header-h': `${headerH}px` } as React.CSSProperties}
    >
      <div ref={headerRef} className="sticky top-0 z-50 shadow-sm">
        <AgencyPortalHeader />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] -z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 30% 0%, hsl(152 60% 92% / 0.55) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 90% 0%, hsl(45 80% 90% / 0.4) 0%, transparent 70%)',
        }}
      />
      <CommandDeck
        sections={agencyNavigation}
        variant="agency"
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <button
        onClick={() => setMobileOpen(true)}
        aria-label={t('agency.layout.openMenu')}
        className="lg:hidden fixed left-3 z-30 h-10 w-10 rounded-full bg-white/95 backdrop-blur shadow-md ring-1 ring-border/60 inline-flex items-center justify-center text-foreground/80 hover:bg-white"
        style={{ top: 'calc(var(--dash-header-h, 0px) + 0.75rem)' }}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className={`relative ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[260px]'} flex flex-col min-h-screen transition-[margin] duration-300`}>
        <main className="flex-1 px-3 md:px-6 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
          <div className="mx-auto max-w-[1400px] space-y-4 md:space-y-6">
            {supplierBrowsing ? (
              <div className="rounded-lg border border-retail-border bg-retail-light-green/50 px-4 py-3 text-sm text-retail-dark-green">
                {t('agency.layout.supplierBrowsing')}
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgencyLayout;
