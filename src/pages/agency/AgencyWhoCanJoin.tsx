import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyFeatureList, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { useLocale } from '@/i18n/LocaleProvider';
import { Briefcase, CheckCircle2, GraduationCap, Laptop, Megaphone, Users, XCircle } from 'lucide-react';

export default function AgencyWhoCanJoin() {
  const { t } = useLocale();

  const profiles = [
    { icon: Briefcase, title: t('agency.who.profile1Title'), text: t('agency.who.profile1Text') },
    { icon: Laptop, title: t('agency.who.profile2Title'), text: t('agency.who.profile2Text') },
    { icon: GraduationCap, title: t('agency.who.profile3Title'), text: t('agency.who.profile3Text') },
    { icon: Megaphone, title: t('agency.who.profile4Title'), text: t('agency.who.profile4Text') },
    { icon: Users, title: t('agency.who.profile5Title'), text: t('agency.who.profile5Text') },
  ];

  const expectations = [
    t('agency.who.expect1'),
    t('agency.who.expect2'),
    t('agency.who.expect3'),
    t('agency.who.expect4'),
  ];

  const notAllowed = [
    t('agency.who.notAllowed1'),
    t('agency.who.notAllowed2'),
    t('agency.who.notAllowed3'),
    t('agency.who.notAllowed4'),
  ];

  const faqs = [
    { q: t('agency.who.faq1Q'), a: t('agency.who.faq1A') },
    { q: t('agency.who.faq2Q'), a: t('agency.who.faq2A') },
    { q: t('agency.who.faq3Q'), a: t('agency.who.faq3A') },
    { q: t('agency.who.faq4Q'), a: t('agency.who.faq4A') },
  ];

  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: t('agency.who.crumb') }]} />
      <AgencyPageHero
        icon={Users}
        eyebrow={t('agency.who.eyebrow')}
        title={t('agency.who.heroTitle')}
        lead={t('agency.who.heroLead')}
        tags={[t('agency.who.tagFree'), t('agency.who.tagReviewed'), t('agency.who.tagWorldwide')]}
      />

      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow={t('agency.who.profilesEyebrow')} title={t('agency.who.profilesTitle')} description={t('agency.who.profilesDescription')} />
          <div className="mt-5">
            <AgencyFeatureList items={profiles} columns={3} />
          </div>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow={t('agency.who.rulesEyebrow')} title={t('agency.who.rulesTitle')} />
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="border-t-2 border-retail-green bg-white p-4">
              <h3 className="font-extrabold text-retail-dark-green">{t('agency.who.expectTitle')}</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-retail-muted">
                {expectations.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-retail-green" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t-2 border-destructive bg-white p-4">
              <h3 className="font-extrabold text-retail-dark-green">{t('agency.who.notAllowedTitle')}</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-retail-muted">
                {notAllowed.map((item) => (
                  <li key={item} className="flex gap-2">
                    <XCircle className="mt-1 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} />

      <AgencyCTA
        variant="dark"
        title={t('agency.who.ctaTitle')}
        text={t('agency.who.ctaText')}
      />
    </AgencyPublicShell>
  );
}
