import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { supplierJourney, supplierApprovalDisclaimer } from '@/data/supplierPages';

/** Full supplier journey, step by step (vertical on mobile, two columns on desktop). */
export function SupplierJourneyDetail() {
  return (
    <section className="bg-retail-page py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          eyebrow="The process"
          title="From application to supplying orders"
          description="Eight stages. Our team stays in touch at each one, so you always know where your application stands."
        />

        <ol className="mt-7 grid gap-4 lg:grid-cols-2">
          {supplierJourney.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-retail-border bg-white p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-retail-light-green text-retail-dark-green">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-[0.14em] text-retail-muted">STEP {index + 1}</p>
                  <h3 className="mt-1 text-base font-bold text-retail-dark-green">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-retail-muted">{step.text}</p>
                  <ul className="mt-3 space-y-1.5">
                    {step.detail.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm leading-6 text-retail-text">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-green" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-xl border border-retail-border bg-white p-5 text-sm leading-6 text-retail-muted">
          {supplierApprovalDisclaimer}
        </p>
      </SupplierContainer>
    </section>
  );
}
