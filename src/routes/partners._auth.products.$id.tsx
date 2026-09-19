import { createFileRoute, Link } from "@tanstack/react-router";
import { SupplierShell } from "@/components/partners/SupplierShell";
import { ProductForm, toFormValues } from "@/components/partners/ProductForm";
import { warehouseNames } from "@/routes/partners._auth.products.new";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";

export const Route = createFileRoute("/partners/_auth/products/$id")({
  head: () => ({
    meta: [
      { title: `Edit Product — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Update wholesale price, stock, minimum order quantity and warehouse for one of your listings." },
      { property: "og:title", content: `Edit Product — ${brandConfig.name}` },
      { property: "og:description", content: "Update a wholesale listing in your catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { products, application, userId, refresh, loading } = useSupplierWorkspace();
  const product = products.find((p) => p.id === id);
  const warehouses = warehouseNames(application?.warehouses);

  return (
    <SupplierShell title="Edit Product" subtitle={product ? product.name : "Update your wholesale listing."}>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading listing…</p>
      ) : !product ? (
        <p className="rounded-card border border-border bg-card px-3 py-6 text-center text-xs text-muted-foreground">
          This listing was not found in your catalog.{" "}
          <Link to="/partners/products" search={{ q: "" }} className="font-bold text-primary">Back to products</Link>
        </p>
      ) : (
        <ProductForm
          initial={toFormValues(product)}
          productId={product.id}
          supplierId={userId}
          warehouses={warehouses}
          onSaved={refresh}
          allowDraft={product.status === "draft"}
        />
      )}
    </SupplierShell>
  );
}
