import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from '@/lib/router-compat';
import { dictionaries, en, type Locale, type TranslationKey } from './dictionary';

const STORAGE_KEY = 'tejaraa.locale';

interface LocaleContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  isArabic: boolean;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(value: string, vars?: Record<string, string | number>) {
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

function pathIsArabic(pathname: string) {
  return pathname === '/ar' || pathname.startsWith('/ar/');
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // SSR always renders English so hydration matches; the effect below
  // switches to the stored/URL locale on the client.
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (pathIsArabic(pathname)) {
      setLocaleState('ar');
      return;
    }
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    setLocaleState(stored === 'ar' ? 'ar' : 'en');
  }, [hydrated, pathname]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — locale still applies for this session */
    }
  }, []);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const table = dictionaries[locale];
      return interpolate(table[key] ?? en[key] ?? key, vars);
    },
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir, isArabic: locale === 'ar', setLocale, t }),
    [locale, dir, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Safe fallback for components rendered outside the provider (tests, isolated stories).
  return {
    locale: 'en',
    dir: 'ltr',
    isArabic: false,
    setLocale: () => {},
    t: (key, vars) => interpolate(en[key] ?? key, vars),
  };
}

/** Convenience hook when only the translate function is needed. */
export function useT() {
  return useLocale().t;
}
