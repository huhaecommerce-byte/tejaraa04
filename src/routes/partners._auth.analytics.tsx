import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Panel, StatCard, SupplierShell, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { salesChannelNames, useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";

export const Route = createFileRoute("/partners/_auth/analytics")({
  head: () => ({
    meta: [
      { title: `Analytics — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Monthly sales trend, channel split and best-selling products calculated from your real order history." },
      { property: "og:title", content: `Analytics — ${brandConfig.name}` },
      { property: "og:description", content: "Sales performance analytics for GCC wholesalers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function monthKey(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function AnalyticsPage() {
  const { orders, products, loading, currency } = useSupplierWorkspace();

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date);
    const value = orders
      .filter((order) => monthKey(new Date(order.created_at)) === key)
      .reduce((sum, order) => sum + Number(order.order_value), 0);
    return { key, value };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.value));

  const totalValue = orders.reduce((sum, order) => sum + Number(order.order_value), 0);
  const units = orders.reduce((sum, order) => sum + order.quantity, 0);

  const topProducts = Object.values(
    orders.reduce<Record<string, { name: string; orders: number; units: number; value: number }>>((acc, order) => {
      const key = order.product_summary || "Unspecified";
      const entry = acc[key] ?? { name: key, orders: 0, units: 0, value: 0 };
      entry.orders += 1;
      entry.units += order.quantity;
      entry.value += Number(order.order_value);
      acc[key] = entry;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <SupplierShell title="Analytics" subtitle="Performance of your catalog across every channel, calculated from your order history.">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Gross Sales" value={totalValue ? `${currency} ${totalValue.toLocaleString()}` : "—"} note="All time" icon={TrendingUp} />
        <StatCard label="Orders" value={String(orders.length)} note="All channels" icon={ShoppingCart} />
        <StatCard label="Units Sold" value={units.toLocaleString()} note="Total quantity" icon={Package} />
        <StatCard label="Live Listings" value={String(products.filter((p) => p.status === "active").length)} note={`of ${products.length} products`} icon={BarChart3} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Sales, last 6 months">
          <ul className="space-y-2.5 p-3">
            {months.map((month) => (
              <li key={month.key}>
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                  <span>{month.key}</span>
                  <span className="text-muted-foreground">{month.value ? `${currency} ${month.value.toLocaleString()}` : "—"}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(month.value / maxMonth) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Channel split">
          <ul className="space-y-2.5 p-3">
            {salesChannelNames.map((channel) => {
              const value = orders.filter((order) => order.channel === channel).reduce((sum, order) => sum + Number(order.order_value), 0);
              const share = totalValue ? Math.round((value / totalValue) * 100) : 0;
              return (
                <li key={channel}>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                    <span>{channel}</span>
                    <span className="text-muted-foreground">{value ? `${currency} ${value.toLocaleString()} · ${share}%` : "—"}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Best selling products">
        <TableWrap>
          <thead className="border-b border-border bg-secondary/50">
            <tr><Th>Product</Th><Th align="right">Orders</Th><Th align="right">Units</Th><Th align="right">Value</Th></tr>
          </thead>
          <tbody>
            {topProducts.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <Td strong><span className="block max-w-[320px] truncate">{row.name}</span></Td>
                <Td align="right">{row.orders}</Td>
                <Td align="right">{row.units.toLocaleString()}</Td>
                <Td align="right" strong>{currency} {row.value.toLocaleString()}</Td>
              </tr>
            ))}
            {topProducts.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-muted-foreground">{loading ? "Loading analytics…" : "No sales data yet. Analytics build up as orders arrive."}</td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </SupplierShell>
  );
}
