import { MapPin, Truck, WalletCards } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
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
  const { t } = useLocale();
  const destination = [address, city, region].filter(Boolean).join(", ");
  const rows = [
    {
      icon: MapPin,
      label: t("shopx.checkout.deliverTo"),
      value: destination
        ? `${name ? `${name} — ` : ""}${destination}`
        : t("shopx.checkout.completeAddress"),
    },
    {
      icon: Truck,
      label: t("shopx.checkout.deliveryRow"),
      value:
        courierName ||
        (city.trim().length >= 3 ? t("shopx.checkout.standardDeliveryTitle") : t("shopx.checkout.addCityToConfirm")),
    },
    {
      icon: WalletCards,
      label: t("shopx.checkout.paymentRow"),
      value: payment === "card" ? t("shopx.checkout.card") : t("shopx.checkout.cod"),
    },
  ];
  return (
    <CheckoutSection
      number={5}
      title={t("shopx.checkout.reviewTitle")}
      description={t("shopx.checkout.reviewDescription")}
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
