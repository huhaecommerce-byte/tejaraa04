export function CartSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading cart" role="status">
      <div className="h-8 w-52 rounded bg-retail-border" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-lg border border-retail-border bg-retail-card" />)}
        </div>
        <div className="h-80 rounded-lg border border-retail-border bg-retail-card" />
      </div>
      <span className="sr-only">Loading your cart</span>
    </div>
  );
}