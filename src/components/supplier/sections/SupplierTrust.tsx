import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { supplierTrust } from '@/data/supplierPartners';

export function SupplierTrust() {
  return (
    <section className="py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow="How we work"
          title="A commercial process, not a listing form"
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {supplierTrust.map((item) => (
            <article key={item.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </SupplierContainer>
    </section>
  );
}
