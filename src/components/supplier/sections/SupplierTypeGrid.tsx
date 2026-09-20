import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierApplyPath, supplierTypes } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

export function SupplierTypeGrid() {
  const { t } = useLocale();
  return (
    <section id="supplier-types" className="scroll-mt-28 py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow={t('supplier.typeGrid.eyebrow')}
          title={t('supplier.typeGrid.title')}
          description={t('supplier.typeGrid.description')}
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplierTypes.map((type) => (
            <article key={type.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <type.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{t(type.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{t(type.text)}</p>
              <Link
                to={supplierApplyPath}
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-retail-green hover:underline"
              >
                {t('supplier.typeGrid.applyPrefix', { type: t(type.title).toLowerCase().replace(/s$/, '') })}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
        <SupplierSectionLink to="/partners/who-can-supply" label={t('supplier.typeGrid.sectionLink')} />
      </SupplierContainer>
    </section>
  );
}
