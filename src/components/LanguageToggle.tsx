import { Link, useLocation } from '@/lib/router-compat';
import { Globe2 } from 'lucide-react';

const ACTIVE_PILL =
  'flex items-center gap-1.5 rounded-full bg-retail-card px-3 py-1 text-[11px] font-bold text-retail-dark-green shadow-sm';
const INACTIVE_PILL =
  'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-primary-foreground/75 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground';

/**
 * Shared English/العربية pill toggle used across all four storefront headers
 * (shop, selling, agency, partners). Arabic pages live under /ar.
 */
export function LanguageToggle({ arabicTo = '/ar' }: { arabicTo?: string }) {
  const { pathname } = useLocation();
  const isArabic = pathname === '/ar' || pathname.startsWith('/ar/');

  return (
    <nav
      aria-label="Language"
      className="flex shrink-0 items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 p-0.5 shadow-inner"
    >
      {isArabic ? (
        <span className={ACTIVE_PILL}>
          <Globe2 className="h-3.5 w-3.5" />
          العربية
        </span>
      ) : (
        <Link to={arabicTo} className={INACTIVE_PILL}>
          <Globe2 className="h-3.5 w-3.5" />
          العربية
        </Link>
      )}
      {isArabic ? (
        <Link to="/" className={INACTIVE_PILL}>
          English
        </Link>
      ) : (
        <span className={ACTIVE_PILL}>English</span>
      )}
    </nav>
  );
}
