import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierApplyPath, supplierSignInPath } from '@/data/supplierPartners';
import { ShieldCheck } from 'lucide-react';

interface FooterGroup {
  title: string;
  links: { label: string; to: string }[];
}

const groups: FooterGroup[] = [
  {
    title: 'Become a supplier',
    links: [
      { label: 'Who can supply', to: '/partners/who-can-supply' },
      { label: 'How it works', to: '/partners/how-it-works' },
      { label: 'Ways to supply', to: '/partners/supply-models' },
      { label: 'Create a supplier account', to: supplierApplyPath },
    ],
  },
  {
    title: 'Supplier resources',
    links: [
      { label: 'Categories we source', to: '/partners/categories' },
      { label: 'What we look for', to: '/partners/requirements' },
      { label: 'Markets and channels', to: '/partners/markets' },
      { label: 'Supplier sign in', to: supplierSignInPath },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact Tejaraa', to: '/partners/contact' },
      { label: 'Plans & pricing', to: '/pricing' },
      { label: 'Guides & articles', to: '/blog' },
    ],
  },
  {
    title: 'Tejaraa platforms',
    links: [
      { label: 'Tejaraa Shop', to: '/' },
      { label: 'Dropshipping & Selling Services', to: '/selling' },
      { label: 'Wholesalers and Suppliers', to: '/partners' },
    ],
  },
];

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
  return (
    <footer className="mt-auto border-t border-retail-border bg-retail-card">
      <SupplierContainer className="py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.4fr]">
          <div className="min-w-0">
            <Link to="/partners" aria-label="Tejaraa Suppliers home" className="inline-block">
              <BrandLogo variant="storefront" className="max-w-[180px]" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-retail-muted">
              Tejaraa works with manufacturers, distributors, wholesalers and importers to bring
              products into e-commerce sales channels in Saudi Arabia and the wider Gulf.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-retail-dark-green">
              <span className="text-retail-muted">Language</span>
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
          <p>© 2026 Tejaraa. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-retail-green" aria-hidden="true" />
            Approval does not guarantee purchase orders
          </p>
        </div>
      </SupplierContainer>
    </footer>
  );
}
