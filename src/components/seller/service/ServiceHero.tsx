import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { useLocale } from '@/i18n/LocaleProvider';

interface ServiceHeroProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  lead: string;
  tags: string[];
  /** Short workflow shown on the right — text equivalent of the diagram. */
  flow: string[];
  flowCaption?: string;
  secondaryLabel: string;
}

/**
 * Service page hero: LEFT title/explanation/CTA/tags, RIGHT workflow diagram.
 * Deliberately shorter than the /selling homepage hero.
 */
export function ServiceHero({
  icon: Icon, eyebrow, title, lead, tags, flow, flowCaption, secondaryLabel,
}: ServiceHeroProps) {
  const { t, dir } = useLocale();
  const resolvedEyebrow = eyebrow ?? t('selling.svc.ui.eyebrowService');
  return (
    <section dir={dir} className="hero-surface relative flex items-center overflow-hidden py-9 text-white lg:py-11">
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
      <SellerContainer className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-retail-gold">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {resolvedEyebrow}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.45rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-white/80">{lead}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white font-semibold text-retail-dark-green hover:bg-retail-light-green">
              <Link to="/selling/signup">
                {t('selling.svc.ui.getStarted')}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#enquiry">{secondaryLabel}</a>
            </Button>
          </div>

          <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-white/70">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full border border-white/15 px-2.5 py-1">{tag}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/[0.06] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-retail-gold">The workflow</p>
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
      </SellerContainer>
    </section>
  );
}
