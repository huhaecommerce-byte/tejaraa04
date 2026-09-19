import { Loader2, LockKeyhole, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";
import { money } from "@/lib/retailPricing";
import type { CartItem } from "@/contexts/CartContext";

export interface CheckoutTotals {
  subtotal: number;
  shipping: number;
  importFee: number;
  vat: number;
  total: number;
}

export function CheckoutOrderSummary({
  items,
  totals,
  courierName,
  payment,
  submitting,
  lineTotal,
  onSubmit,
}: {
  items: CartItem[];
  totals: CheckoutTotals;
  courierName?: string;
  payment: "cod" | "card";
  submitting: boolean;
  lineTotal: (item: CartItem) => number;
  onSubmit: () => void;
}) {
  return (
    <aside
      className="h-fit rounded-lg border border-retail-border bg-retail-card lg:sticky lg:top-[88px]"
      aria-labelledby="checkout-order-summary"
    >
      <div className="flex items-center justify-between border-b border-retail-border px-4 py-4 sm:px-5">
        <h2 id="checkout-order-summary" className="font-display text-lg font-bold">
          Your Order
        </h2>
        <Link
          to="/cart"
          className="text-xs font-bold text-retail-green hover:text-retail-dark-green"
        >
          Edit cart
        </Link>
      </div>
      <div className="max-h-[320px] overflow-y-auto px-4 sm:px-5">
        <ul className="divide-y divide-retail-border">
          {items.map((item) => (
            <li
              key={item.productId}
              className="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-3 py-3"
            >
              <Link
                to={`/product/${item.slug || item.productId}`}
                aria-label={`View ${item.name}`}
                className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-retail-border bg-retail-page"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Package className="h-5 w-5 text-retail-muted" />
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  to={`/product/${item.slug || item.productId}`}
                  className="line-clamp-2 text-xs font-semibold leading-5 text-retail-text hover:text-retail-green"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-xs text-retail-muted">Qty: {item.qty}</p>
              </div>
              <span className="shrink-0 text-xs font-bold">SAR {money(lineTotal(item))}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-retail-border px-4 py-4 sm:px-5">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-retail-muted">Subtotal</dt>
            <dd className="font-semibold">SAR {money(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="min-w-0 text-retail-muted">
              Delivery{courierName ? ` (${courierName})` : ""}
            </dt>
            <dd className="shrink-0 font-semibold">
              {totals.shipping === 0 ? "Free" : `SAR ${money(totals.shipping)}`}
            </dd>
          </div>
          {totals.importFee > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-retail-muted">Import / Handling</dt>
              <dd className="font-semibold">SAR {money(totals.importFee)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-retail-muted">VAT (15%)</dt>
            <dd className="font-semibold">SAR {money(totals.vat)}</dd>
          </div>
          <div className="flex items-end justify-between gap-4 border-t border-retail-border pt-3">
            <dt className="font-display text-lg font-bold">Total</dt>
            <dd className="font-display text-xl font-bold text-retail-dark-green sm:text-2xl">
              SAR {money(totals.total)}
            </dd>
          </div>
        </dl>
        <Button
          type="button"
          size="lg"
          className="mt-4 h-12 w-full font-bold"
          onClick={onSubmit}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
          {submitting
            ? "Processing…"
            : payment === "card"
              ? "Continue to secure payment"
              : "Place order"}
        </Button>
        <p className="mt-3 text-center text-[11px] leading-4 text-retail-muted">
          Your details are used only to process and deliver this order.
        </p>
      </div>
    </aside>
  );
}
