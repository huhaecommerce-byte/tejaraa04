import { Link } from '@/lib/router-compat';
import { ArrowRight, Boxes, Factory, Store, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierApplyPath } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

const flowIcons = [Factory, Boxes, Truck, Store];
const flowKeys = ['products', 'review', 'supply', 'channels'] as const;

export function SupplierHero() {
  const { t } = useLocale();
  const flow = flowKeys.map((key, index) => ({
    icon: flowIcons[index],
    title: t(`supplier.hero.flow.${key}.title` as const),
    text: t(`supplier.hero.flow.${key}.text` as const),
  }));
  return (
    <section className="hero-surface relative flex items-center overflow-hidden text-white lg:min-h-[560px]">
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
      <SupplierContainer className="relative grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:py-16">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-retail-gold" />
            {t('supplier.hero.badge')}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] sm:text-5xl">
            {t('supplier.hero.titleLine1')}
            <br />
            <span className="text-retail-gold">{t('supplier.hero.titleLine2')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            {t('supplier.hero.text')}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-retail-gold font-bold text-retail-dark-green hover:bg-retail-gold/90">
              <Link to={supplierApplyPath}>
                {t('supplier.cta.becomeSupplier')}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
              <Link to="/partners/how-it-works">{t('supplier.hero.howItWorks')}</Link>
            </Button>
          </div>
          <p className="script-note mt-6 text-lg text-retail-gold">
            {t('supplier.hero.scriptNote')}
          </p>
          <p className="mt-3 text-sm font-semibold text-white/70">
            {t('supplier.hero.typesLine')}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">{t('supplier.hero.flowLabel')}</p>
          <ol className="mt-4 grid gap-2.5">
            {flow.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3 rounded-xl border border-white/12 bg-white/[0.06] p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/12 text-retail-gold">
                  <step.icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">
                    <span className="mr-1.5 text-retail-gold">0{index + 1}</span>
                    {step.title}
                  </span>
                  <span className="block text-xs leading-5 text-white/70">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </SupplierContainer>
    </section>
  );
}
