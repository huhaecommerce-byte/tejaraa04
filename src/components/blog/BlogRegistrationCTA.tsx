import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';

export function BlogRegistrationCTA() {
  return (
    <section className="bg-retail-dark-green py-8 text-primary-foreground lg:py-9">
      <SellerContainer className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase text-retail-gold">Put the guide into action</p>
          <h2 className="font-blog-heading mt-2 text-2xl font-extrabold">Start selling with Tejaraa</h2>
          <p className="font-blog-body mt-1 max-w-2xl text-sm leading-6 text-primary-foreground/70">Register once to access sourcing, preparation, warehousing and fulfillment services.</p>
        </div>
        <Button asChild size="lg" className="shrink-0 bg-background font-bold text-retail-dark-green hover:bg-retail-light-green">
          <Link to="/selling/signup">Register for services <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden /></Link>
        </Button>
      </SellerContainer>
    </section>
  );
}