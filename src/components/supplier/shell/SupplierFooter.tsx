import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierApplyPath, supplierSignInPath } from '@/data/supplierPartners';
import { ShieldCheck } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

interface FooterGroup {
  title: string;
  links: { label: string; to: string }[];
}

function useFooterGroups(): FooterGroup[] {
  const { t } = useLocale();
  return [
    {
      title: t('supplier.footer.becomeSupplierTitle'),
      links: [
        { label: t('supplier.footer.whoCanSupply'), to: '/partners/who-can-supply' },
        { label: t('supplier.footer.howItWorks'), to: '/partners/how-it-works' },
        { label: t('supplier.footer.waysToSupply'), to: '/partners/supply-models' },
        { label: t('supplier.footer.createAccount'), to: supplierApplyPath },
      ],
    },
    {
      title: t('supplier.footer.resourcesTitle'),
      links: [
        { label: t('supplier.footer.categoriesWeSource'), to: '/partners/categories' },
        { label: t('supplier.footer.whatWeLookFor'), to: '/partners/requirements' },
        { label: t('supplier.footer.marketsAndChannels'), to: '/partners/markets' },
        { label: t('supplier.footer.supplierSignIn'), to: supplierSignInPath },
      ],
    },
    {
      title: t('supplier.footer.companyTitle'),
      links: [
        { label: t('supplier.footer.contactTejaraa'), to: '/partners/contact' },
        { label: t('supplier.footer.pricing'), to: '/pricing' },
        { label: t('supplier.footer.guides'), to: '/blog' },
      ],
    },
    {
      title: t('supplier.footer.platformsTitle'),
      links: [
        { label: t('supplier.footer.shop'), to: '/' },
        { label: t('supplier.footer.dropshipping'), to: '/selling' },
        { label: t('supplier.footer.suppliers'), to: '/partners' },
      ],
    },
  ];
}

function FooterLinks({ group }: { group: FooterGroup }) {
  return (
    <nav aria-label={group.title} className="space-y-2">
      {group.links.map((link) => (
        <Link
          key={link.label}
          to={link.to}
          className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function SupplierFooter() {
  const { t } = useLocale();
  const groups = useFooterGroups();
  return (
    <footer className="mt-auto border-t border-retail-border bg-retail-card">
      <SupplierContainer className="py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.4fr]">
          <div className="min-w-0">
            <Link to="/partners" aria-label={t('supplier.footer.homeAria')} className="inline-block">
              <BrandLogo variant="storefront" className="max-w-[180px]" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-retail-muted">
              {t('supplier.footer.blurb')}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-retail-dark-green">
              <span className="text-retail-muted">{t('supplier.footer.language')}</span>
              <Link to="/" className="rounded border border-retail-border px-2 py-1 hover:border-retail-green hover:text-retail-green">
                English
              </Link>
              <Link to="/ar" className="rounded border border-retail-border px-2 py-1 hover:border-retail-green hover:text-retail-green">
                العربية
              </Link>
            </div>
          </div>

          {/* Desktop / tablet columns */}
          <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title} className="min-w-0">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-retail-text">
                  {group.title}
                </h2>
                <FooterLinks group={group} />
              </div>
            ))}
          </div>

          {/* Mobile accordions */}
          <div className="divide-y divide-retail-border border-y border-retail-border sm:hidden">
            {groups.map((group) => (
              <details key={group.title} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-2 text-sm font-bold text-retail-text">
                  {group.title}
                  <span aria-hidden="true" className="text-retail-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-2">
                  <FooterLinks group={group} />
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-retail-border pt-4 text-xs text-retail-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t('supplier.footer.copyright')}</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-retail-green" aria-hidden="true" />
            {t('supplier.footer.approvalNotice')}
          </p>
        </div>
      </SupplierContainer>
    </footer>
  );
}
