import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { supplierTypeDetails, supplierApplyRoute } from '@/data/supplierPages';

/** Detailed supplier-type sections plus a non-ranked "best for" summary. */
export function SupplierTypeSections() {
  return (
    <>
      <section className="bg-retail-page py-11 lg:py-14">
        <SupplierContainer>
          <SupplierSectionHeading
            eyebrow="Supplier types"
            title="Businesses we can consider"
            description="The review looks at your products and supply capability, not at your business category."
          />
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {supplierTypeDetails.map((type) => (
              <article key={type.id} id={type.id} className="scroll-mt-28 rounded-2xl border border-retail-border bg-white p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-retail-light-green text-retail-dark-green">
                    <type.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-retail-dark-green">{type.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-retail-muted">{type.intro}</p>
                    <ul className="mt-3 space-y-1.5">
                      {type.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm leading-6 text-retail-text">
                          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-green" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={supplierApplyRoute}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-retail-green hover:underline"
                    >
                      Apply as {type.title.toLowerCase()}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SupplierContainer>
      </section>

      <section className="border-y border-retail-border bg-white py-11 lg:py-14">
        <SupplierContainer>
          <SupplierSectionHeading
            eyebrow="At a glance"
            title="What each supplier type is usually best for"
            description="A summary, not a ranking. All supplier types go through the same review."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {supplierTypeDetails.map((type) => (
              <div key={type.id} className="rounded-xl border border-retail-border bg-retail-page p-5">
                <h3 className="text-base font-bold text-retail-dark-green">{type.title}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-retail-muted">Best for</p>
                <p className="mt-1 text-sm leading-6 text-retail-text">{type.bestFor}</p>
              </div>
            ))}
          </div>
        </SupplierContainer>
      </section>
    </>
  );
}
