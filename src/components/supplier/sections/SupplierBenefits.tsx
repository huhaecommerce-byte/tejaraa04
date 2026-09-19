import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { supplierBenefits } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

export function SupplierBenefits() {
  const { t } = useLocale();
  return (
    <section id="why-tejaraa" className="scroll-mt-28 border-y border-retail-border bg-white py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow={t('supplier.benefits.eyebrow')}
          title={t('supplier.benefits.title')}
          description={t('supplier.benefits.description')}
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplierBenefits.map((benefit) => (
            <article key={benefit.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-retail-page/70 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-dark-green text-retail-gold">
                <benefit.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{benefit.text}</p>
            </article>
          ))}
        </div>
      </SupplierContainer>
    </section>
  );
}
