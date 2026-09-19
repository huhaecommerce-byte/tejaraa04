import { Plug } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import {
  IntegrationGrid, RelatedServices, SellerBreadcrumbs, ServiceFAQ, ServiceHero,
  ServiceInquiryCTA,
} from '@/components/seller/service';

const orderFlow = [
  { title: 'Sales channel', text: 'A customer buys from your store or marketplace listing.' },
  { title: 'Order captured', text: 'The order is recorded against the channel you registered.' },
  { title: 'Sent to Tejaraa', text: 'The order reaches us from your account or a supported connection.' },
  { title: 'Fulfilment', text: 'The order is picked, packed and labelled.' },
  { title: 'Customer', text: 'The order is dispatched for delivery.' },
];

const capabilities = [
  { title: 'Register a channel', text: 'Add the store or marketplace you sell on to your seller account.' },
  { title: 'Submit orders', text: 'Send orders for fulfilment from your seller account at any time.' },
  { title: 'Track inventory', text: 'See the stock held with Tejaraa against your account.' },
  { title: 'Assisted setup', text: 'For channels without a direct connection, our team confirms the workflow.' },
];

const faqs = [
  { q: 'Which channels can I register?', a: 'Shopify, WooCommerce, Amazon Seller and Noon Seller are supported channel types today, and any other channel can be added manually.' },
  { q: 'Is my store connected automatically?', a: 'Not by default. Registering a channel sets up the workflow; automatic syncing depends on your plan, and orders can always be submitted from your seller account.' },
  { q: 'Do you support Salla or Zid?', a: 'There is no direct connection for them today. You can register the channel manually and we will confirm the working process with you.' },
  { q: 'Does marketplace support mean you are a marketplace partner?', a: 'No. We support sellers operationally and are not affiliated with or endorsed by any marketplace.' },
  { q: 'How do I get connected?', a: 'Create a seller account, add your channel, and our team will confirm the setup for your case.' },
];

export default function SellerIntegrationsPage() {
  return (
    <SellerPublicShell>
      <SellerBreadcrumbs items={[{ label: 'Integrations' }]} />
      <ServiceHero
        icon={Plug}
        eyebrow="Integrations"
        title="Connect your sales channels to Tejaraa"
        lead="Register the store or marketplace you sell on, then send orders to Tejaraa for sourcing and fulfilment."
        tags={['Store platforms', 'Marketplaces', 'Manual channels']}
        flow={orderFlow.map((step) => step.title)}
        flowCaption="Automatic syncing depends on your plan. Orders can always be submitted from your seller account."
        secondaryLabel="Talk to Tejaraa"
      />
      <IntegrationGrid />
      <section className="border-y border-retail-border bg-retail-light-green py-9">
        <SellerContainer className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SellerSectionHeading eyebrow="Capabilities" title="What you can do" description="Clear workflows for connected and manually registered channels." />
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => <li key={item.title} className="border-l-2 border-retail-green pl-3"><h3 className="text-sm font-bold text-retail-dark-green">{item.title}</h3><p className="mt-1 text-xs leading-5 text-retail-muted">{item.text}</p></li>)}
            </ul>
          </div>
          <div>
            <SellerSectionHeading eyebrow="Order flow" title="From checkout to customer" />
            <ol className="mt-4 grid gap-3 sm:grid-cols-5">
              {orderFlow.map((step, index) => <li key={step.title}><span className="text-xs font-extrabold text-retail-medium-green">0{index + 1}</span><h3 className="mt-1 text-sm font-bold text-retail-dark-green">{step.title}</h3><p className="mt-1 text-xs leading-5 text-retail-muted">{step.text}</p></li>)}
            </ol>
          </div>
        </SellerContainer>
      </section>
      <ServiceFAQ items={faqs} />
      <ServiceInquiryCTA title="Ready to connect your channel?" text="Tell us where you sell and we will confirm the setup that works for your channel." primaryLabel="Get Started" defaultService="Integrations" />
      <RelatedServices slugs={['dropshipping', 'fulfillment', 'marketplace-preparation']} />
    </SellerPublicShell>
  );
}