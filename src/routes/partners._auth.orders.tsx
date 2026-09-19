import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, PackageCheck, ShoppingCart, Truck, Undo2 } from "lucide-react";
import { useState } from "react";
import { GhostButton, Panel, StatCard, StatusPill, SupplierShell, Tabs, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/orders")({
  head: () => ({
    meta: [
      { title: `Orders — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Follow every wholesale and B2B order from new to delivered, update fulfillment status and export your order list." },
      { property: "og:title", content: `Orders — ${brandConfig.name}` },
      { property: "og:description", content: "One order pipeline for all your GCC sales channels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

const orderStatuses = [
  "New", "Confirmed", "Processing", "Ready to Ship", "Shipped",
  "Delivered", "Cancelled", "Return Requested", "Returned",
] as const;

const tone: Record<string, string> = {
  New: "info",
  Confirmed: "info",
  Processing: "warning",
  "Ready to Ship": "warning",
  Shipped: "warning",
  Delivered: "positive",
  Cancelled: "danger",
  "Return Requested": "danger",
  Returned: "neutral",
};

function OrdersPage() {
  const [tab, setTab] = useState<string>("All Orders");
  const { orders, loading, refresh } = useSupplierWorkspace();
  const { data: orderItems } = useQuery({
    queryKey: ["supplier", "order-items"],
    queryFn: async () => {
      const { data } = await supabase.from("wl_order_items").select("*").order("created_at", { ascending: true });
      return data ?? [];
    },
  });
  const itemsByOrder = new Map<string, { sku: string; name: string; quantity: number }[]>();
  for (const item of orderItems ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({ sku: item.sku, name: item.name, quantity: item.quantity });
    itemsByOrder.set(item.order_id, list);
  }
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const tabs = ["All Orders", ...orderStatuses] as const;
  const rows = tab === "All Orders" ? orders : orders.filter((order) => order.status === tab);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    const { error } = await supabase.from("wl_orders").update({ status }).eq("id", id);
    setBusy("");
    setMessage(error ? error.message : "Order status updated.");
    if (!error) refresh();
  }

  function exportCsv() {
    const header = ["Order", "Channel", "Products", "Quantity", "Value", "Currency", "Shipping", "Buyer country", "Status", "Date"];
    const lines = rows.map((order) => [
      order.reference || order.id,
      order.channel,
      order.product_summary.replace(/,/g, ";"),
      order.quantity,
      order.order_value,
      order.currency,
      order.shipping,
      order.buyer_country,
      order.status,
      new Date(order.created_at).toISOString().slice(0, 10),
    ].join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SupplierShell
      title="Orders"
      subtitle="Orders from our storefront, B2B buyers and API integrations, in one pipeline."
      actions={<GhostButton onClick={exportCsv} disabled={rows.length === 0}><Download className="h-4 w-4" /> Export CSV</GhostButton>}
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="New Orders" value={String(orders.filter((o) => o.status === "New").length)} note="Awaiting confirmation" icon={ShoppingCart} />
        <StatCard label="In Fulfillment" value={String(orders.filter((o) => ["Confirmed", "Processing", "Ready to Ship"].includes(o.status)).length)} note="Being prepared" icon={PackageCheck} />
        <StatCard label="In Transit" value={String(orders.filter((o) => o.status === "Shipped").length)} note="With the courier" icon={Truck} />
        <StatCard label="Returns" value={String(orders.filter((o) => o.status.includes("Return")).length)} note="Awaiting your review" icon={Undo2} />
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <Panel title={`${rows.length} ${rows.length === 1 ? "order" : "orders"}`} action={<span className="text-[11px] font-semibold text-muted-foreground">{tab}</span>}>
        <TableWrap>
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <Th>Order ID</Th><Th>Channel</Th><Th>Products</Th><Th align="right">Qty</Th>
              <Th align="right">Order Value</Th><Th>Buyer Country</Th><Th>Status</Th><Th>Update</Th><Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <Td strong>{order.reference || order.id.slice(0, 8)}</Td>
                <Td>{order.channel || "—"}</Td>
                <Td>
                  <span className="block max-w-[220px] truncate">{order.product_summary || "—"}</span>
                  {(itemsByOrder.get(order.id) ?? []).map((item) => (
                    <span key={`${order.id}-${item.sku}`} className="block max-w-[220px] truncate text-[10px] font-semibold text-muted-foreground">
                      {item.quantity} × {item.name} ({item.sku})
                    </span>
                  ))}
                </Td>
                <Td align="right">{order.quantity}</Td>
                <Td align="right" strong>{order.currency} {Number(order.order_value).toLocaleString()}</Td>
                <Td>{order.buyer_country || "—"}</Td>
                <Td><StatusPill label={order.status} tone={tone[order.status] ?? "neutral"} /></Td>
                <Td>
                  <label>
                    <span className="sr-only">Update status for order {order.reference || order.id}</span>
                    <select
                      value={order.status}
                      disabled={busy === order.id}
                      onChange={(event) => setStatus(order.id, event.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-[11px] font-bold outline-none focus:border-primary"
                    >
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </Td>
                <Td>{new Date(order.created_at).toLocaleDateString()}</Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-xs text-muted-foreground">{loading ? "Loading your orders…" : "No orders with this status yet."}</td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </SupplierShell>
  );
}
