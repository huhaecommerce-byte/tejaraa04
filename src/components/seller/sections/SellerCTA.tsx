import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { cn } from '@/lib/utils';

interface SellerCTAProps {
  title: string;
  text: string;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryTo: string;
  variant?: 'light' | 'dark';
}

export function SellerCTA({
  title, text, primaryLabel, secondaryLabel, secondaryTo, variant = 'light',
}: SellerCTAProps) {
  const dark = variant === 'dark';
  return (
    <section className={cn('py-11 lg:py-13', dark ? 'bg-retail-green' : 'border-y border-retail-border bg-retail-light-green')}>
      <SellerContainer className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <h2 className={cn('text-2xl font-extrabold tracking-tight sm:text-3xl', dark ? 'text-white' : 'text-retail-dark-green')}>
            {title}
          </h2>
          <p className={cn('mt-3 max-w-2xl text-base leading-7', dark ? 'text-white/80' : 'text-retail-muted')}>{text}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className={cn('font-semibold', dark ? 'bg-white text-retail-dark-green hover:bg-retail-light-green' : 'bg-retail-green text-white hover:bg-retail-dark-green')}
          >
            <Link to="/selling/signup">
              {primaryLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className={cn('font-semibold', dark ? 'border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white' : 'border-retail-green/35 bg-white text-retail-dark-green hover:bg-white/70')}
          >
            <Link to={secondaryTo}>{secondaryLabel}</Link>
          </Button>
        </div>
      </SellerContainer>
    </section>
  );
}
