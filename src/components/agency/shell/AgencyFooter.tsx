import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { Handshake } from 'lucide-react';

interface FooterGroup {
  title: string;
  links: { label: string; to: string }[];
}

const groups: FooterGroup[] = [
  {
    title: 'The programme',
    links: [
      { label: 'Programme overview', to: '/agency' },
      { label: 'How it works', to: '/agency/how-it-works' },
      { label: 'Commission & payouts', to: '/agency/commission' },
      { label: 'Who can join', to: '/agency/who-can-join' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'Apply to join', to: '/agency/apply' },
      { label: 'Partner sign in', to: '/agency/signin' },
      { label: 'Partner portal', to: '/agency/portal' },
      { label: 'Reset password', to: '/agency/forgot-password' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Frequently asked questions', to: '/agency/faq' },
      { label: 'Talk to partnerships', to: '/agency/contact' },
      { label: 'Guides & articles', to: '/blog' },
      { label: 'بالعربية', to: '/ar/agency' },
    ],
  },
  {
    title: 'Tejaraa platforms',
    links: [
      { label: 'Tejaraa Shop', to: '/' },
      { label: 'Dropshipping & Selling Services', to: '/selling' },
      { label: 'Wholesalers and Suppliers', to: '/partners' },
      { label: 'Agencies & VAs', to: '/agency' },
    ],
  },
];

export function AgencyFooter() {
  return (
    <footer className="mt-16 border-t border-retail-border bg-retail-card">
      <RetailContainer className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div>
            <BrandLogo variant="storefront-footer" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-retail-muted">
              The Tejaraa partner programme for agencies and virtual assistants. Onboard dropshippers
              and earn a share of profit on every order they place.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">
              <Handshake className="h-4 w-4" /> Grow together
            </p>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-extrabold text-retail-dark-green">{group.title}</h3>
              <nav aria-label={group.title} className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <Link key={link.label} to={link.to} className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-retail-border pt-6 text-xs text-retail-muted">
          © {new Date().getFullYear()} Tejaraa. All rights reserved.
        </div>
      </RetailContainer>
    </footer>
  );
}
