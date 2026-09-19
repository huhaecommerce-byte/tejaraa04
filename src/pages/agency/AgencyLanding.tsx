import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyCTA, AgencyFeatureList } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  Handshake, Users, Coins, Repeat, ShieldCheck, LineChart, ArrowRight,
} from 'lucide-react';

export default function AgencyLanding() {
  const { t } = useLocale();

  const steps = [
    { icon: Handshake, title: t('agency.landing.step1Title'), text: t('agency.landing.step1Text') },
    { icon: Users, title: t('agency.landing.step2Title'), text: t('agency.landing.step2Text') },
    { icon: Coins, title: t('agency.landing.step3Title'), text: t('agency.landing.step3Text') },
    { icon: Repeat, title: t('agency.landing.step4Title'), text: t('agency.landing.step4Text') },
  ];

  const benefits = [
    { icon: Repeat, title: t('agency.landing.benefit1Title'), text: t('agency.landing.benefit1Text') },
    { icon: LineChart, title: t('agency.landing.benefit2Title'), text: t('agency.landing.benefit2Text') },
    { icon: ShieldCheck, title: t('agency.landing.benefit3Title'), text: t('agency.landing.benefit3Text') },
  ];

  const faqs = [
    { q: t('agency.landing.faq1Q'), a: t('agency.landing.faq1A') },
    { q: t('agency.landing.faq2Q'), a: t('agency.landing.faq2A') },
    { q: t('agency.landing.faq3Q'), a: t('agency.landing.faq3A') },
    { q: t('agency.landing.faq4Q'), a: t('agency.landing.faq4A') },
  ];

  const exampleRows: Array<[string, string]> = [
    [t('agency.landing.exampleRow1Label'), t('agency.landing.exampleRow1Value')],
    [t('agency.landing.exampleRow2Label'), t('agency.landing.exampleRow2Value')],
    [t('agency.landing.exampleRow3Label'), t('agency.landing.exampleRow3Value')],
  ];

  return (
    <AgencyPublicShell>
      <section className="hero-surface relative overflow-hidden text-white">
        <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
        <SellerContainer className="relative py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-retail-gold" />
              {t('agency.landing.badge')}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              {t('agency.landing.titleLine1')} <span className="text-retail-gold">{t('agency.landing.titleHighlight')}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              {t('agency.landing.lead')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-retail-gold font-bold text-retail-dark-green hover:bg-retail-gold/90">
                <Link to="/agency/apply">
                  {t('agency.header.applyToJoin')}
                  <ArrowRight className="ml-1.5 h-4 w-4 rtl:rotate-180" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                <Link to="/agency/signin">{t('agency.header.partnerSignIn')}</Link>
              </Button>
            </div>
          </div>
        </SellerContainer>
      </section>

      <section id="how" className="scroll-mt-28 py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading
            eyebrow={t('agency.landing.howEyebrow')}
            title={t('agency.landing.howTitle')}
            description={t('agency.landing.howDescription')}
          />
          <ol className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-retail-green pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-green text-xs font-bold text-retail-card">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-retail-dark-green">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-retail-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <SellerSectionHeading
              eyebrow={t('agency.landing.exampleEyebrow')}
              title={t('agency.landing.exampleTitle')}
              description={t('agency.landing.exampleDescription')}
            />
            <dl className="mt-5 divide-y divide-retail-border border-t border-retail-border bg-white">
              {exampleRows.map(([label, value], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${index === 2 ? 'text-base font-extrabold text-retail-dark-green' : 'text-sm'}`}
                >
                  <dt className={index === 2 ? '' : 'text-retail-muted'}>{label}</dt>
                  <dd className="font-bold text-retail-dark-green">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-5 text-retail-muted">
              {t('agency.landing.exampleFootnote')}
            </p>
          </div>
          <div className="min-w-0">
            <SellerSectionHeading eyebrow={t('agency.landing.whyEyebrow')} title={t('agency.landing.whyTitle')} />
            <div className="mt-5">
              <AgencyFeatureList items={benefits} columns={2} />
            </div>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} title={t('agency.landing.faqTitle')} />

      <AgencyCTA
        variant="dark"
        title={t('agency.landing.ctaTitle')}
        text={t('agency.landing.ctaText')}
        primaryLabel={t('agency.landing.ctaPrimary')}
      />
    </AgencyPublicShell>
  );
}
