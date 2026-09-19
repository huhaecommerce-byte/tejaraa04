import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierRequirements } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

export function SupplierRequirements() {
  const { t } = useLocale();
  return (
    <section id="requirements" className="scroll-mt-28 py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          eyebrow={t('supplier.requirements.eyebrow')}
          title={t('supplier.requirements.title')}
          description={t('supplier.requirements.description')}
        />
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {supplierRequirements.map((item) => (
            <article key={item.title} className="flex h-full gap-4 rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-retail-dark-green">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-retail-muted">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-retail-muted">
          {t('supplier.requirements.note')}
        </p>
        <SupplierSectionLink align="left" to="/partners/requirements" label={t('supplier.requirements.sectionLink')} />
      </SupplierContainer>
    </section>
  );
}
