import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SupplierContainer } from './SupplierContainer';
import { SupplierSectionHeading } from './SupplierSectionHeading';
import { supplierNavPages } from '@/data/supplierPages';
import { useLocale } from '@/i18n/LocaleProvider';

/** Cross-links so no supplier page is a dead end. */
export function RelatedSupplierPages({ current, only }: { current?: string; only?: string[] }) {
  const { t } = useLocale();
  const pages = supplierNavPages
    .filter((page) => page.to !== current)
    .filter((page) => (only ? only.includes(page.to) : true))
    .slice(0, 3);

  if (pages.length === 0) return null;

  return (
    <section className="border-t border-retail-border bg-white py-10 lg:py-12">
      <SupplierContainer>
        <SupplierSectionHeading eyebrow={t('supplier.common.keepReading')} title={t('supplier.common.relatedInfo')} />
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {pages.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="group rounded-xl border border-retail-border bg-retail-page p-5 transition-colors hover:border-retail-green/40 hover:bg-retail-light-green/60"
            >
              <h3 className="text-base font-bold text-retail-dark-green">{page.label}</h3>
              <p className="mt-1.5 text-sm leading-6 text-retail-muted">{page.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-retail-green">
                {t('supplier.common.readMore')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </SupplierContainer>
    </section>
  );
}
