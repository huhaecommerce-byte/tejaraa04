import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyFeatureList, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { useLocale } from '@/i18n/LocaleProvider';
import { CheckCircle2, Clock, Coins, RotateCcw, Wallet } from 'lucide-react';

export default function AgencyCommission() {
  const { t } = useLocale();

  const rules = [
    { icon: CheckCircle2, title: t('agency.commission.rule1Title'), text: t('agency.commission.rule1Text') },
    { icon: Clock, title: t('agency.commission.rule2Title'), text: t('agency.commission.rule2Text') },
    { icon: RotateCcw, title: t('agency.commission.rule3Title'), text: t('agency.commission.rule3Text') },
    { icon: Wallet, title: t('agency.commission.rule4Title'), text: t('agency.commission.rule4Text') },
  ];

  const example = [
    { label: t('agency.commission.exampleRow1Label'), value: t('agency.commission.exampleRow1Value') },
    { label: t('agency.commission.exampleRow2Label'), value: t('agency.commission.exampleRow2Value') },
    { label: t('agency.commission.exampleRow3Label'), value: t('agency.commission.exampleRow3Value') },
    { label: t('agency.commission.exampleRow4Label'), value: t('agency.commission.exampleRow4Value') },
    { label: t('agency.commission.exampleRow5Label'), value: t('agency.commission.exampleRow5Value') },
  ];

  const guarantees = [
    t('agency.commission.guarantee1'),
    t('agency.commission.guarantee2'),
    t('agency.commission.guarantee3'),
    t('agency.commission.guarantee4'),
  ];

  const faqs = [
    { q: t('agency.commission.faq1Q'), a: t('agency.commission.faq1A') },
    { q: t('agency.commission.faq2Q'), a: t('agency.commission.faq2A') },
    { q: t('agency.commission.faq3Q'), a: t('agency.commission.faq3A') },
    { q: t('agency.commission.faq4Q'), a: t('agency.commission.faq4A') },
  ];

  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: t('agency.commission.crumb') }]} />
      <AgencyPageHero
        icon={Coins}
        eyebrow={t('agency.commission.eyebrow')}
        title={t('agency.commission.heroTitle')}
        lead={t('agency.commission.heroLead')}
        tags={[t('agency.commission.tagShare'), t('agency.commission.tagLifetime'), t('agency.commission.tagPaid')]}
        flow={[t('agency.commission.flow1'), t('agency.commission.flow2'), t('agency.commission.flow3'), t('agency.commission.flow4'), t('agency.commission.flow5')]}
        flowCaption={t('agency.commission.flowCaption')}
      />

      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow={t('agency.commission.rulesEyebrow')} title={t('agency.commission.rulesTitle')} description={t('agency.commission.rulesDescription')} />
          <div className="mt-5">
            <AgencyFeatureList items={rules} columns={4} />
          </div>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <SellerSectionHeading eyebrow={t('agency.commission.exampleEyebrow')} title={t('agency.commission.exampleTitle')} as="h2" />
            <dl className="mt-5 divide-y divide-retail-border border-t border-retail-border bg-white">
              {example.map((row, index) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${index === example.length - 1 ? 'text-base font-extrabold text-retail-dark-green' : 'text-sm'}`}
                >
                  <dt className={index === example.length - 1 ? '' : 'text-retail-muted'}>{row.label}</dt>
                  <dd className="font-bold text-retail-dark-green">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-5 text-retail-muted">
              {t('agency.commission.exampleFootnote')}
            </p>
          </div>

          <div className="min-w-0">
            <SellerSectionHeading eyebrow={t('agency.commission.scaleEyebrow')} title={t('agency.commission.scaleTitle')} as="h2" />
            <p className="mt-3 text-sm leading-6 text-retail-muted">
              {t('agency.commission.scaleText')}
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-retail-dark-green">
              {guarantees.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-retail-green" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} />

      <AgencyCTA
        variant="dark"
        title={t('agency.commission.ctaTitle')}
        text={t('agency.commission.ctaText')}
      />
    </AgencyPublicShell>
  );
}
