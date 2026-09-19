import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatusPill, TableWrap, Tabs, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { ProductThumb } from "@/components/partners/ProductThumb";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/admin/products/")({
  validateSearch: (search: Record<string, unknown>): { supplier?: string | undefined } => ({
    supplier: typeof search["supplier"] === "string" && search["supplier"] ? (search["supplier"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Product Moderation | ${brandConfig.name}` },
      { name: "description", content: "Moderate wholesale listings: approve, reject and monitor products submitted by verified wholesalers." },
      { property: "og:title", content: `Product Moderation | ${brandConfig.name}` },
      { property: "og:description", content: "Approve or reject wholesale product listings before they reach buyers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

const tabs = ["Pending", "Rejected", "All"] as const;
const statusTone: Record<string, string> = { pending: "warning", active: "positive", rejected: "danger", draft: "neutral", out_of_stock: "warning" };

function ProductsPage() {
  const { supplier } = Route.useSearch();
  const [tab, setTab] = useState<string>(supplier ? "All" : "Pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const [products, applications] = await Promise.all([
        supabase.from("wl_products").select("*").order("created_at", { ascending: false }),
        supabase.from("wl_applications").select("user_id, business_name"),
      ]);
      if (products.error) throw products.error;
      return {
        products: products.data ?? [],
        supplierNames: new Map((applications.data ?? []).map((row) => [row.user_id, row.business_name || "Wholesaler"])),
      };
    },
  });

  const supplierProducts = supplier ? (data?.products ?? []).filter((row) => row.supplier_id === supplier) : (data?.products ?? []);
  const rows = supplierProducts.filter((row) => tab === "All" || row.status === tab.toLowerCase());
  const supplierName = supplier ? (data?.supplierNames.get(supplier) ?? "this wholesaler") : null;

  return (
    <AdminShell
      title="Product approvals"
      subtitle="Listings waiting for review, plus everything you have rejected. Approved listings live under Live Products."
      actions={<Tabs items={tabs} value={tab} onChange={setTab} />}

    >
      {supplier && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-accent px-4 py-3">
          <span className="text-xs font-semibold text-foreground">
            Showing listings from <span className="font-bold text-primary">{supplierName}</span> only
          </span>
          <Link
            to="/partners/admin/products"
            search={{}}
            className="ml-auto inline-flex h-8 items-center rounded-xl border border-border bg-background px-3 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Clear filter
          </Link>
        </div>
      )}
      <Panel title={`${rows.length} ${tab.toLowerCase()} listings${supplier ? ` · ${supplierName}` : ""}`}>
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Product</Th><Th>Category</Th><Th align="right">Price</Th><Th align="right">Stock</Th><Th>Status</Th><Th align="right">Action</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2.5">
                  <Link to="/partners/admin/products/$id" params={{ id: row.id }} className="flex items-center gap-2.5 text-xs font-bold text-foreground hover:text-primary">
                    <ProductThumb images={row.images} alt={row.name} />
                    <span>{row.name}<span className="block text-[10px] font-normal text-muted-foreground">{row.sku || "No SKU"} · {row.brand || "No brand"}</span></span>
                  </Link>
                </td>
                <Td>{row.category || "—"}</Td>
                <Td align="right">{row.currency} {Number(row.wholesale_price).toLocaleString()}</Td>
                <Td align="right" strong>{row.stock}</Td>
                <td className="px-3 py-2.5"><StatusPill label={row.status.replace("_", " ")} tone={statusTone[row.status] ?? "neutral"} /></td>
                <td className="px-3 py-2.5 text-right">
                  <Link to="/partners/admin/products/$id" params={{ id: row.id }} className="inline-flex rounded-lg border border-border px-3 py-1 text-[10px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary">Review</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><Td>{isLoading ? "Loading…" : "No listings in this view yet."}</Td><Td>—</Td><Td align="right">—</Td><Td align="right">—</Td><Td align="right">0</Td><Td>—</Td><Td align="right">—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </AdminShell>
  );
}
