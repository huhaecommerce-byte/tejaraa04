import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProductThumb } from "@/components/partners/ProductThumb";
import { GhostLink, Panel, PrimaryLink, SupplierShell, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/products/drafts")({
  head: () => ({
    meta: [
      { title: `Product Drafts — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Products you fetched or started but have not submitted for approval yet." },
      { property: "og:title", content: `Product Drafts — ${brandConfig.name}` },
      { property: "og:description", content: "Finish your saved product drafts and submit them for approval." },
      { property: "og:type", content: "website" },
      { name: "twitter", content: "summary_large_image" },
    ],
  }),
  component: DraftsPage,
});

function DraftsPage() {
  const { products, loading, refresh } = useSupplierWorkspace();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const drafts = products.filter((p) => p.status === "draft");

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete draft "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from("wl_products").delete().eq("id", id);
    setBusy(false);
    setMessage(error ? error.message : "Draft deleted.");
    if (!error) refresh();
  }

  return (
    <SupplierShell
      title="Product Drafts"
      subtitle="Listings you fetched or started but have not sent for approval yet. Open one, finish the details, and submit it."
      actions={
        <>
          <GhostLink to="/partners/products/import"><Link2 className="h-4 w-4" /> Import From Link</GhostLink>
          <PrimaryLink to="/partners/products/new">Add Product</PrimaryLink>
        </>
      }
    >
      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <Panel title={`${drafts.length} ${drafts.length === 1 ? "draft" : "drafts"}`}>
        <TableWrap>
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <Th>Product</Th><Th>SKU</Th><Th>Brand</Th><Th>Category</Th>
              <Th align="right">Wholesale</Th><Th>Warehouse</Th><Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <Td strong>
                  <span className="flex items-center gap-3">
                    <ProductThumb images={product.images} alt={product.name} className="h-11 w-11" />
                    <span className="max-w-[240px] truncate">{product.name}</span>
                  </span>
                </Td>
                <Td>{product.sku || "—"}</Td>
                <Td>{product.brand || "—"}</Td>
                <Td>{product.category || "—"}</Td>
                <Td align="right" strong>{product.currency} {Number(product.wholesale_price).toLocaleString()}</Td>
                <Td>{product.warehouse || "—"}</Td>
                <Td align="right">
                  <span className="inline-flex items-center gap-2">
                    <Link to="/partners/products/$id" params={{ id: product.id }} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                      <Pencil className="h-3.5 w-3.5" /> Finish &amp; submit
                    </Link>
                    <button type="button" onClick={() => void remove(product.id, product.name)} disabled={busy} aria-label={`Delete ${product.name}`} className="text-destructive disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </Td>
              </tr>
            ))}
            {drafts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  {loading ? "Loading your drafts…" : "No drafts yet. Fetch a product from a link and choose “Save as draft” to park it here."}
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <p className="text-[10px] text-muted-foreground">
        Drafts are only visible to you. When you open a draft and save it, it is submitted for admin approval automatically.
      </p>
    </SupplierShell>
  );
}
