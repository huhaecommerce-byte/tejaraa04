import { ArrowRight, Check, Globe, Package, Box, Tag, Truck, Warehouse } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ, ServiceInquiryCTA } from '@/components/seller/service';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';
import { useLocale } from '@/i18n/LocaleProvider';

const services = [
  { icon: Globe, title: 'selling.services.svc.0.title', text: 'selling.services.svc.0.text', points: ['selling.services.svc.0.p.0', 'selling.services.svc.0.p.1', 'selling.services.svc.0.p.2'], to: '/selling/product-sourcing' },
  { icon: Package, title: 'selling.services.svc.1.title', text: 'selling.services.svc.1.text', points: ['selling.services.svc.1.p.0', 'selling.services.svc.1.p.1', 'selling.services.svc.1.p.2'], to: '/selling/product-sourcing' },
  { icon: Box, title: 'selling.services.svc.2.title', text: 'selling.services.svc.2.text', points: ['selling.services.svc.2.p.0', 'selling.services.svc.2.p.1', 'selling.services.svc.2.p.2'], to: '/selling/dropshipping' },
  { icon: Tag, title: 'selling.services.svc.3.title', text: 'selling.services.svc.3.text', points: ['selling.services.svc.3.p.0', 'selling.services.svc.3.p.1', 'selling.services.svc.3.p.2'], to: '/selling/marketplace-preparation' },
  { icon: Truck, title: 'selling.services.svc.4.title', text: 'selling.services.svc.4.text', points: ['selling.services.svc.4.p.0', 'selling.services.svc.4.p.1', 'selling.services.svc.4.p.2'], to: '/selling/fulfillment' },
  { icon: Warehouse, title: 'selling.services.svc.5.title', text: 'selling.services.svc.5.text', points: ['selling.services.svc.5.p.0', 'selling.services.svc.5.p.1', 'selling.services.svc.5.p.2'], to: '/selling/warehousing' },
] as const;

const steps = ['selling.services.step.0', 'selling.services.step.1', 'selling.services.step.2', 'selling.services.step.3'] as const;
const faqs = [
  { q: 'selling.services.faq.0.q', a: 'selling.services.faq.0.a' },
  { q: 'selling.services.faq.1.q', a: 'selling.services.faq.1.a' },
  { q: 'selling.services.faq.2.q', a: 'selling.services.faq.2.a' },
  { q: 'selling.services.faq.3.q', a: 'selling.services.faq.3.a' },
  { q: 'selling.services.faq.4.q', a: 'selling.services.faq.4.a' },
  { q: 'selling.services.faq.5.q', a: 'selling.services.faq.5.a' },
];

export default function Services() {
  const { t, dir } = useLocale();
  return (
    <SellerPublicShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'E-commerce sourcing, preparation and fulfilment', provider: { '@type': 'Organization', name: 'Tejaraa.com' }, areaServed: 'Saudi Arabia' }} />
      <section dir={dir} className="hero-surface relative overflow-hidden py-11 text-white lg:py-14">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
        <SellerContainer className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase text-retail-gold">{t('selling.services.hero.eyebrow')}</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">{t('selling.services.hero.title')}</h1><p className="mt-3 max-w-xl text-base leading-7 text-white/75">{t('selling.services.hero.lead')}</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">{t('selling.services.hero.startSelling')}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/selling/contact">{t('selling.services.hero.talkToUs')}</Link></Button></div></div>
          <ol className="grid grid-cols-2 gap-3">{steps.map((step, index) => <li key={step} className="border-t border-white/25 pt-2 text-sm font-semibold"><span className="mr-2 text-retail-gold">0{index + 1}</span>{t(step)}</li>)}</ol>
        </SellerContainer>
      </section>
      <section dir={dir} className="py-9 lg:py-11"><SellerContainer><SellerSectionHeading eyebrow={t('selling.services.all.eyebrow')} title={t('selling.services.all.title')} description={t('selling.services.all.desc')} /><ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{services.map(({ icon: Icon, title, text, points, to }) => <li key={title} className="group border-t-2 border-retail-green py-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-retail-green" /><strong className="text-retail-dark-green">{t(title)}</strong></span><Link to={to} aria-label={t(title)} className="text-retail-green"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div><p className="mt-2 text-sm leading-6 text-retail-muted">{t(text)}</p><ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">{points.map((point) => <li key={point} className="flex items-center gap-1 text-xs font-semibold text-retail-text"><Check className="h-3 w-3 text-retail-green" />{t(point)}</li>)}</ul></li>)}</ul></SellerContainer></section>
      <ServiceFAQ items={faqs} />
      <ServiceInquiryCTA title={t('selling.services.cta.title')} text={t('selling.services.cta.text')} primaryLabel={t('selling.services.cta.primary')} defaultService="Multiple seller services" />
    </SellerPublicShell>
  );
}
