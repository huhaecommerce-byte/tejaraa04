import { ArrowRight, Check, PackageSearch, RotateCcw, Tags, Truck, Warehouse, Wallet } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';

const fees = [
  { icon: PackageSearch, title: 'Product sourcing', text: 'Quoted for the product, quantity and sourcing request.' },
  { icon: Tags, title: 'Marketplace labelling', text: 'Charged per unit according to the preparation needed.' },
  { icon: Warehouse, title: 'Warehouse storage', text: 'Based on the stock held and storage period.' },
  { icon: Truck, title: 'Delivery & shipping', text: 'Calculated by shipment weight, destination and service.' },
  { icon: RotateCcw, title: 'Returns handling', text: 'Applied when Tejaraa receives and processes a return.' },
];
const faqs = [
  { q: 'How much does it cost to join Tejaraa?', a: 'Creating an account and browsing the available catalogue is free. There is no membership charge.' },
  { q: 'How does Tejaraa charge?', a: 'A margin may be included in listed product prices, while optional sourcing, preparation, storage, delivery and returns services are charged when used.' },
  { q: 'Are there hidden charges?', a: 'No. Applicable product and service charges are shown or quoted before you confirm.' },
  { q: 'Do I pay if I only browse?', a: 'No. You pay when you order a product or confirm a paid service.' },
  { q: 'What payment methods are available?', a: 'Available payment methods are shown at checkout or when a service request is confirmed.' },
];

export default function Pricing() {
  return (
    <SellerPublicShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <section className="hero-surface relative overflow-hidden py-11 text-white lg:py-14"><div className="hero-grid pointer-events-none absolute inset-0 opacity-15" /><SellerContainer className="relative"><p className="text-xs font-bold uppercase text-retail-gold">Simple pricing</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Free to join. Pay when you use a service.</h1><p className="mt-3 max-w-xl text-base leading-7 text-white/75">No membership fee. Product costs and optional service charges are confirmed before you commit.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">Create free account<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/selling/contact">Request a quote</Link></Button></div></SellerContainer></section>
      <section className="py-9 lg:py-11"><SellerContainer className="grid gap-9 lg:grid-cols-[0.75fr_1.25fr]"><div><SellerSectionHeading eyebrow="How it works" title="Two ways you pay" /><ol className="mt-4 grid gap-5"><li className="border-l-2 border-retail-green pl-4"><strong className="text-retail-dark-green">Product price</strong><p className="mt-1 text-sm leading-6 text-retail-muted">You pay the listed or quoted cost when ordering products.</p></li><li className="border-l-2 border-retail-gold pl-4"><strong className="text-retail-dark-green">Pay-as-you-go services</strong><p className="mt-1 text-sm leading-6 text-retail-muted">Optional operational services are charged only when used.</p></li></ol><div className="mt-6 flex gap-3 border-t border-retail-border pt-4"><Wallet className="h-5 w-5 text-retail-green" /><p className="text-sm leading-6 text-retail-muted">Your wallet can hold funds for product orders and services where available.</p></div></div><div><SellerSectionHeading eyebrow="Service fees" title="What can carry a charge" description="The exact rate depends on the request and appears before confirmation." /><ul className="mt-4 grid gap-3 sm:grid-cols-2">{fees.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3 rounded-md border border-retail-border p-4"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" /><span><strong className="block text-sm text-retail-dark-green">{title}</strong><span className="mt-1 block text-xs leading-5 text-retail-muted">{text}</span></span></li>)}</ul><p className="mt-4 flex items-center gap-2 text-xs font-bold text-retail-green"><Check className="h-4 w-4" />No fee is charged merely for creating an account or browsing.</p></div></SellerContainer></section>
      <ServiceFAQ items={faqs} />
      <section className="bg-retail-dark-green py-9 text-white"><SellerContainer className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-extrabold">Ready to start?</h2><p className="mt-1 text-sm text-white/70">Create your account, browse products and request the services you need.</p></div><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">Create free account<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button></SellerContainer></section>
    </SellerPublicShell>
  );
}