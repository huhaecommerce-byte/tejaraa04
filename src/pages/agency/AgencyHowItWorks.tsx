import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { useLocale } from '@/i18n/LocaleProvider';
import { ClipboardCheck, Link2, ShoppingBag, Coins, Wallet, LineChart, ListChecks } from 'lucide-react';

export default function AgencyHowItWorks() {
  const { t } = useLocale();

  const journey = [
    { icon: ClipboardCheck, title: t('agency.how.step1Title'), text: t('agency.how.step1Text') },
    { icon: Link2, title: t('agency.how.step2Title'), text: t('agency.how.step2Text') },
    { icon: ShoppingBag, title: t('agency.how.step3Title'), text: t('agency.how.step3Text') },
    { icon: Coins, title: t('agency.how.step4Title'), text: t('agency.how.step4Text') },
    { icon: LineChart, title: t('agency.how.step5Title'), text: t('agency.how.step5Text') },
    { icon: Wallet, title: t('agency.how.step6Title'), text: t('agency.how.step6Text') },
  ];

  const responsibilities = [
    { who: t('agency.how.tejaraaWho'), items: [t('agency.how.tejaraaItem1'), t('agency.how.tejaraaItem2'), t('agency.how.tejaraaItem3'), t('agency.how.tejaraaItem4')] },
    { who: t('agency.how.youWho'), items: [t('agency.how.youItem1'), t('agency.how.youItem2'), t('agency.how.youItem3'), t('agency.how.youItem4')] },
  ];

  const faqs = [
    { q: t('agency.how.faq1Q'), a: t('agency.how.faq1A') },
    { q: t('agency.how.faq2Q'), a: t('agency.how.faq2A') },
    { q: t('agency.how.faq3Q'), a: t('agency.how.faq3A') },
    { q: t('agency.how.faq4Q'), a: t('agency.how.faq4A') },
  ];

  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: t('agency.how.crumb') }]} />
      <AgencyPageHero
        icon={ListChecks}
        eyebrow={t('agency.how.eyebrow')}
        title={t('agency.how.heroTitle')}
        lead={t('agency.how.heroLead')}
        tags={[t('agency.how.tagApply'), t('agency.how.tagOnboard'), t('agency.how.tagEarn'), t('agency.how.tagWithdraw')]}
        flow={[t('agency.how.flow1'), t('agency.how.flow2'), t('agency.how.flow3'), t('agency.how.flow4'), t('agency.how.flow5')]}
        flowCaption={t('agency.how.flowCaption')}
      />

      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow={t('agency.how.journeyEyebrow')} title={t('agency.how.journeyTitle')} />
          <ol className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((step, index) => (
              <li key={step.title} className="border-t-2 border-retail-green pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-green text-xs font-bold text-retail-card">
                    {index + 1}
                  </span>
                  <h2 className="text-sm font-bold text-retail-dark-green">{step.title}</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-retail-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow={t('agency.how.splitEyebrow')} title={t('agency.how.splitTitle')} description={t('agency.how.splitDescription')} />
          <ul className="mt-5 grid gap-5 lg:grid-cols-2">
            {responsibilities.map((block) => (
              <li key={block.who} className="border-t-2 border-retail-green bg-white p-4">
                <h3 className="font-extrabold text-retail-dark-green">{block.who}</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-retail-muted">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} />

      <AgencyCTA
        variant="dark"
        title={t('agency.how.ctaTitle')}
        text={t('agency.how.ctaText')}
        secondaryLabel={t('agency.how.ctaSecondary')}
        secondaryTo="/agency/commission"
      />
    </AgencyPublicShell>
  );
}
