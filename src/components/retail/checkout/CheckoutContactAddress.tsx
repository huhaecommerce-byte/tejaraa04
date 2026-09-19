import type { ChangeEvent } from "react";
import { Building2, UserRound } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckoutSection } from "./CheckoutSection";

export interface CheckoutFormValue {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  notes: string;
}
export type CheckoutField = keyof CheckoutFormValue;

export function CheckoutContactAddress({
  form,
  buyerType,
  attempted,
  onBuyerTypeChange,
  onChange,
}: {
  form: CheckoutFormValue;
  buyerType: "retail" | "business";
  attempted: boolean;
  onBuyerTypeChange: (value: "retail" | "business") => void;
  onChange: (
    field: CheckoutField,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const { t } = useLocale();
  const requiredFields: Array<{
    key: CheckoutField;
    label: string;
    type?: string;
    placeholder: string;
    autoComplete: string;
  }> = [
    { key: "name", label: t("shopx.checkout.fullName"), placeholder: t("shopx.checkout.fullNamePlaceholder"), autoComplete: "name" },
    {
      key: "phone",
      label: t("shopx.checkout.mobileNumber"),
      type: "tel",
      placeholder: "05XXXXXXXX",
      autoComplete: "tel",
    },
    {
      key: "email",
      label: t("shopx.checkout.email"),
      type: "email",
      placeholder: "you@example.com",
      autoComplete: "email",
    },
  ];
  const error = (field: CheckoutField) => attempted && !form[field].trim();
  const inputProps = (field: CheckoutField) => ({
    "aria-invalid": error(field),
    "aria-describedby": error(field) ? `${field}-error` : undefined,
  });
  const contactComplete = Boolean(form.name && form.phone && form.email);
  const addressComplete = Boolean(form.address && form.city);

  return (
    <>
      <CheckoutSection
        number={1}
        title={t("shopx.checkout.contactTitle")}
        description={t("shopx.checkout.contactDescription")}
        complete={contactComplete}
      >
        <div className="mb-4">
          <Label className="mb-2 block">{t("shopx.checkout.buyingAs")}</Label>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("shopx.checkout.buyerTypeAria")}>
            <Button
              type="button"
              variant="outline"
              role="radio"
              aria-checked={buyerType === "retail"}
              onClick={() => onBuyerTypeChange("retail")}
              className={`h-auto min-h-14 justify-start gap-3 whitespace-normal px-3 py-2 text-left ${buyerType === "retail" ? "border-retail-green bg-retail-light-green text-retail-dark-green" : "border-retail-border"}`}
            >
              <UserRound className="h-4 w-4" />
              <span>
                <strong className="block text-sm">{t("shopx.checkout.individual")}</strong>
                <span className="block text-xs font-normal text-retail-muted">
                  {t("shopx.checkout.personalPurchase")}
                </span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              role="radio"
              aria-checked={buyerType === "business"}
              onClick={() => onBuyerTypeChange("business")}
              className={`h-auto min-h-14 justify-start gap-3 whitespace-normal px-3 py-2 text-left ${buyerType === "business" ? "border-retail-green bg-retail-light-green text-retail-dark-green" : "border-retail-border"}`}
            >
              <Building2 className="h-4 w-4" />
              <span>
                <strong className="block text-sm">{t("shopx.checkout.business")}</strong>
                <span className="block text-xs font-normal text-retail-muted">
                  {t("shopx.checkout.businessBulk")}
                </span>
              </span>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {requiredFields.map((field, index) => (
            <div key={field.key} className={index === 2 ? "sm:col-span-2" : undefined}>
              <Label htmlFor={`co-${field.key}`}>
                {field.label}{" "}
                <span aria-hidden="true" className="text-retail-sale">
                  *
                </span>
              </Label>
              <Input
                id={`co-${field.key}`}
                type={field.type}
                value={form[field.key]}
                onChange={onChange(field.key)}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                className="mt-1.5 h-11"
                {...inputProps(field.key)}
              />
              {error(field.key) && (
                <p id={`${field.key}-error`} className="mt-1 text-xs text-retail-sale">
                  {t("shopx.checkout.pleaseEnterField", { field: field.label.toLowerCase() })}
                </p>
              )}
            </div>
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection
        number={2}
        title={t("shopx.checkout.shippingAddressTitle")}
        description={t("shopx.checkout.shippingAddressDescription")}
        complete={addressComplete}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="co-address">
              {t("shopx.checkout.streetAddress")}{" "}
              <span aria-hidden="true" className="text-retail-sale">
                *
              </span>
            </Label>
            <Input
              id="co-address"
              value={form.address}
              onChange={onChange("address")}
              placeholder={t("shopx.checkout.streetAddressPlaceholder")}
              autoComplete="street-address"
              className="mt-1.5 h-11"
              {...inputProps("address")}
            />
            {error("address") && (
              <p id="address-error" className="mt-1 text-xs text-retail-sale">
                {t("shopx.checkout.pleaseEnterAddress")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="co-city">
              {t("shopx.checkout.city")}{" "}
              <span aria-hidden="true" className="text-retail-sale">
                *
              </span>
            </Label>
            <Input
              id="co-city"
              value={form.city}
              onChange={onChange("city")}
              placeholder={t("shopx.checkout.cityPlaceholder")}
              autoComplete="address-level2"
              className="mt-1.5 h-11"
              {...inputProps("city")}
            />
            {error("city") && (
              <p id="city-error" className="mt-1 text-xs text-retail-sale">
                {t("shopx.checkout.pleaseEnterCity")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="co-region">
              {t("shopx.checkout.region")} <span className="text-xs font-normal text-retail-muted">{t("shopx.checkout.optional")}</span>
            </Label>
            <Input
              id="co-region"
              value={form.region}
              onChange={onChange("region")}
              autoComplete="address-level1"
              className="mt-1.5 h-11"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="co-notes">
              {t("shopx.checkout.orderNotes")} <span className="text-xs font-normal text-retail-muted">{t("shopx.checkout.optional")}</span>
            </Label>
            <Textarea
              id="co-notes"
              value={form.notes}
              onChange={onChange("notes")}
              rows={3}
              className="mt-1.5"
              placeholder={t("shopx.checkout.orderNotesPlaceholder")}
            />
          </div>
        </div>
      </CheckoutSection>
    </>
  );
}
