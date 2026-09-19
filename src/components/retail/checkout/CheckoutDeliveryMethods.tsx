import { Loader2, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/lib/retailPricing";
import { CheckoutSection } from "./CheckoutSection";

export interface CheckoutCourierOption {
  deliveryOptionId: string | number;
  deliveryCompanyName?: string;
  price?: number;
  serviceType?: string;
  deliveryType?: string;
  maxDeliveryTime?: string;
}

export function CheckoutDeliveryMethods({
  city,
  options,
  selectedId,
  loading,
  fallbackPrice,
  onSelect,
}: {
  city: string;
  options: CheckoutCourierOption[];
  selectedId: string;
  loading: boolean;
  fallbackPrice: number;
  onSelect: (id: string) => void;
}) {
  const hasCity = city.trim().length >= 3;
  return (
    <CheckoutSection
      number={3}
      title="Delivery Method"
      description="Available options update automatically for your city."
      complete={hasCity && !loading}
    >
      {!hasCity ? (
        <div className="flex items-start gap-3 rounded-md bg-retail-light-green p-3 text-sm text-retail-dark-green">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Enter your city above to see available delivery options.</p>
        </div>
      ) : loading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-medium text-retail-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding available delivery options…
          </p>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : options.length === 0 ? (
        <div className="flex items-start gap-3 rounded-md border border-retail-border bg-retail-page p-3">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" />
          <div>
            <p className="text-sm font-semibold">Standard delivery</p>
            <p className="mt-0.5 text-xs text-retail-muted">
              No live courier option was returned for this city. The standard delivery charge is{" "}
              {fallbackPrice === 0 ? "Free" : `SAR ${money(fallbackPrice)}`}.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2" role="radiogroup" aria-label="Delivery method">
          {options.map((option) => {
            const id = String(option.deliveryOptionId);
            const selected = id === selectedId;
            const price = Number(option.price) || 0;
            return (
              <Button
                key={id}
                type="button"
                variant="outline"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(id)}
                className={`grid h-auto min-h-[68px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 whitespace-normal px-3 py-3 text-left ${selected ? "border-retail-green bg-retail-light-green text-retail-text" : "border-retail-border"}`}
              >
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? "border-retail-green bg-retail-green ring-2 ring-retail-green/15" : "border-retail-border"}`}
                />
                <span className="min-w-0">
                  <strong className="block truncate text-sm">
                    {option.deliveryCompanyName || "Courier delivery"}
                  </strong>
                  {option.maxDeliveryTime && (
                    <span className="mt-0.5 block text-xs font-normal text-retail-muted">
                      Estimated delivery: {option.maxDeliveryTime}
                    </span>
                  )}
                </span>
                <strong className="shrink-0 text-sm text-retail-dark-green">
                  {price === 0 ? "Free" : `SAR ${money(price)}`}
                </strong>
              </Button>
            );
          })}
        </div>
      )}
    </CheckoutSection>
  );
}
