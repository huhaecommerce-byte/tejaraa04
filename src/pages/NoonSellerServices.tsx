import { ArrowRight, Check, ClipboardCheck, PackageCheck, ScanBarcode, Tag, Truck, Warehouse } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ, ServiceInquiryCTA } from '@/components/seller/service';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';

const services = [
  { icon: Tag, title: 'FBN prep & labelling', text: 'Item labels, poly-bagging, wrapping and carton preparation.' },
  { icon: ScanBarcode, title: 'Labelling compliance', text: 'Barcodes, carton labels and date formatting checked before dispatch.' },
  { icon: Warehouse, title: 'KSA fulfilment', text: 'Store stock for FBN replenishment or FBP order fulfilment.' },
  { icon: PackageCheck, title: 'Quality inspection', text: 'Check condition, packaging and labels before inventory leaves.' },
  { icon: ClipboardCheck, title: 'Bundles & multi-packs', text: 'Assemble grouped products with the required scannable label.' },
  { icon: Truck, title: 'Noon warehouse delivery', text: 'Scheduled, tracked delivery with appointment coordination.' },
];
const checklist = ['Item-level barcode', 'Carton labels matching the ASN', 'Expiry-date labels where needed', 'Required poly-bag warnings', 'Protection for fragile items', 'Tamper-resistant electronics packaging', 'Accurate weights and dimensions', 'Batch photo documentation'];
const steps = ['Send or source products', 'Prepare to Noon requirements', 'Deliver to Noon or hold for FBP', 'Track and replenish'];
const faqs = [
  { q: 'What is Noon FBN and how do you help?', a: 'FBN means Noon stores and ships the products. Tejaraa can prepare inventory to the applicable barcode, packaging and carton requirements, then coordinate its delivery.' },
  { q: 'Do you support Noon FBP?', a: 'Yes. Stock can be held for picking, packing and handover as seller-fulfilled orders arrive.' },
  { q: 'Can you source products for Noon?', a: 'Yes. Product hunting and sourcing can be combined with marketplace preparation.' },
  { q: 'What are the turnaround times?', a: 'Timing depends on batch size, preparation requirements, inventory condition and delivery booking. It is confirmed for each request.' },
  { q: 'How are compliance updates handled?', a: 'Requirements are reviewed during setup and preparation. Sellers remain responsible for their marketplace account and current listing requirements.' },
  { q: 'How much does preparation cost?', a: 'It depends on the number of units and the preparation each unit needs. Request a quote for an exact rate.' },
];

export default function NoonSellerServices() {
  return (
    <SellerPublicShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', name: 'Noon seller preparation and fulfilment', areaServed: 'Saudi Arabia', provider: { '@type': 'Organization', name: 'Tejaraa' } }} />
      <section className="hero-surface relative overflow-hidden py-11 text-white lg:py-14"><div className="hero-grid pointer-events-none absolute inset-0 opacity-15" /><SellerContainer className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="text-xs font-bold uppercase text-retail-gold">Noon seller services</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Prepare, label and fulfil for Noon.</h1><p className="mt-3 max-w-xl text-base leading-7 text-white/75">One concise workflow for sourcing, FBN preparation, FBP fulfilment and delivery in Saudi Arabia.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">Start selling<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/selling/contact">Request pricing</Link></Button></div></div><ol className="grid gap-2">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-md bg-white/[0.07] px-3 py-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-retail-gold text-xs font-bold text-retail-dark-green">{index + 1}</span><span className="text-sm font-semibold">{step}</span></li>)}</ol></SellerContainer></section>
      <section className="py-9 lg:py-11"><SellerContainer><SellerSectionHeading eyebrow="Complete workflow" title="Noon operations in one place" /><ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{services.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3 border-t border-retail-border pt-4"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" /><span><strong className="block text-sm text-retail-dark-green">{title}</strong><span className="mt-1 block text-sm leading-5 text-retail-muted">{text}</span></span></li>)}</ul></SellerContainer></section>
      <section className="border-y border-retail-border bg-retail-light-green py-9"><SellerContainer className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><SellerSectionHeading eyebrow="Preparation checklist" title="The details handled before dispatch" description="The exact checklist follows the product and current marketplace requirements." /><ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">{checklist.map((item) => <li key={item} className="flex gap-2 text-sm text-retail-text"><Check className="h-4 w-4 shrink-0 text-retail-green" />{item}</li>)}</ul></SellerContainer></section>
      <ServiceFAQ items={faqs} title="Noon seller questions" />
      <ServiceInquiryCTA title="Prepare your next Noon batch" text="Tell us the product, quantity and fulfilment model. We will confirm the preparation and delivery workflow." primaryLabel="Create free account" defaultService="Noon seller services" />
    </SellerPublicShell>
  );
}