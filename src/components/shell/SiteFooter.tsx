import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { ArrowRight, Headphones, ShieldCheck, Truck } from 'lucide-react';

const groups = [
  {
    title: 'Shopping',
    links: [
      { label: 'Shop all products', to: '/catalog' },
      { label: 'Categories', to: '/category' },
      { label: 'Ready to ship', to: '/catalog?source=local' },
      { label: 'Cart', to: '/cart' },
    ],
  },
  {
    title: 'Dropshipping & selling',
    links: [
      { label: 'How it works', to: '/selling' },
      { label: 'Seller services', to: '/services' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Seller dashboard', to: '/dropshipping' },
    ],
  },
  {
    title: 'Wholesale suppliers',
    links: [
      { label: 'Supplier overview', to: '/partners' },
      { label: 'Join as a supplier', to: '/partners/join' },
      { label: 'Supplier sign in', to: '/partners/signin' },
      { label: 'Supplier dashboard', to: '/partners/dashboard' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandLogo variant="storefront-footer" onDark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-background/70">
              One Saudi marketplace for everyday shopping, online sellers, and wholesale suppliers across the GCC.
            </p>
            <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-background hover:text-primary">
              Contact our team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-7 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-bold text-background">{group.title}</h2>
                <nav className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <Link key={link.label} to={link.to} className="block text-sm text-background/65 transition-colors hover:text-background">
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 grid gap-3 border-t border-background/15 pt-6 text-xs text-background/65 sm:grid-cols-3">
          <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Delivery across Saudi Arabia</span>
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Secure marketplace accounts</span>
          <span className="flex items-center gap-2 sm:justify-end"><Headphones className="h-4 w-4 text-primary" /> Arabic &amp; English support</span>
        </div>
        <p className="mt-6 text-xs text-background/50">© 2026 Tejaraa. All rights reserved.</p>
      </div>
    </footer>
  );
}