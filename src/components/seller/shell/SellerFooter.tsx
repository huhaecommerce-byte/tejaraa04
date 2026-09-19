import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { CreditCard } from 'lucide-react';

interface FooterGroup {
  title: string;
  links: { label: string; to?: string; href?: string }[];
}

const groups: FooterGroup[] = [
  {
    title: 'Services',
    links: [
      { label: 'Product hunting', to: '/selling/product-hunting' },
      { label: 'Product sourcing', to: '/selling/product-sourcing' },
      { label: 'Dropshipping', to: '/selling/dropshipping' },
      { label: 'Order fulfilment', to: '/selling/fulfillment' },
      { label: 'Warehousing', to: '/selling/warehousing' },
      { label: 'Packaging & labelling', to: '/selling/packaging-labeling' },
      { label: 'Marketplace preparation', to: '/selling/marketplace-preparation' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'How Tejaraa works', to: '/selling/how-it-works' },
      { label: 'Integrations', to: '/selling/integrations' },
      { label: 'Guides & articles', to: '/blog' },
      { label: 'Frequently asked questions', to: '/selling#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact us', to: '/selling/contact' },
      { label: 'Plans & pricing', to: '/pricing' },
      { label: 'Create seller account', to: '/selling/signup' },
      { label: 'Sign in', to: '/login' },
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
      {group.links.map((link) =>
        link.to ? (
          <Link
            key={link.label}
            to={link.to}
            className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green"
          >
            {link.label}
          </Link>
        ) : (
          <a
            key={link.label}
            href={link.href}
            className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green"
          >
            {link.label}
          </a>
        ),
      )}
    </nav>
  );
}

export function SellerFooter() {
  return (
    <footer className="mt-auto border-t border-retail-border bg-retail-card">
      <SellerContainer className="py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.4fr]">
          <div className="min-w-0">
            <Link to="/selling" aria-label="Tejaraa Seller Services home" className="inline-block">
              <BrandLogo variant="storefront" className="max-w-[180px]" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-retail-muted">
              Seller services for e-commerce businesses in Saudi Arabia — from product sourcing to
              order fulfilment.
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
            <CreditCard className="h-4 w-4 text-retail-green" aria-hidden="true" />
            Request-based pricing — no hidden fees
          </p>
        </div>
      </SellerContainer>
    </footer>
  );
}
