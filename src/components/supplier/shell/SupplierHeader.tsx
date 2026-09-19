import { useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Menu, PhoneCall } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierApplyPath, supplierSignInPath } from '@/data/supplierPartners';

const sectionLinks = [
  { label: 'Why Tejaraa', to: '/partners#why-tejaraa' },
  { label: 'Who Can Supply', to: '/partners/who-can-supply' },
  { label: 'How It Works', to: '/partners/how-it-works' },
  { label: 'Supply Models', to: '/partners/supply-models' },
  { label: 'Categories', to: '/partners/categories' },
  { label: 'Requirements', to: '/partners/requirements' },
  { label: 'Markets', to: '/partners/markets' },
];

export function SupplierHeader() {
  const [open, setOpen] = useState(false);
  const linkClass =
    'rounded-md px-3 py-2 text-sm font-semibold text-retail-text transition-colors hover:bg-retail-light-green hover:text-retail-dark-green';
  const drawerClass =
    'rounded-md px-2.5 py-2.5 text-sm font-semibold text-retail-text hover:bg-retail-light-green hover:text-retail-dark-green';

  return (
    <header className="sticky top-0 z-40">
      {/* ROW 1 — platform switcher / utility */}
      <div className="bg-retail-dark-green text-white">
        <SupplierContainer className="flex h-11 items-center justify-between gap-3">
          <SellerPlatformSwitcher current="suppliers" />
          <div className="hidden items-center gap-3 text-xs font-medium text-white/75 sm:flex">
            <Link to="/partners/contact" className="inline-flex items-center gap-1.5 hover:text-white">
              <PhoneCall className="h-3.5 w-3.5" aria-hidden />
              Talk to us
            </Link>
            <span aria-hidden className="h-3 w-px bg-white/25" />
            <Link to={supplierSignInPath} className="hover:text-white">Supplier sign in</Link>
          </div>
        </SupplierContainer>
      </div>

      {/* ROW 2 — supplier navigation */}
      <div className="relative z-20 border-b border-retail-border bg-white/95 backdrop-blur">
        <SupplierContainer className="flex h-16 items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
              <SheetHeader className="border-b border-retail-border px-5 py-4 text-left">
                <SheetTitle className="text-retail-dark-green">Tejaraa Suppliers</SheetTitle>
                <SheetDescription className="text-retail-muted">
                  Supply products to Tejaraa as a manufacturer, distributor, wholesaler or importer.
                </SheetDescription>
              </SheetHeader>

              <nav aria-label="Suppliers sections" className="grid gap-1 px-3 py-4">
                {sectionLinks.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link to={item.to} className={drawerClass}>{item.label}</Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="border-t border-retail-border px-3 py-4">
                <p className="px-2.5 pb-2 text-xs font-bold uppercase tracking-wider text-retail-muted">Tejaraa platforms</p>
                <SellerPlatformSwitcher
                  current="suppliers"
                  layout="stacked"
                  onDark={false}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              <div className="border-t border-retail-border px-3 py-4">
                <SheetClose asChild>
                  <Link to={supplierSignInPath} className={`block ${drawerClass}`}>Supplier sign in</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/partners/contact" className={`block ${drawerClass}`}>Talk to us</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to={supplierApplyPath} className={`block ${drawerClass}`}>Become a Supplier</Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/partners" aria-label="Tejaraa Suppliers home" className="shrink-0">
            <BrandLogo variant="storefront" />
          </Link>

          <nav aria-label="Suppliers" className="ml-2 hidden items-center gap-1 lg:flex">
            {sectionLinks.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass}>{item.label}</Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="hidden border-retail-border font-semibold text-retail-dark-green sm:inline-flex">
              <Link to={supplierSignInPath}>Sign in</Link>
            </Button>
            <Button asChild className="bg-retail-green font-semibold text-white hover:bg-retail-dark-green">
              <Link to={supplierApplyPath}>
                <span className="hidden sm:inline">Become a Supplier</span>
                <span className="sm:hidden">Apply</span>
              </Link>
            </Button>
          </div>
        </SupplierContainer>
      </div>
    </header>
  );
}
