import { useLocale } from '@/i18n/LocaleProvider';
import { Link, useSearchParams } from '@/lib/router-compat';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Package, XCircle } from 'lucide-react';

export default function ShopThankYou() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const paid = params.get('paid') === '1';
  const status = (params.get('status') || '').toLowerCase();

  const failed = status === 'failed' || status === 'cancelled';
  const pending = !failed && (status === 'pending' || status === 'processing');

  return (
    <RetailPublicShell>
      <RetailContainer className="py-8 lg:py-12">
        <div className="mx-auto max-w-xl rounded-lg border border-retail-border bg-retail-card p-6 text-center lg:p-8">
          {failed ? (
            <>
              <XCircle className="mx-auto mb-3 h-12 w-12 text-retail-sale" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-retail-text lg:text-2xl">
                {t('shopx.thankYou.failedTitle')}
              </h1>
              <p className="mt-2 text-sm text-retail-muted">
                {t('shopx.thankYou.failedDescription')}
              </p>
            </>
          ) : pending ? (
            <>
              <Clock className="mx-auto mb-3 h-12 w-12 text-retail-gold" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-retail-text lg:text-2xl">
                {t('shopx.thankYou.pendingTitle')}
              </h1>
              <p className="mt-2 text-sm text-retail-muted">
                {t('shopx.thankYou.pendingDescription')}
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-retail-light-green">
                <CheckCircle2 className="h-8 w-8 text-retail-green" aria-hidden="true" />
              </span>
              <h1 className="font-display text-xl font-bold text-retail-text lg:text-2xl">
                {t('shopx.thankYou.confirmedTitle')}
              </h1>
              <p className="mt-2 text-sm text-retail-muted">
                {t('shopx.thankYou.thankYouFor')}{' '}
                {paid
                  ? t('shopx.thankYou.paidMessage')
                  : t('shopx.thankYou.codMessage')}
              </p>
            </>
          )}

          {ref && (
            <dl className="mt-5 grid gap-2 rounded-md border border-retail-border bg-retail-page p-4 text-left text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <dt className="text-retail-muted">{t('shopx.thankYou.orderNumber')}</dt>
                <dd className="font-bold text-retail-text">{ref}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <dt className="text-retail-muted">{t('shopx.thankYou.paymentMethod')}</dt>
                <dd className="font-semibold text-retail-text">
                  {paid ? t('shopx.thankYou.card') : t('shopx.thankYou.cod')}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {failed ? (
              <Button asChild>
                <Link to="/checkout/shop">{t('shopx.thankYou.tryAgain')}</Link>
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link to="/account/orders">
                  <Package className="h-4 w-4" aria-hidden="true" />
                  {t('shopx.thankYou.viewOrders')}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/catalog">{t('shopx.thankYou.continueShopping')}</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-retail-muted">
            {t('shopx.thankYou.needHelp')}{' '}
            <Link to="/contact" className="font-semibold text-retail-green hover:underline">
              {t('shopx.thankYou.contactUs')}
            </Link>
          </p>
        </div>
      </RetailContainer>
    </RetailPublicShell>
  );
}
