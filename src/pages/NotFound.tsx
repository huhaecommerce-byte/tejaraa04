import { useLocation, Link } from "@/lib/router-compat";
import { useEffect } from "react";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLocale } from "@/i18n/LocaleProvider";
import { RetailPublicShell } from "@/components/retail/shell/RetailPublicShell";
import { RetailContainer } from "@/components/retail/common";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLocale();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <RetailPublicShell>
      <SEO
        title={t('shopx.notFound.seoTitle')}
        description={t('shopx.notFound.seoDescription')}
        path={location.pathname}
        noindex
      />
      <main>
        <RetailContainer className="py-10 sm:py-16">
          <div className="mx-auto max-w-xl rounded-xl border border-retail-border bg-retail-card p-6 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-retail-light-green">
              <SearchX className="h-7 w-7 text-retail-dark-green" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-retail-muted">404</p>
            <h1 className="mt-1 text-2xl font-extrabold text-retail-text sm:text-3xl">{t('shopx.notFound.title')}</h1>
            <p className="mt-2 text-sm text-retail-muted">
              {t('shopx.notFound.description')}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-retail-dark-green px-4 text-sm font-bold text-white hover:bg-retail-green"
              >
                <Home className="h-4 w-4" aria-hidden="true" /> {t('shopx.notFound.goHome')}
              </Link>
              <Link
                to="/category"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-retail-dark-green px-4 text-sm font-bold text-retail-dark-green hover:bg-retail-light-green"
              >
                {t('shopx.notFound.browseCategories')}
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-retail-border px-4 text-sm font-bold text-retail-text hover:bg-retail-page"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('shopx.notFound.goBack')}
              </button>
            </div>
          </div>
        </RetailContainer>
      </main>
    </RetailPublicShell>
  );
};

export default NotFound;
