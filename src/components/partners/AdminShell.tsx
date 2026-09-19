import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Boxes, ClipboardCheck, Flag, LayoutDashboard, LogOut, Menu, MoreHorizontal, PackageCheck, Plug, ShieldCheck, ShoppingCart, Store, Users, Wallet, X } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/partners/useAuth";
import { canAct, canOpenPath, type AppRole } from "@/lib/partners/permissions";
import { useLocale } from "@/i18n/LocaleProvider";

type Icon = ComponentType<{ className?: string }>;

type NavItem = { label: string; to: string; icon: Icon };
type NavSection = { title: string; items: NavItem[] };

function useNavSections(): NavSection[] {
  const { t } = useLocale();
  return [
    {
      title: t("supplier.admin.nav.dashboard"),
      items: [
        { label: t("supplier.admin.nav.overview"), to: "/partners/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: t("supplier.admin.nav.wholesalersGroup"),
      items: [
        { label: t("supplier.admin.nav.pendingApplications"), to: "/partners/admin/applications", icon: BadgeCheck },
        { label: t("supplier.admin.nav.wholesalers"), to: "/partners/admin/suppliers", icon: Users },
      ],
    },
    {
      title: t("supplier.admin.nav.productsGroup"),
      items: [
        { label: t("supplier.admin.nav.productApprovals"), to: "/partners/admin/products", icon: ClipboardCheck },
        { label: t("supplier.admin.nav.liveProducts"), to: "/partners/admin/live-products", icon: PackageCheck },
      ],
    },
    {
      title: t("supplier.admin.nav.salesGroup"),
      items: [
        { label: t("supplier.admin.nav.ordersPerformance"), to: "/partners/admin/orders", icon: ShoppingCart },
        { label: t("supplier.admin.nav.payoutDetails"), to: "/partners/admin/payouts", icon: Wallet },
      ],
    },
    {
      title: t("supplier.admin.nav.platformGroup"),
      items: [
        { label: t("supplier.admin.nav.marketFlags"), to: "/partners/admin/markets", icon: Flag },
        { label: t("supplier.admin.nav.projectConnections"), to: "/partners/admin/connections", icon: Plug },
        { label: t("supplier.admin.nav.supplierIntegrations"), to: "/partners/admin/supplier-integrations", icon: Boxes },
        { label: t("supplier.admin.nav.teamRoles"), to: "/partners/admin/team", icon: ShieldCheck },
      ],
    },
  ];
}

function visibleSections(sections: NavSection[], roles: AppRole[]): NavSection[] {
  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => canOpenPath(roles, item.to)) }))
    .filter((section) => section.items.length > 0);
}

function NavList({ roles, onNavigate }: { roles: AppRole[]; onNavigate?: () => void }) {
  const navSections = useNavSections();
  return (
    <nav className="space-y-3">
      {visibleSections(navSections, roles).map((section) => (
        <div key={section.title}>
          <p className="mb-1 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{section.title}</p>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/partners/admin" }}
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-primary"
                activeProps={{ className: "flex items-center gap-2.5 rounded-xl bg-primary px-2.5 py-2 text-xs font-bold text-primary-foreground shadow-button" }}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function useMobileNav() {
  const { t } = useLocale();
  return [
    { label: t("supplier.admin.nav.overview"), to: "/partners/admin", icon: LayoutDashboard },
    { label: t("supplier.admin.mobile.applications"), to: "/partners/admin/applications", icon: BadgeCheck },
    { label: t("supplier.admin.nav.wholesalers"), to: "/partners/admin/suppliers", icon: Users },
    { label: t("supplier.admin.nav.productsGroup"), to: "/partners/admin/products", icon: ClipboardCheck },
  ] as const;
}


export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { roles, loading: rolesLoading } = useAuth();
  const readOnly = !rolesLoading && roles.length > 0 && !canAct(roles);
  const mobileNav = useMobileNav();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/partners/signin", replace: true });
  };

  return (
    <div className="supplier-theme min-h-screen overflow-x-clip bg-secondary/40 text-foreground">
      <div className="mx-auto flex w-full max-w-[1720px] gap-4 lg:px-6 lg:py-5">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-56 shrink-0 flex-col rounded-2xl border border-border bg-card p-3 shadow-card lg:flex">
          <Link to="/" className="mb-4 flex items-center gap-2.5 px-1">
            <BrandLogo variant="sidebar" />
          </Link>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar"><NavList roles={roles} /></div>
          <Link
            to="/partners/dashboard"
            className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Store className="h-4 w-4" /> {t("supplier.admin.viewAsSupplier")}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <LogOut className="h-4 w-4" /> {t("supplier.admin.signOut")}
          </button>
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label={t("supplier.admin.closeMenu")} onClick={() => setOpen(false)} className="absolute inset-0 bg-foreground/40" />
            <div className="absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col overflow-y-auto bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-nav">
              <div className="mb-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                  <BrandLogo variant="sidebar" />
                </Link>
                <button type="button" aria-label={t("supplier.admin.closeMenu")} onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1"><NavList roles={roles} onNavigate={() => setOpen(false)} /></div>
              <div className="mt-5 border-t pt-3">
                <Link
                  to="/partners/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent/60 hover:text-primary"
                >
                  <Store className="h-4 w-4" /> {t("supplier.admin.viewAsSupplier")}
                </Link>
                <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> {t("supplier.admin.signOut")}</button>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-border bg-card/95 px-3 pb-2.5 pt-[calc(.625rem+env(safe-area-inset-top))] backdrop-blur-xl lg:static lg:flex lg:rounded-2xl lg:border lg:px-3 lg:py-2.5 lg:shadow-card">
            <button type="button" aria-label={t("supplier.admin.openMenu")} onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-border lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0"><p className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-primary lg:block">{t("supplier.admin.console")}</p><p className="truncate text-sm font-extrabold lg:hidden">{title}</p><p className="truncate text-[10px] text-muted-foreground lg:hidden">{t("supplier.admin.console")}</p></div>
          </header>

          <div className="px-3 pt-4 lg:mt-3 lg:flex lg:flex-wrap lg:items-end lg:justify-between lg:gap-2.5 lg:px-0 lg:pt-0">
            <div className="hidden lg:block">
              <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {actions && !readOnly && <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
          </div>

          {readOnly && (
            <div className="mt-3 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground lg:mx-0">
              {t("supplier.admin.viewOnlyNotice")}
            </div>
          )}

          <div
            className={`mt-3 space-y-3 px-3 lg:px-0 lg:pb-6${
              readOnly ? " [&_button]:pointer-events-none [&_button]:opacity-50 [&_input]:pointer-events-none [&_select]:pointer-events-none [&_textarea]:pointer-events-none" : ""
            }`}
          >
            {children}
          </div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur-xl lg:hidden" aria-label={t("supplier.admin.nav.aria")}>
        {mobileNav.filter((item) => canOpenPath(roles, item.to)).map((item) => <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/partners/admin" }} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground" activeProps={{ className: "flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-primary" }}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link>)}
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground" aria-label={t("supplier.admin.morePages")}><MoreHorizontal className="h-5 w-5" /><span>{t("supplier.admin.more")}</span></button>
      </nav>
    </div>
  );
}
