import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutShell } from "./CheckoutShell";
import { RetailContainer } from "@/components/retail/common/RetailContainer";

export function CheckoutSkeleton() {
  return (
    <CheckoutShell>
      <main>
        <RetailContainer className="max-w-[1320px] py-5 sm:py-8">
          <Skeleton className="h-16 w-full" />
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="space-y-4">
              {[220, 260, 150, 150].map((height, index) => (
                <Skeleton key={index} className="w-full" style={{ height }} />
              ))}
            </div>
            <Skeleton className="h-[520px] w-full" />
          </div>
        </RetailContainer>
      </main>
    </CheckoutShell>
  );
}
