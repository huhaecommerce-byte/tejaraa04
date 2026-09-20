import { ArrowRight, Check, ClipboardCheck, PackageCheck, ScanBarcode, Tag, Truck, Warehouse } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ, ServiceInquiryCTA } from '@/components/seller/service';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';
import { useLocale } from '@/i18n/LocaleProvider';

const services = [
  { icon: Tag, title: 'selling.noon.svc.0.title', text: 'selling.noon.svc.0.text' },
  { icon: ScanBarcode, title: 'selling.noon.svc.1.title', text: 'selling.noon.svc.1.text' },
  { icon: Warehouse, title: 'selling.noon.svc.2.title', text: 'selling.noon.svc.2.text' },
  { icon: PackageCheck, title: 'selling.noon.svc.3.title', text: 'selling.noon.svc.3.text' },
  { icon: ClipboardCheck, title: 'selling.noon.svc.4.title', text: 'selling.noon.svc.4.text' },
  { icon: Truck, title: 'selling.noon.svc.5.title', text: 'selling.noon.svc.5.text' },
] as const;
const checklist = [
  'selling.noon.checklist.0', 'selling.noon.checklist.1', 'selling.noon.checklist.2', 'selling.noon.checklist.3',
  'selling.noon.checklist.4', 'selling.noon.checklist.5', 'selling.noon.checklist.6', 'selling.noon.checklist.7',
] as const;
const steps = ['selling.noon.step.0', 'selling.noon.step.1', 'selling.noon.step.2', 'selling.noon.step.3'] as const;
const faqs = [
  { q: 'selling.noon.faq.0.q', a: 'selling.noon.faq.0.a' },
  { q: 'selling.noon.faq.1.q', a: 'selling.noon.faq.1.a' },
  { q: 'selling.noon.faq.2.q', a: 'selling.noon.faq.2.a' },
  { q: 'selling.noon.faq.3.q', a: 'selling.noon.faq.3.a' },
  { q: 'selling.noon.faq.4.q', a: 'selling.noon.faq.4.a' },
  { q: 'selling.noon.faq.5.q', a: 'selling.noon.faq.5.a' },
];

export default function NoonSellerServices() {
  const { t, dir } = useLocale();
  return (
    <SellerPublicShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', name: 'Noon seller preparation and fulfilment', areaServed: 'Saudi Arabia', provider: { '@type': 'Organization', name: 'Tejaraa' } }} />
      <section dir={dir} className="hero-surface relative overflow-hidden py-11 text-white lg:py-14"><div className="hero-grid pointer-events-none absolute inset-0 opacity-15" /><SellerContainer className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="text-xs font-bold uppercase text-retail-gold">{t('selling.noon.hero.eyebrow')}</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">{t('selling.noon.hero.title')}</h1><p className="mt-3 max-w-xl text-base leading-7 text-white/75">{t('selling.noon.hero.lead')}</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">{t('selling.noon.hero.startSelling')}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/selling/contact">{t('selling.noon.hero.requestPricing')}</Link></Button></div></div><ol className="grid gap-2">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-md bg-white/[0.07] px-3 py-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-retail-gold text-xs font-bold text-retail-dark-green">{index + 1}</span><span className="text-sm font-semibold">{t(step)}</span></li>)}</ol></SellerContainer></section>
      <section dir={dir} className="py-9 lg:py-11"><SellerContainer><SellerSectionHeading eyebrow={t('selling.noon.workflow.eyebrow')} title={t('selling.noon.workflow.title')} /><ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{services.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3 border-t border-retail-border pt-4"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" /><span><strong className="block text-sm text-retail-dark-green">{t(title)}</strong><span className="mt-1 block text-sm leading-5 text-retail-muted">{t(text)}</span></span></li>)}</ul></SellerContainer></section>
      <section dir={dir} className="border-y border-retail-border bg-retail-light-green py-9"><SellerContainer className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><SellerSectionHeading eyebrow={t('selling.noon.checklist.eyebrow')} title={t('selling.noon.checklist.title')} description={t('selling.noon.checklist.desc')} /><ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">{checklist.map((item) => <li key={item} className="flex gap-2 text-sm text-retail-text"><Check className="h-4 w-4 shrink-0 text-retail-green" />{t(item)}</li>)}</ul></SellerContainer></section>
      <ServiceFAQ items={faqs} title={t('selling.noon.faq.title')} />
      <ServiceInquiryCTA title={t('selling.noon.cta.title')} text={t('selling.noon.cta.text')} primaryLabel={t('selling.noon.cta.primary')} defaultService="Noon seller services" />
    </SellerPublicShell>
  );
}
