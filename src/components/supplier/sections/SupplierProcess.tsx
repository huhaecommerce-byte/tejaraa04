import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierJourney } from '@/data/supplierPages';
import { useLocale } from '@/i18n/LocaleProvider';

/** Landing summary of the canonical supplier journey (full detail at /partners/how-it-works). */
export function SupplierProcess() {
  const { t } = useLocale();
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-retail-dark-green py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          onDark
          align="center"
          eyebrow={t('supplier.process.eyebrow')}
          title={t('supplier.process.title')}
          description={t('supplier.process.description', { count: supplierJourney.length })}
        />
        {/* Desktop: connected columns. Mobile: vertical timeline. */}
        <ol className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {supplierJourney.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-white/12 bg-white/[0.06] p-5 xl:flex-col xl:gap-3">
              <div className="flex flex-col items-center xl:flex-row xl:gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-gold text-retail-dark-green">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span aria-hidden className="mt-2 w-px flex-1 bg-white/15 xl:mt-0 xl:hidden" />
                <span className="hidden text-xs font-bold tracking-[0.14em] text-white/50 xl:inline">
                  {t('supplier.process.step', { n: index + 1 })}
                </span>
              </div>
              <div className="min-w-0 pb-1">
                <span className="text-xs font-bold tracking-[0.14em] text-white/50 xl:hidden">{t('supplier.process.step', { n: index + 1 })}</span>
                <h3 className="mt-1 text-base font-bold text-white xl:mt-0">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/70">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <SupplierSectionLink onDark to="/partners/how-it-works" label={t('supplier.process.sectionLink')} />
      </SupplierContainer>
    </section>
  );
}
