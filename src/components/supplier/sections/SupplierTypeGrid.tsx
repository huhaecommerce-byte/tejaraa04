import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierApplyPath, supplierTypes } from '@/data/supplierPartners';

export function SupplierTypeGrid() {
  return (
    <section id="supplier-types" className="scroll-mt-28 py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow="Who can supply"
          title="Who can partner with Tejaraa?"
          description="These are the business types our supplier registration accepts today."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplierTypes.map((type) => (
            <article key={type.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <type.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{type.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{type.text}</p>
              <Link
                to={supplierApplyPath}
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-retail-green hover:underline"
              >
                Apply as {type.title.toLowerCase().replace(/s$/, '')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
        <SupplierSectionLink to="/partners/who-can-supply" label="See what each supplier type brings" />
      </SupplierContainer>
    </section>
  );
}
