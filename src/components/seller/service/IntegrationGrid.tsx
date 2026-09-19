import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerChannelCards } from '@/data/sellerServicePages';
import type { ChannelCard } from '@/data/sellerServicePages';
import { cn } from '@/lib/utils';

const supportStyles: Record<ChannelCard['support'], string> = {
  'Connected integration': 'bg-retail-green text-white',
  'Supported workflow': 'bg-retail-light-green text-retail-dark-green',
  'Manual / assisted setup': 'bg-retail-page text-retail-muted',
};

export function IntegrationCard({ channel }: { channel: ChannelCard }) {
  const { icon: Icon, name, kind, support, text } = channel;
  return (
    <li className="flex h-full flex-col rounded-xl border border-retail-border bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-retail-dark-green">{name}</h3>
          <p className="text-xs font-medium text-retail-muted">{kind}</p>
        </div>
      </div>
      <span className={cn('mt-4 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold', supportStyles[support])}>
        {support}
      </span>
      <p className="mt-3 text-sm leading-6 text-retail-muted">{text}</p>
      <Link
        to="/selling/signup"
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-retail-green hover:underline"
      >
        Get connected
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </li>
  );
}

export function IntegrationGrid({
  title = 'Sales channels you can register',
  description = 'Register the channel you sell on inside your seller account. The level of automation depends on your plan, so each card shows the support you can expect today.',
}: { title?: string; description?: string }) {
  return (
    <section id="channels" className="scroll-mt-24 py-10 lg:py-12">
      <SellerContainer>
        <SellerSectionHeading eyebrow="Supported channels" title={title} description={description} />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellerChannelCards.map((channel) => (
            <IntegrationCard key={channel.name} channel={channel} />
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-xs leading-5 text-retail-muted">
          Tejaraa is an independent service provider. Platform and marketplace names are used to describe the channels we
          support operationally, not to claim an official partnership or endorsement.
        </p>
      </SellerContainer>
    </section>
  );
}
