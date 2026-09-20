import { Link, useLocation } from '@/lib/router-compat';
import { ChevronDown } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerPlatformSwitcher } from './SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MobileNavDrawer } from '@/components/shell/MobileNavDrawer';
import { servicePages } from '@/data/sellerServicePages';
import { useLocale } from '@/i18n/LocaleProvider';

export function SellerHeader() {
  const { t, dir } = useLocale();
  const navItems = [
    { label: t('selling.header.navHowItWorks'), to: '/selling/how-it-works' },
    { label: t('selling.header.navIntegrations'), to: '/selling/integrations' },
    { label: t('selling.header.navWhyTejaraa'), to: '/selling#why-tejaraa' },
  ];
  // "Why Tejaraa" leads the navigation, ahead of the Services menu.
  const whyTejaraaItem = navItems.find((item) => item.to === '/selling#why-tejaraa')!;
  const restNavItems = navItems.filter((item) => item.to !== '/selling#why-tejaraa');
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


  return (
    <header dir={dir} className="sticky top-0 z-40">
      {/* ROW 1 — platform switcher / utility */}
      <div className="bg-retail-dark-green text-white">
        <SellerContainer className="flex h-11 items-center justify-between gap-3">
          <SellerPlatformSwitcher />
          <LanguageToggle />
        </SellerContainer>
      </div>

      {/* ROW 2 — main navigation */}
      <div className="relative z-20 border-b border-retail-border bg-white/95 backdrop-blur">
        <SellerContainer className="relative flex h-16 items-center gap-4">
          {/* mobile menu */}
          <MobileNavDrawer
            current="selling"
            title={t('selling.header.sheetTitle')}
            description={t('selling.header.sheetDesc')}
            triggerLabel={t('selling.header.mobileMenuAria')}
            groups={[
              {
                items: [
                  ...(whyTejaraaItem ? [{ label: whyTejaraaItem.label, to: whyTejaraaItem.to }] : []),
                  ...restNavItems.map((item) => ({ label: item.label, to: item.to })),
                  { label: t('selling.header.resources'), to: '/blog' },
                ],
              },
              {
                label: t('selling.header.services'),
                collapsible: true,
                defaultOpen: onServicePage,
                items: servicePages.map((page) => ({ label: t(page.navLabel), to: page.path, icon: page.icon })),
              },
              { items: [{ label: t('selling.header.talkToUs'), to: '/selling/contact' }] },
            ]}
            actions={[
              { label: t('selling.header.startSelling'), to: '/selling/signup' },
              { label: t('selling.header.signIn'), to: '/selling/signin', variant: 'outline' },
            ]}
          />


          <Link to="/selling" aria-label={t('selling.header.homeAria')} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 lg:static lg:translate-x-0 lg:translate-y-0">
            <BrandLogo variant="storefront" className="h-10 lg:h-12" />
            <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green sm:inline">
              {t('selling.header.brandTag')}
            </span>
          </Link>

          <nav aria-label={t('selling.header.desktopNavAria')} className="ml-2 hidden items-center gap-1 lg:flex">
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
                {t('selling.header.services')}
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
                      {t(page.navLabel)}
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
            <Link to="/blog" aria-current={onBlogPage ? 'page' : undefined} className={deskLink(onBlogPage)}>{t('selling.header.resources')}</Link>
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Button asChild variant="outline" className="hidden border-retail-border font-semibold text-retail-dark-green sm:inline-flex lg:inline-flex">
              <Link to="/selling/signin">{t('selling.header.signIn')}</Link>
            </Button>
            <Button asChild className="bg-retail-green font-semibold text-white hover:bg-retail-dark-green">
              <Link to="/selling/signup">
                <span className="hidden sm:inline">{t('selling.header.startSelling')}</span>
                <span className="sm:hidden">{t('selling.header.getStarted')}</span>
              </Link>
            </Button>
          </div>
        </SellerContainer>
      </div>
    </header>
  );
}
