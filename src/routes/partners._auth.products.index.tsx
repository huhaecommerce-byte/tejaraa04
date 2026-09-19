import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProductThumb } from "@/components/partners/ProductThumb";
import { GhostLink, Panel, PrimaryLink, StatusPill, SupplierShell, Tabs, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/products/")({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search["q"] === "string" ? (search["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: `Product Listings — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Review, filter and publish your wholesale product listings with SKU, brand, MOQ, stock and approval status in one table." },
      { property: "og:title", content: `Product Listings — ${brandConfig.name}` },
      { property: "og:description", content: "Manage your wholesale catalog across every GCC sales channel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

const statusLabel: Record<string, string> = {
  active: "Approved",
  pending: "Pending Approval",
  rejected: "Rejected",
  draft: "Pending Approval",
  out_of_stock: "Approved",
};

const statusTone: Record<string, string> = {
  active: "positive",
  pending: "warning",
  rejected: "danger",
  draft: "neutral",
  out_of_stock: "danger",
};

const tabs = ["All Products", "Approved", "Pending Approval", "Rejected"] as const;

function ProductsPage() {
  const [tab, setTab] = useState<string>("All Products");
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { products, loading, userId, currency, refresh } = useSupplierWorkspace();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const search = q.trim().toLowerCase();
  const rows = products
    .filter((p) => p.status !== "draft")
    .filter((p) => (tab === "All Products" ? true : statusLabel[p.status] === tab))
    .filter((p) => !search || `${p.name} ${p.sku} ${p.brand} ${p.category}`.toLowerCase().includes(search));

  async function toggleActive(id: string, next: boolean, status: string) {
    if (status !== "active") {
      setMessage("This listing can only be switched on once it has been approved.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("wl_products").update({ is_active: next }).eq("id", id);
    setBusy(false);
    setMessage(error ? error.message : next ? "Product enabled." : "Product disabled — buyers can no longer see it.");
    if (!error) refresh();
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from("wl_products").delete().eq("id", id);
    setBusy(false);
    setMessage(error ? error.message : "Product deleted.");
    if (!error) refresh();
  }

  return (
    <SupplierShell
      title="Products"
      subtitle="Your wholesale catalog across every sales channel. No consumer pricing — buyers see wholesale terms only."
      actions={
        <>
          <GhostLink to="/partners/products/import"><Link2 className="h-4 w-4" /> Import From Link</GhostLink>
          <PrimaryLink to="/partners/products/new"><Plus className="h-4 w-4" /> Add Product</PrimaryLink>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs items={tabs} value={tab} onChange={setTab} />
        {search && (
          <button type="button" onClick={() => navigate({ to: "/partners/products", search: { q: "" } })} className="text-[11px] font-bold text-primary">
            Clear search “{q}”
          </button>
        )}
      </div>

      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <Panel title={`${rows.length} ${rows.length === 1 ? "listing" : "listings"}`} action={<span className="text-[11px] font-semibold text-muted-foreground">{tab}</span>}>
        <TableWrap>
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <Th>Product</Th><Th>SKU</Th><Th>Brand</Th><Th>Category</Th>
              <Th align="right">Wholesale</Th><Th align="right">MOQ</Th><Th align="right">Stock</Th>
              <Th>Warehouse</Th><Th>Status</Th><Th>Live</Th><Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <Td strong>
                  <span className="flex items-center gap-3">
                    <ProductThumb images={product.images} alt={product.name} className="h-11 w-11" />
                    <span className="max-w-[220px] truncate">{product.name}</span>
                  </span>
                </Td>
                <Td>{product.sku || "—"}</Td>
                <Td>{product.brand || "—"}</Td>
                <Td>{product.category || "—"}</Td>
                <Td align="right" strong>{product.currency} {Number(product.wholesale_price).toLocaleString()}</Td>
                <Td align="right">{product.moq}</Td>
                <Td align="right" strong>{product.stock.toLocaleString()}</Td>
                <Td>{product.warehouse || "—"}</Td>
                <Td><StatusPill label={statusLabel[product.status] ?? product.status} tone={statusTone[product.status] ?? "neutral"} /></Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy || product.status !== "active"}
                      title={product.status === "active" ? undefined : "Available after approval"}
                      onClick={() => void toggleActive(product.id, !product.is_active, product.status)}
                      aria-pressed={product.is_active && product.status === "active"}
                      aria-label={`${product.is_active ? "Disable" : "Enable"} ${product.name}`}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${product.is_active && product.status === "active" ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${product.is_active && product.status === "active" ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    {product.status !== "active" && <span className="text-[10px] text-muted-foreground">After approval</span>}
                  </span>
                </Td>
                <Td align="right">
                  <span className="inline-flex items-center gap-2">
                    <Link to="/partners/products/$id" params={{ id: product.id }} className="text-[11px] font-bold text-primary">Edit</Link>
                    <button type="button" onClick={() => remove(product.id, product.name)} disabled={busy} aria-label={`Delete ${product.name}`} className="text-destructive disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-xs text-muted-foreground">{loading ? "Loading your catalog…" : "No listings in this view yet."}</td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <p className="text-[10px] text-muted-foreground">
        New products and every edit are submitted for approval automatically. Use the Live switch to enable or disable an approved listing.
      </p>

      <p className="text-[10px] text-muted-foreground">
        Bulk upload accepts a CSV with a header row: name, sku, brand, category, wholesale_price, currency, moq, stock, warehouse. Name, SKU and a price above zero are required, and each SKU must be new for your account — any row that fails is skipped and listed for you.
      </p>
    </SupplierShell>
  );
}
