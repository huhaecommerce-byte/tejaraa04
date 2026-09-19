import { createFileRoute } from "@tanstack/react-router";
import { SupplierShell } from "@/components/partners/SupplierShell";
import { ProductForm, emptyProduct } from "@/components/partners/ProductForm";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";

export const Route = createFileRoute("/partners/_auth/products/new")({
  head: () => ({
    meta: [
      { title: `Add Product — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Create a wholesale listing with SKU, brand, category, wholesale price, minimum order quantity, stock and warehouse." },
      { property: "og:title", content: `Add Product — ${brandConfig.name}` },
      { property: "og:description", content: "Add a wholesale listing and submit it for approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddProductPage,
});

export function warehouseNames(warehouses: unknown): string[] {
  if (!Array.isArray(warehouses)) return [];
  return warehouses
    .map((item) => {
      const w = item as { city?: string; emirate?: string; country?: string; name?: string; address?: string };
      return w?.name || [w?.city, w?.country].filter(Boolean).join(", ") || w?.address || "";
    })
    .filter((value): value is string => Boolean(value));
}

function AddProductPage() {
  const { userId, application, refresh, loading } = useSupplierWorkspace();
  const warehouses = warehouseNames(application?.warehouses);

  return (
    <SupplierShell title="Add Product" subtitle="Wholesale listings only — no consumer pricing. Submitted listings are reviewed before going live.">
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading your account…</p>
      ) : (
        <ProductForm
          initial={emptyProduct()}
          supplierId={userId}
          warehouses={warehouses}
          onSaved={refresh}
        />
      )}
    </SupplierShell>
  );
}
