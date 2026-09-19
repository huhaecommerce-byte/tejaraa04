import type { ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import sellerWorkspaceImage from '@/assets/seller/seller-auth-warehouse.jpg';

interface SellerAuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

const proofPoints = [
  { icon: ShieldCheck, label: 'FBA & FBN compliance handled' },
  { icon: Zap, label: 'Same-day dispatch across KSA' },
  { icon: Users, label: '500+ sellers grow with Tejaraa' },
];

export function SellerAuthShell({ eyebrow, title, subtitle, children, footer, wide = false }: SellerAuthShellProps) {
  return (
    <div className="retail-theme min-h-[100dvh] bg-background text-foreground">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
        <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-retail-dark-green text-primary-foreground lg:block">
          <img
            src={sellerWorkspaceImage}
            alt="A Saudi e-commerce seller preparing orders in a fulfilment workspace"
            width={1408}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-retail-dark-green via-retail-dark-green/80 to-retail-dark-green/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-retail-dark-green via-transparent to-retail-dark-green/30" />
          <div className="relative z-10 flex min-h-[100dvh] flex-col p-10 xl:p-14">
            <Link to="/selling" className="w-fit rounded-md bg-background/95 px-3 py-1 shadow-sm">
              <BrandLogo variant="storefront" />
            </Link>
            <div className="my-auto max-w-lg py-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="h-4 w-4" /> Dropshipping &amp; Selling
              </span>
              <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight xl:text-5xl">
                You sell more.<br />We handle the rest.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-primary-foreground/80">
                Sourcing, prep, and fulfilment from one dashboard built for Amazon and Noon sellers in Saudi Arabia.
              </p>
              <div className="mt-8 grid gap-3">
                {proofPoints.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 border-b border-primary-foreground/15 pb-3 text-sm font-semibold">
                    <item.icon className="h-5 w-5 shrink-0 text-retail-gold" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-primary-foreground/65">© 2026 Tejaraa.com · Built for KSA sellers</p>
          </div>
        </aside>

        <main className="flex min-h-[100dvh] flex-col bg-retail-page px-4 py-5 sm:px-8 lg:px-10 lg:py-8 xl:px-16">
          <div className="flex items-center justify-between lg:hidden">
            <Link to="/selling"><BrandLogo variant="storefront" /></Link>
            <Link to="/selling" aria-label="Back to selling programme" className="flex h-10 w-10 items-center justify-center rounded-md border border-retail-border bg-retail-card text-retail-dark-green">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center py-8 lg:py-10">
            <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
              <Link to="/selling" className="mb-7 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5">
                <ArrowLeft className="h-4 w-4" /> Back to programme
              </Link>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-retail-medium-green">{eyebrow}</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-retail-dark-green sm:text-4xl">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-retail-muted">{subtitle}</p>
              </div>
              <div className="rounded-lg border border-retail-border bg-retail-card p-5 shadow-sm sm:p-7">{children}</div>
              {footer ? <div className="mt-5 text-center text-sm text-retail-muted">{footer}</div> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-retail-muted">
            {['Free to start', 'Secure seller access', 'Built for KSA sellers'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-retail-green" />{item}</span>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
