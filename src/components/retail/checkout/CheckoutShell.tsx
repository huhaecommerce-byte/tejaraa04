import type { ReactNode } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";
import { RetailContainer } from "@/components/retail/common/RetailContainer";

export function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="checkout-shell retail-theme flex min-h-screen flex-col bg-retail-page text-retail-text">
      <header className="sticky top-0 z-40 border-b border-retail-border bg-retail-card/95 backdrop-blur">
        <RetailContainer className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:h-[72px]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              aria-label="Back to cart"
            >
              <Link to="/cart">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link to="/" aria-label="Tejaraa Shop home" className="min-w-0 shrink-0">
              <BrandLogo variant="storefront" className="max-w-[120px] sm:max-w-[140px]" />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-retail-dark-green sm:text-sm">
            <LockKeyhole className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
        </RetailContainer>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-8 border-t border-retail-border bg-retail-card">
        <RetailContainer className="flex min-h-16 flex-col items-center justify-between gap-2 py-4 text-xs text-retail-muted sm:flex-row">
          <p>© Tejaraa</p>
          <Link
            to="/contact"
            className="font-semibold text-retail-dark-green hover:text-retail-green"
          >
            Need help? Contact us
          </Link>
        </RetailContainer>
      </footer>
    </div>
  );
}
