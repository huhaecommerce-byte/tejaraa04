import { ArrowRight, Check, PackageSearch, RotateCcw, Tags, Truck, Warehouse, Wallet } from 'lucide-react';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';
import { useLocale } from '@/i18n/LocaleProvider';

const fees = [
  { icon: PackageSearch, title: 'selling.pricing.fee.0.title', text: 'selling.pricing.fee.0.text' },
  { icon: Tags, title: 'selling.pricing.fee.1.title', text: 'selling.pricing.fee.1.text' },
  { icon: Warehouse, title: 'selling.pricing.fee.2.title', text: 'selling.pricing.fee.2.text' },
  { icon: Truck, title: 'selling.pricing.fee.3.title', text: 'selling.pricing.fee.3.text' },
  { icon: RotateCcw, title: 'selling.pricing.fee.4.title', text: 'selling.pricing.fee.4.text' },
] as const;
const faqs = [
  { q: 'selling.pricing.faq.0.q', a: 'selling.pricing.faq.0.a' },
  { q: 'selling.pricing.faq.1.q', a: 'selling.pricing.faq.1.a' },
  { q: 'selling.pricing.faq.2.q', a: 'selling.pricing.faq.2.a' },
  { q: 'selling.pricing.faq.3.q', a: 'selling.pricing.faq.3.a' },
  { q: 'selling.pricing.faq.4.q', a: 'selling.pricing.faq.4.a' },
];

export default function Pricing() {
  const { t, dir } = useLocale();
  const resolvedFaqs = faqs.map((f) => ({ q: t(f.q as any), a: t(f.a as any) }));
  return (
    <SellerPublicShell>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: resolvedFaqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <section dir={dir} className="hero-surface relative overflow-hidden py-11 text-white lg:py-14"><div className="hero-grid pointer-events-none absolute inset-0 opacity-15" /><SellerContainer className="relative"><p className="text-xs font-bold uppercase text-retail-gold">{t('selling.pricing.hero.eyebrow')}</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">{t('selling.pricing.hero.title')}</h1><p className="mt-3 max-w-xl text-base leading-7 text-white/75">{t('selling.pricing.hero.lead')}</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">{t('selling.pricing.hero.createAccount')}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/selling/contact">{t('selling.pricing.hero.requestQuote')}</Link></Button></div></SellerContainer></section>
      <section dir={dir} className="py-9 lg:py-11"><SellerContainer className="grid gap-9 lg:grid-cols-[0.75fr_1.25fr]"><div><SellerSectionHeading eyebrow={t('selling.pricing.how.eyebrow')} title={t('selling.pricing.how.title')} /><ol className="mt-4 grid gap-5"><li className="border-l-2 border-retail-green pl-4"><strong className="text-retail-dark-green">{t('selling.pricing.how.product.title')}</strong><p className="mt-1 text-sm leading-6 text-retail-muted">{t('selling.pricing.how.product.text')}</p></li><li className="border-l-2 border-retail-gold pl-4"><strong className="text-retail-dark-green">{t('selling.pricing.how.services.title')}</strong><p className="mt-1 text-sm leading-6 text-retail-muted">{t('selling.pricing.how.services.text')}</p></li></ol><div className="mt-6 flex gap-3 border-t border-retail-border pt-4"><Wallet className="h-5 w-5 text-retail-green" /><p className="text-sm leading-6 text-retail-muted">{t('selling.pricing.wallet')}</p></div></div><div><SellerSectionHeading eyebrow={t('selling.pricing.fees.eyebrow')} title={t('selling.pricing.fees.title')} description={t('selling.pricing.fees.desc')} /><ul className="mt-4 grid gap-3 sm:grid-cols-2">{fees.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3 rounded-md border border-retail-border p-4"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" /><span><strong className="block text-sm text-retail-dark-green">{t(title)}</strong><span className="mt-1 block text-xs leading-5 text-retail-muted">{t(text)}</span></span></li>)}</ul><p className="mt-4 flex items-center gap-2 text-xs font-bold text-retail-green"><Check className="h-4 w-4" />{t('selling.pricing.noFee')}</p></div></SellerContainer></section>
      <ServiceFAQ items={faqs} />
      <section dir={dir} className="bg-retail-dark-green py-9 text-white"><SellerContainer className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-extrabold">{t('selling.pricing.cta.title')}</h2><p className="mt-1 text-sm text-white/70">{t('selling.pricing.cta.text')}</p></div><Button asChild size="lg" className="bg-retail-card text-retail-dark-green hover:bg-retail-light-green"><Link to="/selling/signup">{t('selling.pricing.hero.createAccount')}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button></SellerContainer></section>
    </SellerPublicShell>
  );
}
