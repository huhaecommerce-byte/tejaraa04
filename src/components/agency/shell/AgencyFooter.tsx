import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { Handshake } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

interface FooterLink {
  labelKey: TranslationKey;
  to: string;
}

interface FooterGroup {
  titleKey: TranslationKey;
  links: FooterLink[];
}

const groups: FooterGroup[] = [
  {
    titleKey: 'agency.footer.groupProgramme',
    links: [
      { labelKey: 'agency.footer.programmeOverview', to: '/agency' },
      { labelKey: 'agency.footer.howItWorks', to: '/agency/how-it-works' },
      { labelKey: 'agency.footer.commissionPayouts', to: '/agency/commission' },
      { labelKey: 'agency.footer.whoCanJoin', to: '/agency/who-can-join' },
    ],
  },
  {
    titleKey: 'agency.footer.groupPartners',
    links: [
      { labelKey: 'agency.footer.applyToJoin', to: '/agency/apply' },
      { labelKey: 'agency.footer.partnerSignIn', to: '/agency/signin' },
      { labelKey: 'agency.footer.partnerPortal', to: '/agency/portal' },
      { labelKey: 'agency.footer.resetPassword', to: '/agency/forgot-password' },
    ],
  },
  {
    titleKey: 'agency.footer.groupResources',
    links: [
      { labelKey: 'agency.footer.faq', to: '/agency/faq' },
      { labelKey: 'agency.footer.guidesArticles', to: '/blog' },
      { labelKey: 'agency.footer.otherLanguage', to: '/ar/agency' },
    ],
  },
  {
    titleKey: 'agency.footer.groupPlatforms',
    links: [
      { labelKey: 'agency.footer.shop', to: '/' },
      { labelKey: 'agency.footer.selling', to: '/selling' },
      { labelKey: 'agency.footer.suppliers', to: '/partners' },
      { labelKey: 'agency.footer.agencies', to: '/agency' },
    ],
  },
];

export function AgencyFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-16 border-t border-retail-border bg-retail-card">
      <RetailContainer className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div>
            <BrandLogo variant="storefront-footer" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-retail-muted">
              {t('agency.footer.blurb')}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">
              <Handshake className="h-4 w-4" /> {t('agency.footer.growTogether')}
            </p>
          </div>
          {groups.map((group) => (
            <div key={group.titleKey}>
              <h3 className="text-sm font-extrabold text-retail-dark-green">{t(group.titleKey)}</h3>
              <nav aria-label={t(group.titleKey)} className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <Link key={link.labelKey} to={link.to} className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green">
                    {t(link.labelKey)}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-retail-border pt-6 text-xs text-retail-muted">
          {t('agency.footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </RetailContainer>
    </footer>
  );
}
