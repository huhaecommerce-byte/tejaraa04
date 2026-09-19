import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierCategories } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

export function SupplierCategoryGrid() {
  const { t } = useLocale();
  return (
    <section id="categories" className="scroll-mt-28 border-y border-retail-border bg-white py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow={t('supplier.categoryGrid.eyebrow')}
          title={t('supplier.categoryGrid.title')}
          description={t('supplier.categoryGrid.description')}
        />
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {supplierCategories.map((category) => (
            <article key={category.name} className="overflow-hidden rounded-xl border border-retail-border bg-white">
              <img
                src={category.image}
                alt={t('supplier.categoryGrid.altTemplate', { name: category.name })}
                width={480}
                height={360}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-sm font-bold text-retail-dark-green sm:text-base">{category.name}</h3>
                <p className="mt-1 text-xs leading-5 text-retail-muted sm:text-sm">{category.text}</p>
              </div>
            </article>
          ))}
        </div>
        <SupplierSectionLink to="/partners/categories" label={t('supplier.categoryGrid.sectionLink')} />
      </SupplierContainer>
    </section>
  );
}
