import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierCategoryCards, supplierApplyRoute } from '@/data/supplierPages';

/** B2B category grid: which products a supplier can offer Tejaraa. */
export function SupplierCategoryDetail() {
  return (
    <section className="bg-retail-page py-11 lg:py-14">
      <SupplierContainer>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {supplierCategoryCards.map((category) => (
            <article key={category.name} className="flex flex-col overflow-hidden rounded-2xl border border-retail-border bg-white">
              <img
                src={category.image}
                alt={`${category.name} products supplied to Tejaraa`}
                width={480}
                height={360}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-bold text-retail-dark-green">{category.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-retail-muted">{category.examples}</p>
                <Link
                  to={supplierApplyRoute}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-retail-green hover:underline"
                >
                  Supply this category
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 rounded-xl border border-retail-border bg-white p-5 text-sm leading-6 text-retail-muted">
          Categories shown here reflect current sourcing interest. They are not a promise of demand, volume or purchase orders
          for any product line.
        </p>
      </SupplierContainer>
    </section>
  );
}
