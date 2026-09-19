import { Check } from 'lucide-react';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplyModels } from '@/data/supplierPartners';

export function SupplyModelCards() {
  return (
    <section id="supply-models" className="scroll-mt-28 py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow="Supply models"
          title="Ways to supply Tejaraa"
          description="The shape of the relationship depends on your products and your business. These are the models we work with."
        />
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {supplyModels.map((model) => (
            <article key={model.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <model.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{model.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{model.best}</p>
              <ul className="mt-4 space-y-2.5 border-t border-retail-border pt-4">
                {model.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-retail-text">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-retail-medium-green" aria-hidden />
                    <span className="min-w-0">{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <SupplierSectionLink to="/partners/supply-models" label="Compare all supply models" />
      </SupplierContainer>
    </section>
  );
}
