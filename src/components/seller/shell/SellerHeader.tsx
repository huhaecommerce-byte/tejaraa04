import { useState } from 'react';
import { Link, useLocation } from '@/lib/router-compat';
import { ChevronDown, Menu } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerPlatformSwitcher } from './SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { servicePages } from '@/data/sellerServicePages';

const navItems = [
  { label: 'How It Works', to: '/selling/how-it-works' },
  { label: 'Integrations', to: '/selling/integrations' },
  { label: 'Why Tejaraa', to: '/selling#why-tejaraa' },
];

// "Why Tejaraa" leads the navigation, ahead of the Services menu.
const whyTejaraaItem = navItems.find((item) => item.to === '/selling#why-tejaraa')!;
const restNavItems = navItems.filter((item) => item.to !== '/selling#why-tejaraa');

export function SellerHeader() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { pathname } = useLocation();
  const activePath = pathname.replace(/\/+$/, '') || '/';
  const onServicePage = servicePages.some((page) => page.path === activePath);
  const onBlogPage = activePath === '/blog' || activePath.startsWith('/blog/');
  // Anchor links (\/selling#...) are never treated as the current page.
  const isActive = (to: string) => !to.includes('#') && to === activePath;
  const deskLink = (active: boolean) =>
    `rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-retail-light-green hover:text-retail-dark-green ${
      active ? 'bg-retail-light-green text-retail-dark-green' : 'text-retail-text'
    }`;
  const drawerLink = (active: boolean) =>
    `rounded-md px-2.5 py-2.5 text-sm font-semibold hover:bg-retail-light-green hover:text-retail-dark-green ${
      active ? 'bg-retail-light-green text-retail-dark-green' : 'text-retail-text'
    }`;

  return (
    <header className="sticky top-0 z-40">
      {/* ROW 1 — platform switcher / utility */}
      <div className="bg-retail-dark-green text-white">
        <SellerContainer className="flex h-11 items-center justify-between gap-3">
          <SellerPlatformSwitcher />
          <LanguageToggle />
        </SellerContainer>
      </div>

      {/* ROW 2 — main navigation */}
      <div className="relative z-20 border-b border-retail-border bg-white/95 backdrop-blur">
        <SellerContainer className="flex h-16 items-center gap-4">
          {/* mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
              <SheetHeader className="border-b border-retail-border px-5 py-4 text-left">
                <SheetTitle className="text-retail-dark-green">Tejaraa Seller Services</SheetTitle>
                <SheetDescription className="text-retail-muted">
                  Sourcing, dropshipping and fulfilment for e-commerce sellers.
                </SheetDescription>
              </SheetHeader>

              {/* Services stay collapsed by default so the menu remains compact. */}
              <nav aria-label="Seller services" className="px-3 py-3">
                {whyTejaraaItem && (
                  <SheetClose asChild key={whyTejaraaItem.to}>
                    <Link
                      to={whyTejaraaItem.to}
                      aria-current={isActive(whyTejaraaItem.to) ? 'page' : undefined}
                      className={drawerLink(isActive(whyTejaraaItem.to))}
                    >
                      {whyTejaraaItem.label}
                    </Link>
                  </SheetClose>
                )}
                <Collapsible open={servicesOpen || onServicePage} onOpenChange={setServicesOpen}>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-sm font-semibold text-retail-text hover:bg-retail-light-green hover:text-retail-dark-green">
                    Services
                    <ChevronDown
                      className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid gap-1 pl-2.5 pt-1">
                    {servicePages.map((page) => (
                      <SheetClose asChild key={page.path}>
                        <Link
                          to={page.path}
                          aria-current={isActive(page.path) ? 'page' : undefined}
                          className={`rounded-md px-2.5 py-2 text-sm font-medium ${
                            isActive(page.path) ? 'bg-retail-light-green text-retail-dark-green' : 'text-retail-text'
                          } hover:bg-retail-light-green hover:text-retail-dark-green`}
                        >
                          {page.navLabel}
                        </Link>
                      </SheetClose>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </nav>

              <nav aria-label="Seller Services sections" className="grid gap-1 border-t border-retail-border px-3 py-4">
                {restNavItems.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={isActive(item.to) ? 'page' : undefined}
                      className={drawerLink(isActive(item.to))}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link to="/selling/signup" className={drawerLink(false)}>Start Selling</Link>
                </SheetClose>
              </nav>

              <div className="border-t border-retail-border px-3 py-4">
                <p className="px-2.5 pb-2 text-xs font-bold uppercase tracking-wider text-retail-muted">Tejaraa platforms</p>
                <SellerPlatformSwitcher layout="stacked" onDark={false} onNavigate={() => setOpen(false)} />
              </div>
              <div className="border-t border-retail-border px-5 py-4">
                <SheetClose asChild>
                  <Link to="/selling/signin" className={`block ${drawerLink(false)}`}>Sign in</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/selling/contact" className={`block ${drawerLink(false)}`}>Talk to us</Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/selling" aria-label="Tejaraa Seller Services home" className="flex shrink-0 items-center gap-2">
            <BrandLogo variant="storefront" />
            <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green sm:inline">
              Dropshipping &amp; Selling
            </span>
          </Link>

          <nav aria-label="Seller Services" className="ml-2 hidden items-center gap-1 lg:flex">
            {whyTejaraaItem && (
              <Link
                key={whyTejaraaItem.to}
                to={whyTejaraaItem.to}
                aria-current={isActive(whyTejaraaItem.to) ? 'page' : undefined}
                className={deskLink(isActive(whyTejaraaItem.to))}
              >
                {whyTejaraaItem.label}
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-retail-light-green hover:text-retail-dark-green data-[state=open]:bg-retail-light-green ${
                  onServicePage ? 'bg-retail-light-green text-retail-dark-green' : 'text-retail-text'
                }`}
              >
                Services
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {servicePages.map((page) => (
                  <DropdownMenuItem key={page.path} asChild>
                    <Link
                      to={page.path}
                      aria-current={isActive(page.path) ? 'page' : undefined}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <page.icon className="h-4 w-4 text-retail-green" aria-hidden />
                      {page.navLabel}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {restNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className={deskLink(isActive(item.to))}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/blog" aria-current={onBlogPage ? 'page' : undefined} className={deskLink(onBlogPage)}>Resources</Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="hidden border-retail-border font-semibold text-retail-dark-green sm:inline-flex lg:inline-flex">
              <Link to="/selling/signin">Sign in</Link>
            </Button>
            <Button asChild className="bg-retail-green font-semibold text-white hover:bg-retail-dark-green">
              <Link to="/selling/signup">
                <span className="hidden sm:inline">Start Selling</span>
                <span className="sm:hidden">Get Started</span>
              </Link>
            </Button>
          </div>
        </SellerContainer>
      </div>
    </header>
  );
}
