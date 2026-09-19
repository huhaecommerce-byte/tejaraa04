import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatusPill, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";
import { deleteSupplierAccount } from "@/lib/partners/admin-suppliers.functions";

export const Route = createFileRoute("/partners/admin/suppliers/")({
  head: () => ({
    meta: [
      { title: `Wholesalers | ${brandConfig.name}` },
      { name: "description", content: "Every registered wholesaler on the platform with verification status, location and listing activity." },
      { property: "og:title", content: `Wholesalers | ${brandConfig.name}` },
      { property: "og:description", content: "Directory of registered wholesalers and their verification status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuppliersPage,
});

const statusTone: Record<string, string> = { pending: "warning", approved: "positive", rejected: "danger" };

function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const removeSupplier = useServerFn(deleteSupplierAccount);

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name}? This permanently deletes their account, products and application.`)) return;
    setRemovingId(id);
    try {
      await removeSupplier({ data: { supplierId: id } });
      toast.success(`${name} has been removed`);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this wholesaler");
    } finally {
      setRemovingId(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: async () => {
      const [profiles, applications, products] = await Promise.all([
        supabase.from("wl_partner_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("wl_applications").select("user_id, status, business_name, country"),
        supabase.from("wl_products").select("id, supplier_id"),
      ]);
      return {
        profiles: profiles.data ?? [],
        applications: applications.data ?? [],
        products: products.data ?? [],
      };
    },
  });

  const term = search.trim().toLowerCase();
  const rows = (data?.profiles ?? [])
    .map((profile) => {
      const application = data?.applications.find((item) => item.user_id === profile.id);
      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim() || "Unnamed account",
        email: profile.email,
        business: application?.business_name || "—",
        country: application?.country || profile.country || "—",
        status: application?.status ?? "not submitted",
        products: (data?.products ?? []).filter((item) => item.supplier_id === profile.id).length,
        joined: profile.created_at,
      };
    })
    .filter((row) => row.status === "approved")
    .filter((row) =>
      term
        ? [row.name, row.email, row.business, row.country].some((value) => (value ?? "").toLowerCase().includes(term))
        : true,
    );

  return (
    <AdminShell
      title="Wholesalers"
      subtitle="Approved businesses on the platform, with their full profile, documents and activity."
      actions={
        <label className="inline-flex h-11 w-full items-center gap-2 rounded-xl border border-border bg-background px-3 sm:h-9 sm:w-auto">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search wholesalers"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none sm:w-44 sm:text-xs"
          />
        </label>
      }
    >
      <Panel title={`${rows.length} approved wholesalers`}>
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Account</Th><Th>Business</Th><Th>Country</Th><Th align="right">Products</Th><Th>Joined</Th><Th>Verification</Th><Th align="right">Details</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <Td strong>{row.name}<span className="block text-[10px] font-normal text-muted-foreground">{row.email}</span></Td>
                <Td>{row.business}</Td>
                <Td>{row.country}</Td>
                <Td align="right" strong>{row.products}</Td>
                <Td>{new Date(row.joined).toLocaleDateString()}</Td>
                <td className="px-3 py-2.5"><StatusPill label={row.status} tone={statusTone[row.status] ?? "neutral"} /></td>
                <td className="px-3 py-2.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      to="/partners/admin/suppliers/$id"
                      params={{ id: row.id }}
                      className="inline-flex h-8 items-center rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      disabled={removingId === row.id}
                      onClick={() => handleRemove(row.id, row.business !== "—" ? row.business : row.name)}
                      className="inline-flex h-8 items-center gap-1 rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-destructive transition-colors hover:border-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {removingId === row.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><Td>{isLoading ? "Loading…" : "No approved wholesalers match this view."}</Td><Td>—</Td><Td>—</Td><Td align="right">0</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td></tr>
            )}

          </tbody>
        </TableWrap>
      </Panel>
    </AdminShell>
  );
}
