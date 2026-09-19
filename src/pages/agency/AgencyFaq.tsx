import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyPageHero } from '@/components/agency/sections';
import { ServiceFAQ } from '@/components/seller/service';
import { useLocale } from '@/i18n/LocaleProvider';
import { HelpCircle } from 'lucide-react';

export default function AgencyFaq() {
  const { t } = useLocale();

  const faqs = [
    { q: t('agency.faq.q1'), a: t('agency.faq.a1') },
    { q: t('agency.faq.q2'), a: t('agency.faq.a2') },
    { q: t('agency.faq.q3'), a: t('agency.faq.a3') },
    { q: t('agency.faq.q4'), a: t('agency.faq.a4') },
    { q: t('agency.faq.q5'), a: t('agency.faq.a5') },
    { q: t('agency.faq.q6'), a: t('agency.faq.a6') },
    { q: t('agency.faq.q7'), a: t('agency.faq.a7') },
    { q: t('agency.faq.q8'), a: t('agency.faq.a8') },
    { q: t('agency.faq.q9'), a: t('agency.faq.a9') },
    { q: t('agency.faq.q10'), a: t('agency.faq.a10') },
  ];

  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: t('agency.faq.crumb') }]} />
      <AgencyPageHero
        icon={HelpCircle}
        eyebrow={t('agency.faq.eyebrow')}
        title={t('agency.faq.heroTitle')}
        lead={t('agency.faq.heroLead')}
        tags={[t('agency.faq.tagJoining'), t('agency.faq.tagCommission'), t('agency.faq.tagPayouts')]}
      />

      <ServiceFAQ items={faqs} title={t('agency.faq.title')} />

      <AgencyCTA
        variant="dark"
        title={t('agency.faq.ctaTitle')}
        text={t('agency.faq.ctaText')}
        primaryLabel={t('agency.bits.applyToJoin')}
        primaryTo="/agency/apply"
      />
    </AgencyPublicShell>
  );
}
