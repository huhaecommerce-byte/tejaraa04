import { Link } from '@/lib/router-compat';
import { ArrowRight, ListChecks } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { RelatedServices, SellerBreadcrumbs, ServiceFAQ, ServiceHero, ServiceInquiryCTA } from '@/components/seller/service';
import { sellerJourneys } from '@/data/sellerServicePages';

const journeySteps = [
  ['Choose your business model', 'Dropshipping, sourcing, or fulfilment for stock you own.'],
  ['Find products', 'Use product hunting or bring products you already want to sell.'],
  ['Source or dropship', 'Buy stock through sourcing or sell per order.'],
  ['Connect your sales channel', 'Register the store or marketplace you sell on.'],
  ['Start selling', 'List products with your pricing and marketing.'],
  ['Receive orders', 'Customers order from you on your channel.'],
  ['Fulfil orders', 'Orders are picked, packed and labelled.'],
  ['Deliver to customers', 'Orders are dispatched inside Saudi Arabia.'],
  ['Scale', 'Add products, quantities and services as volume grows.'],
];

const models = [
  { name: 'Dropshipping', best: 'No inventory purchase', tejaraa: 'Product supply, preparation and dispatch.', you: 'Storefront, pricing, marketing and support.', to: '/selling/dropshipping' },
  { name: 'Product sourcing', best: 'Buy your own inventory', tejaraa: 'Supplier options, cost review and procurement.', you: 'Product, quantity and selling-price decisions.', to: '/selling/product-sourcing' },
  { name: 'Storage & fulfilment', best: 'You already own stock', tejaraa: 'Receiving, storage, packing and dispatch.', you: 'Selling, order submission and replenishment.', to: '/selling/fulfillment' },
];

const faqs = [
  { q: 'Do I have to use every step?', a: 'No. Most sellers use two or three services. Pick only the parts you need.' },
  { q: 'Can I change model later?', a: 'Yes. Sellers often start with dropshipping and move into sourcing and storage once a product sells consistently.' },
  { q: 'Does Tejaraa build my store?', a: 'No. You own and run your storefront or marketplace account. Tejaraa handles the product and order operations behind it.' },
  { q: 'Which region do you serve?', a: 'Tejaraa is built for e-commerce sellers in Saudi Arabia, with storage and delivery inside the Kingdom.' },
  { q: 'How is pricing calculated?', a: 'Pricing depends on products, volume and services, so it is quoted per business.' },
  { q: 'How do I get started?', a: 'Create a seller account, tell us what you need, and our team will confirm the setup.' },
];

export default function SellerHowItWorksPage() {
  return (
    <SellerPublicShell>
      <SellerBreadcrumbs items={[{ label: 'How It Works' }]} />
      <ServiceHero icon={ListChecks} eyebrow="How it works" title="How selling with Tejaraa works" lead="Choose a model, connect your channel and use only the product and order services your business needs." tags={['Choose a model', 'Sell', 'Fulfil']} flow={['Choose a model', 'Find products', 'Connect your channel', 'Sell', 'Fulfil & deliver']} flowCaption="Pick the services that fit your business." secondaryLabel="Talk to Tejaraa" />
      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Start here" title="Choose your business model" description="Three models that can be combined as your business changes." />
          <ul className="mt-5 grid gap-3 lg:grid-cols-3">
            {models.map((model) => <li key={model.name} className="border-t-2 border-retail-green pt-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold text-retail-dark-green">{model.name}</h3><p className="mt-1 text-sm font-semibold text-retail-medium-green">{model.best}</p></div><Link to={model.to} aria-label={`View ${model.name}`} className="text-retail-green"><ArrowRight className="h-4 w-4" /></Link></div><dl className="mt-4 grid grid-cols-2 gap-4 text-xs leading-5"><div><dt className="font-bold text-retail-dark-green">Tejaraa</dt><dd className="text-retail-muted">{model.tejaraa}</dd></div><div><dt className="font-bold text-retail-dark-green">You</dt><dd className="text-retail-muted">{model.you}</dd></div></dl></li>)}
          </ul>
        </SellerContainer>
      </section>
      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Journey" title="Nine steps, one clear flow" />
          <ol className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {journeySteps.map(([title, text], index) => <li key={title} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-green text-xs font-bold text-retail-card">{index + 1}</span><span><strong className="block text-sm text-retail-dark-green">{title}</strong><span className="mt-0.5 block text-xs leading-5 text-retail-muted">{text}</span></span></li>)}
          </ol>
        </SellerContainer>
      </section>
      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Your situation" title="Find your path" description="Choose the closest starting point; every service and step remains available." />
          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sellerJourneys.map(({ id, icon: Icon, title, steps, note, links }) => <li key={id} className="rounded-md border border-retail-border p-4"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-retail-green" /><h3 className="text-sm font-bold text-retail-dark-green">{title}</h3></div><p className="mt-2 text-xs leading-5 text-retail-muted">{steps.join(' → ')}</p><p className="mt-2 text-xs leading-5 text-retail-muted">{note}</p><div className="mt-3 flex flex-wrap gap-3">{links.map((link) => <Link key={link.to} to={link.to} className="text-xs font-bold text-retail-green hover:underline">{link.label}</Link>)}</div></li>)}
          </ul>
        </SellerContainer>
      </section>
      <ServiceFAQ items={faqs} />
      <ServiceInquiryCTA title="Not sure which model fits?" text="Tell us where you are today and we will recommend a practical service mix." primaryLabel="Get Started" defaultService="Not sure yet" />
      <RelatedServices slugs={['dropshipping', 'product-sourcing', 'fulfillment', 'integrations']} />
    </SellerPublicShell>
  );
}