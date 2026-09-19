import { FolderSearch } from 'lucide-react';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer, RetailEmptyState, RetailErrorState } from '@/components/retail/common';
import { useLocale } from '@/i18n/LocaleProvider';

export function ListingRouteError() {
  const { t } = useLocale();
  return <RetailPublicShell><main><RetailContainer className="py-4"><section className="rounded-lg border border-retail-border bg-retail-card"><RetailErrorState title={t('shopx.listing.errorTitle')} description={t('shopx.listing.errorDescription')} onRetry={() => window.location.reload()} /></section></RetailContainer></main></RetailPublicShell>;
}

export function ListingRouteNotFound() {
  const { t } = useLocale();
  return <RetailPublicShell><main><RetailContainer className="py-4"><section className="rounded-lg border border-retail-border bg-retail-card"><RetailEmptyState icon={FolderSearch} title={t('shopx.category.notFoundTitle')} description={t('shopx.category.notFoundDescription')} actionLabel={t('shopx.category.browseAll')} actionHref="/category" /></section></RetailContainer></main></RetailPublicShell>;
}
