import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Cart", "Address", "Delivery", "Payment", "Review"];

export function CheckoutProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav
      aria-label="Checkout progress"
      className="overflow-hidden rounded-lg border border-retail-border bg-retail-card px-3 py-4 sm:px-6"
    >
      <ol className="grid grid-cols-5">
        {steps.map((step, index) => {
          const completed = index < currentStep;
          const current = index === currentStep;
          return (
            <li
              key={step}
              className="relative flex min-w-0 flex-col items-center gap-1.5 text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1/2 top-3 h-px w-full",
                    index <= currentStep ? "bg-retail-green" : "bg-retail-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                  completed && "border-retail-green bg-retail-green text-primary-foreground",
                  current &&
                    "border-retail-green bg-retail-light-green text-retail-dark-green ring-2 ring-retail-green/20",
                  !completed && !current && "border-retail-border bg-retail-card text-retail-muted",
                )}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-[10px] font-semibold sm:text-xs",
                  current
                    ? "text-retail-dark-green"
                    : completed
                      ? "text-retail-green"
                      : "text-retail-muted",
                )}
                aria-current={current ? "step" : undefined}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
