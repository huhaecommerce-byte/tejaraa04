import { Link } from '@/lib/router-compat';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { cn } from '@/lib/utils';

/* ── Breadcrumbs ───────────────────────────────────────────────── */
export interface AgencyCrumb {
  label: string;
  to?: string;
}

/** Compact agency breadcrumb: Agencies & VAs > How It Works */
export function AgencyBreadcrumbs({ items }: { items: AgencyCrumb[] }) {
  const trail: AgencyCrumb[] = [{ label: 'Agencies & VAs', to: '/agency' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="border-b border-retail-border bg-white">
      <SellerContainer>
        <ol className="flex flex-wrap items-center gap-1 py-2.5 text-xs text-retail-muted sm:text-[0.8125rem]">
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={crumb.label} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-retail-muted/60" aria-hidden /> : null}
                {crumb.to && !last ? (
                  <Link to={crumb.to} className="font-medium hover:text-retail-dark-green hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className="font-semibold text-retail-dark-green">
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </SellerContainer>
    </nav>
  );
}

/* ── Sub-page hero ─────────────────────────────────────────────── */
interface AgencyPageHeroProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  tags?: string[];
  flow?: string[];
  flowCaption?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

/** Agency sub-page hero mirroring the Seller service hero. */
export function AgencyPageHero({
  icon: Icon, eyebrow, title, lead, tags = [], flow, flowCaption,
  primaryLabel = 'Apply to join', primaryTo = '/agency/apply',
  secondaryLabel = 'Partner sign in', secondaryTo = '/agency/signin',
}: AgencyPageHeroProps) {
  return (
    <section className="hero-surface relative flex items-center overflow-hidden py-9 text-white lg:py-11">
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
      <SellerContainer
        className={cn(
          'relative grid items-center gap-6',
          flow ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10' : '',
        )}
      >
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-retail-gold">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.45rem]">{title}</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-white/80">{lead}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white font-semibold text-retail-dark-green hover:bg-retail-light-green">
              <Link to={primaryTo}>
                {primaryLabel}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={secondaryTo}>{secondaryLabel}</Link>
            </Button>
          </div>

          {tags.length ? (
            <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-white/70">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full border border-white/15 px-2.5 py-1">{tag}</li>
              ))}
            </ul>
          ) : null}
        </div>

        {flow ? (
          <div className="rounded-lg border border-white/15 bg-white/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-retail-gold">The flow</p>
            <ol className="mt-3 grid gap-1">
              {flow.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-md bg-white/[0.06] px-3 py-1.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-retail-gold text-[0.7rem] font-extrabold text-retail-dark-green">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-white/90">{step}</span>
                </li>
              ))}
            </ol>
            {flowCaption ? <p className="mt-3 text-xs leading-5 text-white/60">{flowCaption}</p> : null}
          </div>
        ) : null}
      </SellerContainer>
    </section>
  );
}

/* ── Call to action ────────────────────────────────────────────── */
interface AgencyCTAProps {
  title: string;
  text: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  variant?: 'light' | 'dark';
}

export function AgencyCTA({
  title, text,
  primaryLabel = 'Apply to join', primaryTo = '/agency/apply',
  secondaryLabel, secondaryTo,
  variant = 'light',
}: AgencyCTAProps) {
  const dark = variant === 'dark';
  return (
    <section className={cn('py-11 lg:py-13', dark ? 'bg-retail-green' : 'border-y border-retail-border bg-retail-light-green')}>
      <SellerContainer className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <h2 className={cn('text-2xl font-extrabold tracking-tight sm:text-3xl', dark ? 'text-white' : 'text-retail-dark-green')}>
            {title}
          </h2>
          <p className={cn('mt-3 max-w-2xl text-base leading-7', dark ? 'text-white/80' : 'text-retail-muted')}>{text}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className={cn('font-semibold', dark ? 'bg-white text-retail-dark-green hover:bg-retail-light-green' : 'bg-retail-green text-white hover:bg-retail-dark-green')}
          >
            <Link to={primaryTo}>
              {primaryLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          {secondaryLabel && secondaryTo && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn('font-semibold', dark ? 'border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white' : 'border-retail-green/35 bg-white text-retail-dark-green hover:bg-white/70')}
            >
              <Link to={secondaryTo}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      </SellerContainer>
    </section>
  );
}

/* ── Feature list (bordered, seller-style) ─────────────────────── */
export interface AgencyFeature {
  icon: LucideIcon;
  title: string;
  text: string;
}

export function AgencyFeatureList({ items, columns = 3 }: { items: AgencyFeature[]; columns?: 2 | 3 | 4 }) {
  return (
    <ul
      className={cn(
        'grid gap-x-5 gap-y-6',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="border-t-2 border-retail-green pt-4">
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 shrink-0 text-retail-green" aria-hidden />
            <h3 className="text-sm font-bold text-retail-dark-green">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-retail-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}
