import type { ChangeEvent } from "react";
import { Building2, UserRound } from "lucide-react";
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

const requiredFields: Array<{
  key: CheckoutField;
  label: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
}> = [
  { key: "name", label: "Full name", placeholder: "Your full name", autoComplete: "name" },
  {
    key: "phone",
    label: "Mobile number",
    type: "tel",
    placeholder: "05XXXXXXXX",
    autoComplete: "tel",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    autoComplete: "email",
  },
];

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
        title="Contact Information"
        description="We’ll use these details for order and delivery updates."
        complete={contactComplete}
      >
        <div className="mb-4">
          <Label className="mb-2 block">I am buying as</Label>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Buyer type">
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
                <strong className="block text-sm">Individual</strong>
                <span className="block text-xs font-normal text-retail-muted">
                  Personal purchase
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
                <strong className="block text-sm">Business</strong>
                <span className="block text-xs font-normal text-retail-muted">
                  Business or bulk order
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
                  Please enter your {field.label.toLowerCase()}.
                </p>
              )}
            </div>
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection
        number={2}
        title="Shipping Address"
        description="Enter the address where you want your order delivered."
        complete={addressComplete}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="co-address">
              Street address{" "}
              <span aria-hidden="true" className="text-retail-sale">
                *
              </span>
            </Label>
            <Input
              id="co-address"
              value={form.address}
              onChange={onChange("address")}
              placeholder="Street, building, district"
              autoComplete="street-address"
              className="mt-1.5 h-11"
              {...inputProps("address")}
            />
            {error("address") && (
              <p id="address-error" className="mt-1 text-xs text-retail-sale">
                Please enter your delivery address.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="co-city">
              City{" "}
              <span aria-hidden="true" className="text-retail-sale">
                *
              </span>
            </Label>
            <Input
              id="co-city"
              value={form.city}
              onChange={onChange("city")}
              placeholder="Riyadh"
              autoComplete="address-level2"
              className="mt-1.5 h-11"
              {...inputProps("city")}
            />
            {error("city") && (
              <p id="city-error" className="mt-1 text-xs text-retail-sale">
                Please enter your city.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="co-region">
              Region <span className="text-xs font-normal text-retail-muted">(optional)</span>
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
              Order notes <span className="text-xs font-normal text-retail-muted">(optional)</span>
            </Label>
            <Textarea
              id="co-notes"
              value={form.notes}
              onChange={onChange("notes")}
              rows={3}
              className="mt-1.5"
              placeholder="Delivery notes or other information"
            />
          </div>
        </div>
      </CheckoutSection>
    </>
  );
}
