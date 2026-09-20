import { useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { useLocation, useNavigate } from '@/lib/router-compat';
import { useLocale } from '@/i18n/LocaleProvider';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const STORAGE_KEY = 'tejaraa.locale';

/** Portals and staff areas keep their own language; no first-visit prompt there. */
const SKIP_PREFIXES = ['/admin', '/agency-admin', '/supplier-portal'];

/**
 * First-visit language chooser. Shows once per visitor (any entry URL), then
 * remembers the choice and drives the whole site in that language.
 */
export function LanguageGate() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (stored === 'en' || stored === 'ar') return;
    // Arriving on an Arabic URL is already a language choice.
    if (pathname === '/ar' || pathname.startsWith('/ar/')) {
      setLocale('ar');
      return;
    }
    setOpen(true);
  }, [pathname, setLocale]);

  const choose = (next: 'en' | 'ar') => {
    setLocale(next);
    setOpen(false);
    if (next === 'en' && (pathname === '/ar' || pathname.startsWith('/ar/'))) {
      navigate(pathname.replace(/^\/ar(?=\/|$)/, '') || '/');
    }
    if (next === 'ar' && pathname === '/') {
      navigate('/ar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
      <DialogContent className="max-w-sm text-center" showCloseButton={false}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Globe2 className="h-6 w-6" />
        </div>
        <DialogTitle className="text-center text-lg font-semibold">
          Choose your language
          <span className="mt-1 block text-base font-medium text-muted-foreground" dir="rtl">
            اختر لغتك
          </span>
        </DialogTitle>
        <DialogDescription className="text-center">
          We&apos;ll keep the whole site in the language you pick.
          <span className="mt-1 block" dir="rtl">
            سيتم عرض الموقع بالكامل باللغة التي تختارها.
          </span>
        </DialogDescription>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose('en')}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/5"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => choose('ar')}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العربية
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
