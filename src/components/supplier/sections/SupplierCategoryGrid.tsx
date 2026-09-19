import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierCategories } from '@/data/supplierPartners';

export function SupplierCategoryGrid() {
  return (
    <section id="categories" className="scroll-mt-28 border-y border-retail-border bg-white py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow="Categories of interest"
          title="Categories we review"
          description="Product areas our team looks at today. If your range sits close to one of these, send it in for review."
        />
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {supplierCategories.map((category) => (
            <article key={category.name} className="overflow-hidden rounded-xl border border-retail-border bg-white">
              <img
                src={category.image}
                alt={`${category.name} products supplied to Tejaraa`}
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
        <SupplierSectionLink to="/partners/categories" label="See example product types per category" />
      </SupplierContainer>
    </section>
  );
}
