import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatusPill, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { ProductThumb } from "@/components/partners/ProductThumb";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/partners/admin/live-products")({
  validateSearch: (search: Record<string, unknown>): { supplier?: string | undefined } => ({
    supplier: typeof search["supplier"] === "string" && search["supplier"] ? (search["supplier"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Live Products | ${brandConfig.name}` },
      { name: "description", content: "Every approved and live wholesale listing across all wholesalers, with stock, price and supplier details." },
      { property: "og:title", content: `Live Products | ${brandConfig.name}` },
      { property: "og:description", content: "Browse all live wholesale listings distributed across channels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveProductsPage,
});

function LiveProductsPage() {
  const [search, setSearch] = useState("");
  const { supplier } = Route.useSearch();

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "live-products"],
    queryFn: async () => {
      const [products, applications, profiles, mirrored] = await Promise.all([
        supabase.from("wl_products").select("*").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("wl_applications").select("user_id, business_name"),
        supabase.from("wl_partner_profiles").select("id, first_name, last_name, email"),
        supabase.from("products").select("id, wl_product_id, price_sar").not("wl_product_id", "is", null),
      ]);
      return {
        products: products.data ?? [],
        applications: applications.data ?? [],
        profiles: profiles.data ?? [],
        mirrored: mirrored.data ?? [],
      };
    },
  });

  const resync = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.rpc("wl_resync_catalog");
      if (error) throw error;
      return result as { synced?: number; skipped?: number } | null;
    },
    onSuccess: (result) => {
      toast.success(`${result?.synced ?? 0} listings live on the storefront, ${result?.skipped ?? 0} not eligible.`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "live-products"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not resync the catalogue."),
  });

  const rows = (data?.products ?? []).map((product) => {
    const application = data?.applications.find((item) => item.user_id === product.supplier_id);
    const profile = data?.profiles.find((item) => item.id === product.supplier_id);
    const mirror = data?.mirrored.find((item) => item.wl_product_id === product.id);
    return {
      ...product,
      shopProductId: mirror?.id ?? null,
      shopPrice: mirror?.price_sar ?? null,
      supplierName:
        application?.business_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || profile?.email || "Unknown wholesaler",
    };
  });


  const scoped = supplier ? rows.filter((row) => row.supplier_id === supplier) : rows;
  const supplierName = supplier ? (rows.find((row) => row.supplier_id === supplier)?.supplierName ?? "this wholesaler") : null;

  const term = search.trim().toLowerCase();
  const filtered = term
    ? scoped.filter((row) =>
        [row.name, row.sku, row.brand, row.category, row.supplierName].some((value) => (value ?? "").toLowerCase().includes(term)),
      )
    : scoped;

  const enabled = filtered.filter((row) => row.is_active).length;
  const onStorefront = filtered.filter((row) => row.shopProductId).length;

  return (
    <AdminShell
      title="Live products"
      subtitle="Every approved listing across all wholesalers, automatically published to the dropshipping catalogue and the shop storefront."
      actions={
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, SKU, brand or wholesaler"
            className="h-9 w-72 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="button"
            onClick={() => resync.mutate()}
            disabled={resync.isPending}
            className="h-9 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {resync.isPending ? "Resyncing…" : "Resync storefront"}
          </button>
        </div>
      }
    >
      {supplier && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-xs">
          <span className="font-semibold text-foreground">Showing live listings from {supplierName} only</span>
          <Link to="/partners/admin/live-products" search={{}} className="font-bold text-primary hover:underline">Clear filter</Link>
        </div>
      )}
      <Panel title={`${filtered.length} live listings${supplierName ? ` · ${supplierName}` : ""} · ${enabled} enabled by wholesaler · ${onStorefront} published to the storefront`}>
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Product</Th><Th>Wholesaler</Th><Th>Category</Th><Th align="right">Price</Th><Th align="right">Stock</Th><Th>Visibility</Th><Th>Storefront</Th><Th align="right">Action</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2.5">
                  <Link to="/partners/admin/products/$id" params={{ id: row.id }} className="flex items-center gap-2.5 text-xs font-bold text-foreground hover:text-primary">
                    <ProductThumb images={row.images} alt={row.name} />
                    <span>{row.name}<span className="block text-[10px] font-normal text-muted-foreground">{row.sku || "No SKU"} · {row.brand || "No brand"}</span></span>
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <Link to="/partners/admin/suppliers/$id" params={{ id: row.supplier_id }} className="text-xs font-bold text-foreground hover:text-primary">
                    {row.supplierName}
                  </Link>
                </td>
                <Td>{row.category || "—"}</Td>
                <Td align="right">{row.currency} {Number(row.wholesale_price).toLocaleString()}</Td>
                <Td align="right" strong>{row.stock}</Td>
                <td className="px-3 py-2.5">
                  <StatusPill label={row.is_active ? "Live" : "Disabled by wholesaler"} tone={row.is_active ? "positive" : "neutral"} />
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill
                    label={row.shopProductId ? `Published · SAR ${Number(row.shopPrice ?? 0).toLocaleString()}` : "Not published"}
                    tone={row.shopProductId ? "positive" : "neutral"}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link to="/partners/admin/products/$id" params={{ id: row.id }} className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-bold text-foreground hover:border-primary hover:text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><Td>{isLoading ? "Loading…" : "No live listings yet."}</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td><Td align="right">—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </AdminShell>
  );

}
