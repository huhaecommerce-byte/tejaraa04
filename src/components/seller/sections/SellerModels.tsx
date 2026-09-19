import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerModels } from '@/data/sellerServices';

export function SellerModels() {
  return (
    <section id="service-models" className="scroll-mt-28 py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          eyebrow="Compare"
          title="Choose the right service for your business"
          description="The three most common ways sellers work with Tejaraa. You can combine them as your business grows."
          align="center"
        />
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {sellerModels.map((model) => (
            <div key={model.id} className="flex h-full flex-col rounded-xl border border-retail-border bg-white p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <model.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold text-retail-dark-green">{model.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{model.best}</p>
              <ul className="mt-4 space-y-2.5 border-t border-retail-border pt-4">
                {model.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-retail-text">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-retail-medium-green" aria-hidden />
                    <span className="min-w-0">{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={model.to}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-retail-green hover:underline"
              >
                See the service
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}
