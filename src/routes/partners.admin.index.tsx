import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatCard, StatusPill, Td, TableWrap, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/admin/")({
  head: () => ({
    meta: [
      { title: `Admin Overview | ${brandConfig.name}` },
      { name: "description", content: "Platform overview: wholesaler applications, product moderation, orders and performance." },
      { property: "og:title", content: `Admin Overview | ${brandConfig.name}` },
      { property: "og:description", content: "Monitor wholesaler activity and platform performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOverview,
});

const statusTone: Record<string, string> = { pending: "warning", approved: "positive", rejected: "danger" };

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [applications, profiles, products, orders] = await Promise.all([
        supabase.from("wl_applications").select("id, status, business_name, country, submitted_at").order("submitted_at", { ascending: false }),
        supabase.from("wl_partner_profiles").select("id", { count: "exact", head: true }),
        supabase.from("wl_products").select("id, status"),
        supabase.from("wl_orders").select("id, order_value, status, currency"),
      ]);
      return {
        applications: applications.data ?? [],
        supplierCount: profiles.count ?? 0,
        products: products.data ?? [],
        orders: orders.data ?? [],
      };
    },
  });

  const applications = data?.applications ?? [];
  const pending = applications.filter((row) => row.status === "pending").length;
  const approved = applications.filter((row) => row.status === "approved").length;
  const products = data?.products ?? [];
  const orders = data?.orders ?? [];
  const sales = orders.reduce((total, row) => total + Number(row.order_value ?? 0), 0);

  return (
    <AdminShell title="Platform overview" subtitle={isLoading ? "Loading live platform data…" : "Live activity across wholesalers, listings and orders."}>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Registered accounts" value={String(data?.supplierCount ?? 0)} icon={Users} />
        <StatCard label="Applications" value={String(applications.length)} note={`${pending} awaiting review`} icon={BadgeCheck} />
        <StatCard label="Approved wholesalers" value={String(approved)} icon={TrendingUp} />
        <StatCard label="Products listed" value={String(products.length)} note={`${products.filter((p) => p.status === "pending").length} pending review`} icon={Package} />
        <StatCard label="Order value" value={`AED ${sales.toLocaleString()}`} note={`${orders.length} orders`} icon={ShoppingCart} />
      </div>

      <Panel
        title="Latest applications"
        action={<Link to="/partners/admin/applications" className="text-[11px] font-bold text-primary hover:underline">Review all</Link>}
      >
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Business</Th><Th>Country</Th><Th>Submitted</Th><Th align="right">Status</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.slice(0, 6).map((row) => (
              <tr key={row.id}>
                <Td strong>{row.business_name || "Unnamed business"}</Td>
                <Td>{row.country || "—"}</Td>
                <Td>{new Date(row.submitted_at).toLocaleDateString()}</Td>
                <td className="px-3 py-2.5 text-right"><StatusPill label={row.status} tone={statusTone[row.status] ?? "neutral"} /></td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr><Td>{isLoading ? "Loading…" : "No applications submitted yet."}</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </AdminShell>
  );
}
