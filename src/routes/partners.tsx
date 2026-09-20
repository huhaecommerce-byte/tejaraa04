import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useLocale } from "@/i18n/LocaleProvider";
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
  const { t } = useLocale();
  return (
    <SupplierPublicShell>
      <SupplierContainer className="py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">{t('supplier.notFound.eyebrow')}</p>
        <h1 className="mt-3 text-3xl font-extrabold text-retail-dark-green sm:text-4xl">
          {t('supplier.notFound.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-retail-muted">
          {t('supplier.notFound.text')}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-retail-green font-semibold text-white hover:bg-retail-dark-green">
            <Link to={supplierApplyPath}>{t('supplier.pages.becomeSupplier')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-retail-border font-semibold text-retail-dark-green">
            <Link to="/partners">{t('supplier.notFound.suppliersHome')}</Link>
          </Button>
        </div>
      </SupplierContainer>
    </SupplierPublicShell>
  );
}
