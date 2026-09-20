import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck, Bell, Building2, CircleDollarSign, ExternalLink, FileClock, LayoutDashboard, Link2,
  LineChart, LogOut, Menu, MoreHorizontal, Package, Plus, Search, Settings, ShieldCheck, ShoppingCart, Store, X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { brandConfig } from "@/config/partnerBrand";
import { useLocale } from "@/i18n/LocaleProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/partners/useAuth";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

type NavItem = { label: string; icon: Icon; to: string; children?: { label: string; icon: Icon; to: string }[] };

function getNavGroups(t: (key: any) => string): { label: string; items: NavItem[] }[] {
  return [
    {
      label: t("supplier.shell.nav.catalog"),
      items: [
        { label: t("supplier.shell.nav.dashboard"), icon: LayoutDashboard, to: "/partners/dashboard" },
        {
          label: t("supplier.shell.nav.products"),
          icon: Package,
          to: "/partners/products",
          children: [{ label: t("supplier.shell.nav.addProducts"), icon: Plus, to: "/partners/products/new" }],
        },
        {
          label: t("supplier.shell.nav.importFromLink"),
          icon: Link2,
          to: "/partners/products/import",
          children: [{ label: t("supplier.shell.nav.drafts"), icon: FileClock, to: "/partners/products/drafts" }],
        },
      ],
    },
    {
      label: t("supplier.shell.nav.sales"),
      items: [
        { label: t("supplier.shell.nav.orders"), icon: ShoppingCart, to: "/partners/orders" },
        { label: t("supplier.shell.nav.analytics"), icon: LineChart, to: "/partners/analytics" },
      ],
    },
    {
      label: t("supplier.shell.nav.business"),
      items: [
        { label: t("supplier.shell.nav.finance"), icon: CircleDollarSign, to: "/partners/finance" },
        { label: t("supplier.shell.nav.verification"), icon: BadgeCheck, to: "/partners/verification" },
        { label: t("supplier.shell.nav.companyProfile"), icon: Building2, to: "/partners/profile" },
        { label: t("supplier.shell.nav.settings"), icon: Settings, to: "/partners/settings" },
      ],
    },
  ];
}

function getMobileNav(t: (key: any) => string) {
  return [
    { label: t("supplier.shell.nav.home"), icon: LayoutDashboard, to: "/partners/dashboard" },
    { label: t("supplier.shell.nav.products"), icon: Package, to: "/partners/products" },
    { label: t("supplier.shell.nav.orders"), icon: ShoppingCart, to: "/partners/orders" },
    { label: t("supplier.shell.nav.finance"), icon: CircleDollarSign, to: "/partners/finance" },
  ] as const;
}

function SignOutItem({ onSignOut, onNavigate }: { onSignOut?: () => void; onNavigate?: () => void }) {
  const { t } = useLocale();
  if (!onSignOut) return null;
  return (
    <button
      type="button"
      onClick={() => { onNavigate?.(); onSignOut(); }}
      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {t("supplier.shell.signOut")}
    </button>
  );
}

function StorefrontButton({ onNavigate }: { onNavigate?: () => void }) {
  const { t, dir } = useLocale();
  return (
    <a
      href="/"
      onClick={onNavigate}
      className="mb-4 flex items-center gap-2.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:translate-y-[-1px] hover:shadow-lg"
    >
      <Store className="h-4 w-4 shrink-0" />
      {t("supplier.shell.storefront")}
      <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-80" />
    </a>
  );
}

function NavList({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin?: boolean }) {
  const { t } = useLocale();
  const navGroups = getNavGroups(t);
  return (
    <nav className="space-y-4">
      <StorefrontButton onNavigate={onNavigate} />
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/partners/dashboard" }}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-primary"
                  activeProps={{ className: "flex items-center gap-2.5 rounded-xl bg-primary px-2.5 py-2 text-xs font-bold text-primary-foreground shadow-button" }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2.5">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          to={child.to}
                          onClick={onNavigate}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-primary"
                          activeProps={{ className: "flex items-center gap-2 rounded-lg bg-accent px-2 py-1.5 text-[11px] font-bold text-primary" }}
                        >
                          <child.icon className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {isAdmin && (
        <div>
          <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t("supplier.shell.nav.administration")}</p>
          <ul className="space-y-0.5">
            <li>
              <Link
                to="/partners/admin"
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-primary"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {t("supplier.shell.nav.adminPanel")}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

export function SupplierShell({
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
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [account, setAccount] = useState(false);
  const [query, setQuery] = useState("");
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { companyName, contactName, application, products, orders, settings } = useSupplierWorkspace();

  const statusLabel =
    application?.status === "approved" ? t("supplier.shell.statusVerified")
    : application?.status === "rejected" ? t("supplier.shell.statusRejected")
    : application ? t("supplier.shell.statusPending")
    : t("supplier.shell.statusDefault");

  const threshold = settings?.low_stock_threshold ?? 10;
  const notifications: { text: string; to: string }[] = [];
  if (!application) notifications.push({ text: t("supplier.shell.notif.notSubmitted"), to: "/partners/join" });
  else if (application.status === "pending") notifications.push({ text: t("supplier.shell.notif.underReview"), to: "/partners/verification" });
  else if (application.status === "rejected") notifications.push({ text: t("supplier.shell.notif.rejected"), to: "/partners/verification" });
  const newOrders = orders.filter((o) => o.status === "New").length;
  if (newOrders) notifications.push({ text: t("supplier.shell.notif.newOrders").replace("{count}", String(newOrders)).replace("{plural}", newOrders === 1 ? "" : "s"), to: "/partners/orders" });
  const lowStock = products.filter((p) => p.stock <= threshold).length;
  if (lowStock) notifications.push({ text: t("supplier.shell.notif.lowStock").replace("{count}", String(lowStock)).replace("{plural}", lowStock === 1 ? "" : "s").replace("{threshold}", String(threshold)), to: "/partners/products" });
  const pendingProducts = products.filter((p) => p.status === "pending").length;
  if (pendingProducts) notifications.push({ text: t("supplier.shell.notif.pendingListings").replace("{count}", String(pendingProducts)).replace("{plural}", pendingProducts === 1 ? "" : "s"), to: "/partners/products" });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div dir={dir} className="supplier-theme min-h-screen overflow-x-clip bg-secondary/40 text-foreground">
      <div className="mx-auto flex w-full max-w-[1720px] gap-4 lg:px-6 lg:py-5">
        {/* Sidebar */}
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-56 shrink-0 flex-col rounded-2xl border border-border bg-card p-3 shadow-card lg:flex">
          <Link to="/" className="mb-4 flex items-center gap-2.5 px-1">
            <BrandLogo variant="sidebar" />
          </Link>
          <div className="flex-1 overflow-y-auto hide-scrollbar"><NavList isAdmin={isAdmin} /></div>
          <div className="mt-3 rounded-card border border-border bg-accent/40 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary"><BadgeCheck className="h-3.5 w-3.5" /> {statusLabel}</p>
            <p className="mt-0.5 text-[10px] leading-3 text-muted-foreground">{companyName || t("supplier.shell.companyDetailsNotSet")}</p>
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <SignOutItem onSignOut={signOut} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label={t("supplier.shell.closeMenu")} onClick={() => setOpen(false)} className="absolute inset-0 bg-foreground/40" />
            <div className="absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col overflow-y-auto bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-nav">
              <div className="mb-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                  <BrandLogo variant="sidebar" />
                </Link>
                <button type="button" aria-label={t("supplier.shell.closeMenu")} onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1"><NavList onNavigate={() => setOpen(false)} isAdmin={isAdmin} /></div>
              <div className="mt-5 rounded-card border border-border bg-accent/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary"><BadgeCheck className="h-4 w-4" /> {statusLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{companyName || t("supplier.shell.companyDetailsNotSet")}</p>
              </div>
              <div className="mt-3 border-t border-border pt-2">
                <SignOutItem onSignOut={() => { setOpen(false); signOut(); }} />
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card/95 px-3 pb-2.5 pt-[calc(.625rem+env(safe-area-inset-top))] backdrop-blur-xl lg:static lg:flex lg:flex-wrap lg:rounded-2xl lg:border lg:px-3 lg:py-2.5 lg:shadow-card">
            <button type="button" aria-label={t("supplier.shell.openMenu")} onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-border lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0 lg:hidden"><p className="truncate text-sm font-extrabold">{title}</p><p className="truncate text-[10px] text-muted-foreground">{companyName || brandConfig.name}</p></div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                navigate({ to: "/partners/products", search: { q: query } });
              }}
              className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 sm:flex"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <label className="min-w-0 flex-1">
                <span className="sr-only">{t("supplier.shell.searchProducts")}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("supplier.shell.searchPlaceholder")}
                  className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
                />
              </label>
            </form>
            <div className="flex items-center gap-2 lg:ml-auto">
              <div className="relative">
                <button
                  type="button"
                  aria-label={t("supplier.shell.notifications")}
                  onClick={() => { setBell((v) => !v); setAccount(false); }}
                  className="relative grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground lg:h-9 lg:w-9"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
                {bell && (
                  <div className="fixed inset-x-3 top-[calc(4.5rem+env(safe-area-inset-top))] z-40 rounded-card border border-border bg-card p-2 shadow-nav sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-1.5 sm:w-72">
                    {notifications.length === 0 && <p className="px-2 py-3 text-[11px] text-muted-foreground">{t("supplier.shell.notif.allCaughtUp")}</p>}
                    {notifications.map((item) => (
                      <Link
                        key={item.text}
                        to={item.to}
                        onClick={() => setBell(false)}
                        className="block rounded-lg px-2 py-2 text-[11px] font-semibold text-muted-foreground hover:bg-accent/60 hover:text-primary"
                      >
                        {item.text}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => { setAccount((v) => !v); setBell(false); }}
                  className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-primary">
                    {contactName ? contactName.slice(0, 2).toUpperCase() : "—"}
                  </span>
                  <span className="hidden text-[11px] font-bold sm:block">{contactName || t("supplier.shell.yourAccount")}</span>
                </button>
                {account && (
                  <div className="absolute right-0 z-40 mt-1.5 w-52 rounded-card border border-border bg-card p-1.5 shadow-nav">
                    <Link to="/partners/profile" onClick={() => setAccount(false)} className="block rounded-lg px-2 py-2 text-[11px] font-bold text-muted-foreground hover:bg-accent/60 hover:text-primary">{t("supplier.shell.companyProfile")}</Link>
                    <Link to="/partners/settings" onClick={() => setAccount(false)} className="block rounded-lg px-2 py-2 text-[11px] font-bold text-muted-foreground hover:bg-accent/60 hover:text-primary">{t("supplier.shell.settings")}</Link>
                    <button type="button" onClick={signOut} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[11px] font-bold text-destructive hover:bg-destructive/10">
                      <LogOut className="h-3.5 w-3.5" /> {t("supplier.shell.signOut")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="hero-surface relative mx-3 mt-3 overflow-hidden rounded-2xl px-4 py-5 text-white shadow-card lg:mx-0 lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-3 lg:px-6 lg:py-6">
            <div className="hero-grid absolute inset-0 opacity-15" aria-hidden="true" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">{brandConfig.name} {t("supplier.shell.portalSuffix")}</p>
              <h1 className="mt-1 text-lg font-extrabold sm:text-2xl">{title}</h1>
              <p className="mt-1 max-w-2xl text-[11px] text-white/80 sm:text-xs">{subtitle}</p>
            </div>
            {actions && (
              <div className="relative mt-3 grid grid-cols-2 gap-2 lg:mt-0 sm:flex sm:flex-wrap sm:items-center lg:flex [&>a]:border-transparent [&>a]:bg-white [&>a]:text-primary [&>a]:shadow-button [&>button]:border-transparent [&>button]:bg-white [&>button]:text-primary [&>button]:shadow-button">
                {actions}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-3 px-3 lg:px-0 lg:pb-6">{children}</div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur-xl lg:hidden" aria-label={t("supplier.shell.navigationAria")}>
        {getMobileNav(t).map((item) => <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/partners/dashboard" }} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground" activeProps={{ className: "flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-primary" }}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link>)}
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground" aria-label={t("supplier.shell.morePagesAria")}><MoreHorizontal className="h-5 w-5" /><span>{t("supplier.shell.more")}</span></button>
      </nav>
    </div>
  );
}

export function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note?: string; icon: Icon }) {
  return (
    <div className="rounded-card border border-border bg-card p-3 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-1.5 text-lg font-extrabold">{value}</p>
      {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card shadow-card">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const primaryClass = "inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60";
const ghostClass = "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-60";

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return <button type={type} onClick={onClick} disabled={disabled} className={primaryClass}>{children}</button>;
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return <button type={type} onClick={onClick} disabled={disabled} className={ghostClass}>{children}</button>;
}

export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className={primaryClass}>{children}</Link>;
}

export function GhostLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className={ghostClass}>{children}</Link>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-10 sm:text-xs";

export const lockedInputClass =
  "h-10 w-full select-none cursor-not-allowed rounded-xl border border-border bg-secondary/70 px-3 text-xs font-semibold text-foreground/70 outline-none";

export function Tabs({ items, value, onChange }: { items: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
            item === value ? "bg-primary text-primary-foreground shadow-button" : "border border-border bg-card text-muted-foreground hover:text-primary"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

const toneClass: Record<string, string> = {
  positive: "bg-success-soft text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-secondary text-muted-foreground",
  info: "bg-accent text-primary",
};

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: keyof typeof toneClass | string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClass[tone] ?? toneClass["neutral"]}`}>{label}</span>;
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return <th scope="col" className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}

export function Td({ children, align = "left", strong = false }: { children: ReactNode; align?: "left" | "right"; strong?: boolean }) {
  return <td className={`px-3 py-2.5 text-xs ${align === "right" ? "text-right" : "text-left"} ${strong ? "font-bold text-foreground" : "text-muted-foreground"}`}>{children}</td>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-b-2xl">
      <div className="mobile-table-scroll overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse sm:min-w-[760px] md:min-w-[880px]">{children}</table>
      </div>
    </div>
  );
}
