import { Store, LogOut } from 'lucide-react';
import { Link, useNavigate } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/i18n/LocaleProvider';

/**
 * Seller (dropshipping) portal header — mirrors AgencyPortalHeader:
 * ROW 1 dark-green platform switcher strip, ROW 2 logo / portal identity row
 * with the signed-in seller block on the right.
 */
export function SellerPortalHeader() {
  const { t, dir } = useLocale();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header dir={dir}>
      {/* ROW 1 — platform switcher / utility */}
      <div className="bg-retail-dark-green text-white">
        <SellerContainer className="flex h-11 items-center justify-between gap-3">
          <SellerPlatformSwitcher current="selling" />
          <LanguageToggle />
        </SellerContainer>
      </div>

      {/* ROW 2 — portal identity */}
      <div className="relative z-20 border-b border-retail-border bg-white/95 backdrop-blur">
        <SellerContainer className="flex h-16 items-center justify-between gap-4">
          <Link to="/dropshipping" className="flex min-w-0 items-center gap-3">
            <BrandLogo variant="storefront" />
            <span className="hidden h-7 w-px bg-retail-border sm:block" aria-hidden />
            <span className="hidden items-center gap-2 text-sm font-bold text-retail-dark-green sm:inline-flex">
              <Store className="h-4 w-4 text-retail-green" /> {t('selling.portalHeader.sellerPortal')}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Signed-in seller block — mirrors the partner portal header */}
            <div className="flex items-center gap-3 border-l border-retail-border pl-3">
              <Link to="/dropshipping/profile" className="hidden items-center gap-3 md:flex">
                <span className="flex flex-col text-right">
                  <span className="text-xs font-medium text-retail-muted">{t('shop.hello', { name: user?.name?.split(' ')[0] ?? '' })}</span>
                  <span className="text-[11px] font-bold uppercase text-retail-green transition-colors hover:text-retail-dark-green">{t('selling.portalHeader.sellerPortal')}</span>
                </span>
                <span className="relative rounded-full p-0.5 ring-2 ring-retail-dark-green/10 transition-transform hover:scale-105">
                  <Avatar className="h-9 w-9 shrink-0">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="bg-retail-light-green text-retail-dark-green text-[10px] font-bold">{(user?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-retail-card bg-retail-green" aria-hidden="true" />
                </span>
              </Link>
              <button
                type="button"
                onClick={() => { void logout().then(() => navigate('/selling/signin')); }}
                aria-label={t("common.logout")}
                className="group hidden h-8 items-center gap-1.5 rounded-full border border-retail-sale/25 px-2.5 text-retail-sale transition-colors hover:border-retail-sale/50 hover:bg-retail-sale/10 md:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                <span className="text-[11px] font-semibold leading-none">{t("common.logout")}</span>
              </button>
            </div>
          </div>
        </SellerContainer>
      </div>
    </header>
  );
}
