import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { supplyModelDetails, supplierApprovalDisclaimer } from '@/data/supplierPages';
import { useLocale } from '@/i18n/LocaleProvider';

/** Detailed explanation of the ways Tejaraa works with suppliers. */
export function SupplyModelSections() {
  const { t } = useLocale();
  return (
    <section className="bg-retail-page py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          eyebrow={t('supplier.modelSections.eyebrow')}
          title={t('supplier.modelSections.title')}
          description={t('supplier.modelSections.description')}
        />

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {supplyModelDetails.map((model) => (
            <article key={model.id} id={model.id} className="scroll-mt-28 rounded-2xl border border-retail-border bg-white p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-retail-light-green text-retail-dark-green">
                  <model.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-retail-dark-green">{t(model.title)}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-retail-muted">{t('supplier.modelSections.bestFor')}</p>
                  <p className="mt-1 text-sm leading-6 text-retail-text">{t(model.bestFor)}</p>
                  <p className="mt-3 text-sm leading-6 text-retail-muted">{t(model.intro)}</p>
                  <ul className="mt-3 space-y-1.5">
                    {model.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm leading-6 text-retail-text">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-green" />
                        {t(point)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-retail-border bg-white p-5">
          <p className="text-sm leading-6 text-retail-muted">{t(supplierApprovalDisclaimer)}</p>
          <Link
            to="/partners/categories"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-retail-green hover:underline"
          >
            {t('supplier.modelSections.categoriesLink')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </SupplierContainer>
    </section>
  );
}
