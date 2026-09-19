import type { ReactNode } from 'react';
import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierContainer } from './SupplierContainer';

interface SupplierPageHeroProps {
  eyebrow: string;
  title: string;
  text: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
  /** Simple supplier / catalogue / distribution visual. */
  visual?: ReactNode;
}

/** Compact B2B hero for the /partners/* detail pages (smaller than the landing hero). */
export function SupplierPageHero({ eyebrow, title, text, primary, secondary, visual }: SupplierPageHeroProps) {
  return (
    <section className="hero-surface relative flex items-center overflow-hidden py-12 text-white lg:min-h-[560px] lg:py-16">
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
      <SupplierContainer className="relative">

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-gold">{eyebrow}</p>
            <h1 className="mt-2.5 text-3xl font-extrabold leading-[1.1] sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">{text}</p>
            {primary || secondary ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {primary ? (
                  <Button asChild size="lg" className="bg-retail-gold font-bold text-retail-dark-green hover:bg-retail-gold/90">
                    <Link to={primary.to}>
                      {primary.label}
                      <ArrowRight className="ms-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                ) : null}
                {secondary ? (
                  <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                    <Link to={secondary.to}>{secondary.label}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          {visual ? <div className="min-w-0">{visual}</div> : null}
        </div>
      </SupplierContainer>
    </section>
  );
}

/** Lightweight text panel used as the hero visual — no fake dashboards or metrics. */
export function SupplierHeroPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/80">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-gold" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
