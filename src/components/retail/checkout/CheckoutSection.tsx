import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckoutSection({
  number,
  title,
  description,
  complete = false,
  children,
  className,
}: {
  number: number;
  title: string;
  description?: string;
  complete?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-lg border border-retail-border bg-retail-card p-4 sm:p-5", className)}
      aria-labelledby={`checkout-section-${number}`}
    >
      <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-light-green text-xs font-bold text-retail-dark-green">
          {number}
        </span>
        <div className="min-w-0">
          <h2
            id={`checkout-section-${number}`}
            className="font-display text-base font-bold text-retail-text sm:text-lg"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-retail-muted sm:text-sm">{description}</p>
          )}
        </div>
        {complete && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-retail-green" aria-label="Complete" />
        )}
      </div>
      {children}
    </section>
  );
}
