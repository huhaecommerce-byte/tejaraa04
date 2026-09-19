import { ArrowRight, Check, Globe, Package, Box, Tag, Truck, Warehouse } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ, ServiceInquiryCTA } from '@/components/seller/service';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';

const services = [
  { icon: Globe, title: 'Product sourcing', text: 'Local and global supplier options, custom requests, samples and wholesale pricing.', points: ['Vetted suppliers', 'Custom sourcing', 'Sample support'], to: '/selling/product-sourcing' },
  { icon: Package, title: 'Bulk orders', text: 'Flexible quantities, volume pricing and multi-SKU purchasing for stocked inventory.', points: ['Flexible MOQs', 'Volume discounts', 'Reorder support'], to: '/selling/product-sourcing' },
  { icon: Box, title: 'Dropshipping', text: 'Sell without holding inventory while Tejaraa prepares and dispatches each order.', points: ['No stock purchase', 'Blind shipping', 'Order fulfilment'], to: '/selling/dropshipping' },
  { icon: Tag, title: 'Marketplace prep', text: 'Labelling, inspection, bundling and packaging for Amazon and Noon workflows.', points: ['Barcode labelling', 'Bundle assembly', 'Quality checks'], to: '/selling/marketplace-preparation' },
  { icon: Truck, title: 'Delivery & logistics', text: 'Tracked dispatch to customers, warehouses and marketplace facilities in Saudi Arabia.', points: ['Tracked delivery', 'Multiple destinations', 'COD support'], to: '/selling/fulfillment' },
  { icon: Warehouse, title: 'Warehousing', text: 'Receive, store, monitor, pick and pack inventory when orders arrive.', points: ['KSA storage', 'Inventory tracking', 'Pick and pack'], to: '/selling/warehousing' },
];

const steps = ['Tell us what you need', 'Source or send inventory', 'Prepare products and orders', 'Dispatch and track'];
const faqs = [
  { q: 'What platforms do you support?', a: 'We support operational workflows for Amazon, Noon, Shopify, WooCommerce and manually registered sales channels.' },
  { q: 'Can I mix bulk and dropshipping orders?', a: 'Yes. Many sellers test products through dropshipping, then buy stock once demand becomes predictable.' },
  { q: 'What happens if products arrive damaged?', a: 'Products can be inspected during receiving and preparation. Any issue is documented and handled according to the agreed service.' },
  { q: 'Do you offer custom branding?', a: 'Packaging, inserts and labelling can be arranged where the product, quantity and service requirements allow it.' },
  { q: 'How do I track orders?', a: 'Seller orders and available tracking updates appear in your Tejaraa seller account.' },
  { q: 'Is there a contract?', a: 'Creating an account is free. Product and service charges are confirmed before you place the relevant order or request.' },
];

export default function Services() {
  return (
    <SellerPublicShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'E-commerce sourcing, preparation and fulfilment', provider: { '@type': 'Organization', name: 'Tejaraa.com' }, areaServed: 'Saudi Arabia' }} />
      <section className="hero-surface relative overflow-hidden py-11 text-white lg:py-14">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
        <SellerContainer className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase text-retail-gold">Seller services</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Source, prepare and deliver.</h1><p className="mt-3 max-w-xl text-base leading-7 text-white/75">Six practical services for Saudi e-commerce sellers, available separately or as one connected workflow.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">Start selling<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/selling/contact">Talk to us</Link></Button></div></div>
          <ol className="grid grid-cols-2 gap-3">{steps.map((step, index) => <li key={step} className="border-t border-white/25 pt-2 text-sm font-semibold"><span className="mr-2 text-retail-gold">0{index + 1}</span>{step}</li>)}</ol>
        </SellerContainer>
      </section>
      <section className="py-9 lg:py-11"><SellerContainer><SellerSectionHeading eyebrow="All services" title="Everything you need, nothing you do not" description="Open any service for its full workflow, responsibilities, requirements and answers." /><ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{services.map(({ icon: Icon, title, text, points, to }) => <li key={title} className="group border-t-2 border-retail-green py-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-retail-green" /><strong className="text-retail-dark-green">{title}</strong></span><Link to={to} aria-label={`View ${title}`} className="text-retail-green"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div><p className="mt-2 text-sm leading-6 text-retail-muted">{text}</p><ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">{points.map((point) => <li key={point} className="flex items-center gap-1 text-xs font-semibold text-retail-text"><Check className="h-3 w-3 text-retail-green" />{point}</li>)}</ul></li>)}</ul></SellerContainer></section>
      <ServiceFAQ items={faqs} />
      <ServiceInquiryCTA title="Build the right service mix" text="Tell us what you sell and where you are today. We will map the practical next step." primaryLabel="Create free account" defaultService="Multiple seller services" />
    </SellerPublicShell>
  );
}