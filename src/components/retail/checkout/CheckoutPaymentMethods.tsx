import { Banknote, CreditCard } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { CheckoutSection } from "./CheckoutSection";

export function CheckoutPaymentMethods({
  value,
  onChange,
}: {
  value: "cod" | "card";
  onChange: (value: "cod" | "card") => void;
}) {
  const { t } = useLocale();
  const methods = [
    {
      id: "cod" as const,
      title: t("shopx.checkout.cod"),
      description: t("shopx.checkout.codDescription"),
      icon: Banknote,
    },
    {
      id: "card" as const,
      title: t("shopx.checkout.card"),
      description: t("shopx.checkout.cardDescription"),
      icon: CreditCard,
    },
  ];
  return (
    <CheckoutSection
      number={4}
      title={t("shopx.checkout.paymentMethodTitle")}
      description={t("shopx.checkout.paymentMethodDescription")}
      complete
    >
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("shopx.checkout.paymentMethodAria")}>
        {methods.map((method) => {
          const selected = value === method.id;
          return (
            <Button
              key={method.id}
              type="button"
              variant="outline"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(method.id)}
              className={`grid h-auto min-h-[76px] grid-cols-[auto_minmax(0,1fr)] items-start gap-3 whitespace-normal px-3 py-3 text-left ${selected ? "border-retail-green bg-retail-light-green text-retail-text" : "border-retail-border"}`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${selected ? "bg-retail-green text-primary-foreground" : "bg-retail-page text-retail-dark-green"}`}
              >
                <method.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm">{method.title}</strong>
                <span className="mt-1 block text-xs font-normal text-retail-muted">
                  {method.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </CheckoutSection>
  );
}
