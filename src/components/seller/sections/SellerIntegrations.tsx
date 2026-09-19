import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerChannels } from '@/data/sellerServices';

export function SellerIntegrations() {
  return (
    <section id="integrations" className="scroll-mt-28 border-y border-retail-border bg-white py-11 lg:py-14">
      <SellerContainer className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-center">
        <div className="min-w-0">
          <SellerSectionHeading
            eyebrow="Integrations"
            title="Connect your sales channels"
            description="Register the stores and marketplace accounts you already sell on so your Tejaraa operations sit next to your channels. Automatic syncing depends on your plan — check the plan details before relying on it."
          />
          <Button asChild variant="outline" className="mt-6 border-retail-green/35 font-semibold text-retail-dark-green hover:bg-retail-light-green">
            <Link to="/selling/integrations">
              Explore integrations
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
          {sellerChannels.map((channel) => (
            <li key={channel.label} className="flex items-center gap-3 rounded-xl border border-retail-border bg-retail-page/70 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-retail-green shadow-sm">
                <channel.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-retail-dark-green">{channel.label}</span>
                <span className="block text-xs text-retail-muted">{channel.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </SellerContainer>
    </section>
  );
}
