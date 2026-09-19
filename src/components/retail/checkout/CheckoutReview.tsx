import { MapPin, Truck, WalletCards } from "lucide-react";
import { CheckoutSection } from "./CheckoutSection";

export function CheckoutReview({
  name,
  address,
  city,
  region,
  courierName,
  payment,
}: {
  name: string;
  address: string;
  city: string;
  region: string;
  courierName?: string;
  payment: "cod" | "card";
}) {
  const destination = [address, city, region].filter(Boolean).join(", ");
  const rows = [
    {
      icon: MapPin,
      label: "Deliver to",
      value: destination
        ? `${name ? `${name} — ` : ""}${destination}`
        : "Complete your shipping address",
    },
    {
      icon: Truck,
      label: "Delivery",
      value:
        courierName ||
        (city.trim().length >= 3 ? "Standard delivery" : "Add your city to confirm delivery"),
    },
    {
      icon: WalletCards,
      label: "Payment",
      value: payment === "card" ? "Card payment" : "Cash on delivery",
    },
  ];
  return (
    <CheckoutSection
      number={5}
      title="Review"
      description="Check your delivery and payment details before placing the order."
      complete={Boolean(destination)}
    >
      <dl className="divide-y divide-retail-border rounded-md border border-retail-border">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-3">
            <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-retail-muted">{row.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-retail-text">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </CheckoutSection>
  );
}
