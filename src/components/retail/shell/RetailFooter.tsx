import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { CreditCard, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const trustItems = [
  { icon: Truck, title: 'Delivery across Saudi Arabia', description: 'Local and imported products' },
  { icon: ShieldCheck, title: 'Secure checkout', description: 'Protected payment experience' },
  { icon: RotateCcw, title: 'Easy returns', description: 'Clear returns support process' },
  { icon: Headphones, title: 'Customer support', description: 'Arabic and English assistance' },
];

interface FooterGroup {
  title: string;
  links: { label: string; to: string }[];
}

const groups: FooterGroup[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All categories', to: '/category' },
      { label: 'Shop all products', to: '/catalog' },
      { label: 'Ready to ship in Saudi Arabia', to: '/catalog?source=local' },
      { label: 'Search products', to: '/search' },
    ],
  },
  {
    title: 'Customer service',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'Track your order', to: '/dropshipping/orders' },
      { label: 'Returns', to: '/dropshipping/returns' },
      { label: 'Your cart', to: '/cart' },
    ],
  },
  {
    title: 'About Tejaraa',
    links: [
      { label: 'Our services', to: '/selling' },
      { label: 'Guides & articles', to: '/blog' },
      { label: 'Wishlist', to: '/dropshipping/favourites' },
    ],
  },
  {
    title: 'For business',
    links: [
      { label: 'Seller services', to: '/selling' },
      { label: 'Suppliers', to: '/partners' },
      { label: 'Agencies & VAs', to: '/agency' },
      { label: 'Pricing', to: '/pricing' },
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

export function RetailFooter({ showTrustBar = true }: { showTrustBar?: boolean }) {
  return (
    <footer className="mt-8 border-t border-retail-border bg-retail-card">
      {showTrustBar && (
        <div className="border-b border-retail-border bg-retail-light-green/50">
          <RetailContainer className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-retail-light-green">
                  <item.icon className="h-4.5 w-4.5 text-retail-green" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-retail-dark-green sm:text-sm">{item.title}</p>
                  <p className="truncate text-xs text-retail-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </RetailContainer>
        </div>
      )}

      <RetailContainer className="py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.4fr]">
          <div className="min-w-0">
            <Link to="/" aria-label="Tejaraa Shop home" className="inline-block">
              <BrandLogo variant="storefront" className="max-w-[180px]" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-retail-muted">
              Everyday shopping across Saudi Arabia — thousands of products, local delivery and
              secure checkout.
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
            Card payments and cash on delivery
          </p>
        </div>
      </RetailContainer>
    </footer>
  );
}
