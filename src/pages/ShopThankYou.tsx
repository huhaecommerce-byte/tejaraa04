import { Link, useSearchParams } from '@/lib/router-compat';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Package, XCircle } from 'lucide-react';

export default function ShopThankYou() {
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
                Payment was not completed
              </h1>
              <p className="mt-2 text-sm text-retail-muted">
                Your order was not placed. You can go back to checkout and try again.
              </p>
            </>
          ) : pending ? (
            <>
              <Clock className="mx-auto mb-3 h-12 w-12 text-retail-gold" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-retail-text lg:text-2xl">
                Payment processing
              </h1>
              <p className="mt-2 text-sm text-retail-muted">
                We are still confirming your payment. This page updates once it is confirmed, and
                you will also see the order in your orders list.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-retail-light-green">
                <CheckCircle2 className="h-8 w-8 text-retail-green" aria-hidden="true" />
              </span>
              <h1 className="font-display text-xl font-bold text-retail-text lg:text-2xl">
                Order confirmed
              </h1>
              <p className="mt-2 text-sm text-retail-muted">
                Thank you for your order.{' '}
                {paid
                  ? 'Your card payment went through and our team is preparing your order.'
                  : 'Our team will call you shortly to confirm delivery. Pay the courier on arrival.'}
              </p>
            </>
          )}

          {ref && (
            <dl className="mt-5 grid gap-2 rounded-md border border-retail-border bg-retail-page p-4 text-left text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <dt className="text-retail-muted">Order number</dt>
                <dd className="font-bold text-retail-text">{ref}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <dt className="text-retail-muted">Payment method</dt>
                <dd className="font-semibold text-retail-text">
                  {paid ? 'Card' : 'Cash on delivery'}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {failed ? (
              <Button asChild>
                <Link to="/checkout/shop">Try again</Link>
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link to="/account/orders">
                  <Package className="h-4 w-4" aria-hidden="true" />
                  View orders
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/catalog">Continue shopping</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-retail-muted">
            Need help?{' '}
            <Link to="/contact" className="font-semibold text-retail-green hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </RetailContainer>
    </RetailPublicShell>
  );
}
