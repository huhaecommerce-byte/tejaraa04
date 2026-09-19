import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { SupplierPublicShell } from "@/components/supplier/shell/SupplierPublicShell";
import { SupplierContainer } from "@/components/supplier/common/SupplierContainer";
import { supplierApplyPath } from "@/data/supplierPartners";

export const Route = createFileRoute("/partners")({
  component: () => (
    <div className="wl-theme">
      <Outlet />
    </div>
  ),
  notFoundComponent: SupplierNotFound,
});

/** Supplier-styled 404 for unmatched /partners/* addresses. */
function SupplierNotFound() {
  return (
    <SupplierPublicShell>
      <SupplierContainer className="py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">Page not found</p>
        <h1 className="mt-3 text-3xl font-extrabold text-retail-dark-green sm:text-4xl">
          We couldn&apos;t find that supplier page
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-retail-muted">
          The page may have moved. Start from the Suppliers home page, or go straight to the supplier application.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-retail-green font-semibold text-white hover:bg-retail-dark-green">
            <Link to={supplierApplyPath}>Become a Supplier</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-retail-border font-semibold text-retail-dark-green">
            <Link to="/partners">Suppliers home</Link>
          </Button>
        </div>
      </SupplierContainer>
    </SupplierPublicShell>
  );
}
