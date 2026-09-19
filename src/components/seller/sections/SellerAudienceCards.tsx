import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerAudiences } from '@/data/sellerServices';

export function SellerAudienceCards() {
  return (
    <section className="border-y border-retail-border bg-white py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          eyebrow="Who it's for"
          title="Built for different types of sellers"
          description="Whether you are launching your first store or scaling an established brand, you can start with the services you need today."
          align="center"
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sellerAudiences.map((audience) => (
            <div key={audience.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-retail-page/70 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-dark-green text-retail-gold">
                <audience.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{audience.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{audience.text}</p>
              <Link
                to={audience.to}
                className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-retail-green hover:underline"
              >
                {audience.linkLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}
