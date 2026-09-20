import { useLocation, useNavigate } from '@/lib/router-compat';
import { Globe2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

const ACTIVE_PILL =
  'flex items-center gap-1 rounded-full bg-retail-card px-2 py-0.5 text-[10px] font-bold text-retail-dark-green shadow-sm sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]';
const INACTIVE_PILL =
  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary-foreground/75 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]';

/**
 * Shared English/العربية pill toggle used across all four storefront headers
 * (shop, selling, agency, partners).
 *
 * Public pages that have a dedicated Arabic URL pass `arabicTo` so the toggle
 * also moves the visitor to that URL (good for search engines). Everywhere
 * else the toggle simply flips the remembered language on the current page.
 */
export function LanguageToggle({ arabicTo }: { arabicTo?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale } = useLocale();
  const onArabicUrl = pathname === '/ar' || pathname.startsWith('/ar/');
  const isArabic = locale === 'ar';

  const goArabic = () => {
    setLocale('ar');
    const englishLandingPath = arabicTo?.replace(/^\/ar(?=\/|$)/, '') || '/';
    if (arabicTo && !onArabicUrl && pathname === englishLandingPath) {
      navigate(arabicTo);
    }
  };

  const goEnglish = () => {
    setLocale('en');
    if (onArabicUrl) {
      const englishPath = pathname.replace(/^\/ar(?=\/|$)/, '') || '/';
      navigate(englishPath);
    }
  };

  return (
    <nav
      aria-label="Language"
      className="flex shrink-0 items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 p-0.5 shadow-inner"
    >
      <button
        type="button"
        onClick={goArabic}
        aria-pressed={isArabic}
        className={isArabic ? ACTIVE_PILL : INACTIVE_PILL}
      >
        <Globe2 className="h-3.5 w-3.5" />
        العربية
      </button>
      <button
        type="button"
        onClick={goEnglish}
        aria-pressed={!isArabic}
        className={isArabic ? INACTIVE_PILL : ACTIVE_PILL}
      >
        English
      </button>
    </nav>
  );
}
