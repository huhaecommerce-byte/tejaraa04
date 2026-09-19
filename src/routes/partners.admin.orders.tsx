import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, TrendingUp, Truck } from "lucide-react";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatCard, StatusPill, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/admin/orders")({
  head: () => ({
    meta: [
      { title: `Orders & Performance | ${brandConfig.name}` },
      { name: "description", content: "Track every order across sales channels, order value, fulfilment status and platform performance." },
      { property: "og:title", content: `Orders & Performance | ${brandConfig.name}` },
      { property: "og:description", content: "Monitor order flow and channel performance across GCC markets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

const statusTone: Record<string, string> = { New: "info", Confirmed: "info", Packed: "warning", Shipped: "positive", Delivered: "positive", Cancelled: "danger" };

function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("wl_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return rows;
    },
  });

  const orders = data ?? [];
  const value = orders.reduce((total, row) => total + Number(row.order_value ?? 0), 0);
  const units = orders.reduce((total, row) => total + Number(row.quantity ?? 0), 0);
  const openOrders = orders.filter((row) => !["Delivered", "Cancelled"].includes(row.status)).length;
  const average = orders.length ? Math.round(value / orders.length) : 0;

  const channels = [...new Set(orders.map((row) => row.channel).filter(Boolean))];

  return (
    <AdminShell title="Orders & performance" subtitle="Order flow across every sales channel, with fulfilment and value tracking.">
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={String(orders.length)} icon={ShoppingCart} />
        <StatCard label="Order value" value={`AED ${value.toLocaleString()}`} note={`Avg AED ${average.toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Units sold" value={String(units)} icon={Package} />
        <StatCard label="Open fulfilment" value={String(openOrders)} note={`${channels.length} active channels`} icon={Truck} />
      </div>

      <Panel title="All orders">
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Reference</Th><Th>Channel</Th><Th>Products</Th><Th align="right">Qty</Th><Th align="right">Value</Th><Th>Buyer market</Th><Th align="right">Status</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((row) => (
              <tr key={row.id}>
                <Td strong>{row.reference || row.id.slice(0, 8)}</Td>
                <Td>{row.channel || "—"}</Td>
                <Td>{row.product_summary || "—"}</Td>
                <Td align="right" strong>{row.quantity}</Td>
                <Td align="right" strong>{row.currency} {Number(row.order_value).toLocaleString()}</Td>
                <Td>{row.buyer_country || "—"}</Td>
                <td className="px-3 py-2.5 text-right"><StatusPill label={row.status} tone={statusTone[row.status] ?? "neutral"} /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><Td>{isLoading ? "Loading…" : "No orders yet."}</Td><Td>—</Td><Td>—</Td><Td align="right">0</Td><Td align="right">—</Td><Td>—</Td><Td align="right">—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </AdminShell>
  );
}
