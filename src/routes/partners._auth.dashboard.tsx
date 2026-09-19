import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, CircleDollarSign, Package, ShoppingCart, Tags, TrendingUp, Users } from "lucide-react";
import { GhostLink, Panel, PrimaryLink, StatCard, StatusPill, SupplierShell, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";

export const Route = createFileRoute("/partners/_auth/dashboard")({
  head: () => ({
    meta: [
      { title: `Supplier Dashboard — ${brandConfig.name}` },
      { name: "description", content: "Track products, orders, stock alerts and sales performance across every GCC sales channel from one supplier workspace." },
      { property: "og:title", content: `Supplier Dashboard — ${brandConfig.name}` },
      { property: "og:description", content: "One workspace for wholesale listings, inventory, orders and payouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierDashboard,
});

function EmptyRow({ span, message }: { span: number; message: string }) {
  return <tr><td colSpan={span} className="px-3 py-8 text-center text-xs text-muted-foreground">{message}</td></tr>;
}

const money = (value: number, currency: string) => `${currency} ${value.toLocaleString()}`;

function SupplierDashboard() {
  const { loading, application, documents, products, orders, companyName, settings, payouts, currency } = useSupplierWorkspace();

  const threshold = settings?.low_stock_threshold ?? 10;
  const alerts = products.filter((p) => p.stock <= threshold);
  const activeListings = products.filter((p) => p.status === "active").length;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const monthOrders = orders.filter((o) => new Date(o.created_at).getTime() >= monthStart);
  const monthSales = monthOrders.reduce((sum, o) => sum + Number(o.order_value), 0);
  const delivered = orders.filter((o) => o.status === "Delivered").reduce((sum, o) => sum + Number(o.order_value), 0);
  const requested = payouts.filter((p) => p.status !== "rejected").reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, delivered - requested);

  const stats = [
    { label: "Total Products", value: String(products.length), note: products.length ? "In your catalog" : "No products added yet", icon: Package },
    { label: "Active Listings", value: String(activeListings), note: activeListings ? "Live on channels" : "Publish your first listing", icon: Tags },
    { label: "Orders This Month", value: String(monthOrders.length), note: monthOrders.length ? "Across all channels" : "No orders yet", icon: ShoppingCart },
    { label: "Sales This Month", value: monthSales ? money(monthSales, currency) : "—", note: monthSales ? "Gross order value" : "Awaiting first sale", icon: TrendingUp },
    { label: "Available Balance", value: balance ? money(balance, currency) : "—", note: balance ? "Ready to withdraw" : "No payouts yet", icon: CircleDollarSign },
    { label: "Buyer Markets", value: String(new Set(orders.map((o) => o.buyer_country).filter(Boolean)).size), note: "6 GCC markets available", icon: Users },
  ];

  const verification: { label: string; done: boolean }[] = [
    { label: "Business Registration", done: Boolean(application?.business_name || application?.trading_name) },
    ...documents.map((doc) => ({ label: doc.label, done: doc.provided })),
    { label: "Warehouse Details", done: Array.isArray(application?.warehouses) && (application?.warehouses as unknown[]).length > 0 },
  ];

  const statusBanner =
    application?.status === "approved"
      ? { tone: "positive", text: "Your account is approved and verified. Add products to start selling." }
      : application?.status === "rejected"
        ? { tone: "danger", text: application.review_notes || "Your application was rejected. Please review and resubmit." }
        : application
          ? { tone: "warning", text: "Your application is submitted and under review by our team." }
          : { tone: "neutral", text: "No application submitted yet. Complete registration to get verified." };

  return (
    <SupplierShell
      title="Dashboard"
      subtitle={companyName ? `${companyName} — your workspace across the GCC.` : "Your workspace is ready. Add products to start selling across the GCC."}
      actions={
        <>
          <PrimaryLink to="/partners/products/new">Add Product</PrimaryLink>
          
          <GhostLink to="/partners/finance">Request Payout</GhostLink>
        </>
      }
    >
      <section className="flex flex-wrap items-center gap-2.5 rounded-card border border-border bg-card px-3 py-2.5 shadow-card">
        <StatusPill
          label={
            application?.status === "approved" ? "Approved"
            : application?.status === "rejected" ? "Rejected"
            : application ? "Pending review" : "Not submitted"
          }
          tone={statusBanner.tone}
        />
        <p className="text-[11px] text-muted-foreground">{loading ? "Loading your account…" : statusBanner.text}</p>
        {!application && !loading && (
          <Link to="/partners/join" className="ml-auto text-[11px] font-bold text-primary">Complete registration</Link>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid gap-3">
        <RecentOrdersPanel orders={orders} />
        <InventoryAlertsPanel alerts={alerts} />

        {application?.status !== "approved" && (
          <Panel title="Verification Status">
            <ul className="grid gap-2 p-3 sm:grid-cols-2">
              {verification.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-2 rounded-card border border-border px-2.5 py-2">
                  <span className="text-[11px] font-semibold">{item.label}</span>
                  <StatusPill
                    label={item.done ? (application?.status === "approved" ? "Approved" : "Submitted") : "Not submitted"}
                    tone={item.done ? (application?.status === "approved" ? "positive" : "info") : "neutral"}
                  />
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
              <Boxes className="h-4 w-4 text-primary" />
              <p className="text-[11px] text-muted-foreground">Complete your verification to unlock buyer visibility.</p>
            </div>
          </Panel>
        )}
      </div>
    </SupplierShell>
  );
}

type OrderRow = ReturnType<typeof useSupplierWorkspace>["orders"][number];
type ProductRow = ReturnType<typeof useSupplierWorkspace>["products"][number];

function RecentOrdersPanel({ orders }: { orders: OrderRow[] }) {
  return (
    <Panel
      title="Recent Orders"
      action={<Link to="/partners/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
    >
      <TableWrap>
        <thead className="border-b border-border bg-secondary/50"><tr><Th>Order ID</Th><Th>Channel</Th><Th>Qty</Th><Th>Value</Th><Th>Status</Th></tr></thead>
        <tbody>
          {orders.slice(0, 5).map((order) => (
            <tr key={order.id} className="border-b border-border last:border-0">
              <Td strong>{order.reference || order.id.slice(0, 8)}</Td>
              <Td>{order.channel || "—"}</Td>
              <Td>{order.quantity}</Td>
              <Td strong>{money(Number(order.order_value), order.currency)}</Td>
              <Td><StatusPill label={order.status} tone={order.status === "New" ? "info" : order.status === "Cancelled" ? "danger" : order.status === "Delivered" ? "positive" : "warning"} /></Td>
            </tr>
          ))}
          {orders.length === 0 && <EmptyRow span={5} message="No orders yet. They will appear here once buyers start ordering." />}
        </tbody>
      </TableWrap>
    </Panel>
  );
}

function InventoryAlertsPanel({ alerts }: { alerts: ProductRow[] }) {
  return (
    <Panel
      title="Inventory Alerts"
      action={<Link to="/partners/products" search={{ q: "" }} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
    >
      <ul className="divide-y divide-border">
        {alerts.slice(0, 5).map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{row.name}</p>
              <p className="text-[10px] text-muted-foreground">{row.sku || "No SKU"} — {row.warehouse || "No warehouse"}</p>
            </div>
            <StatusPill label={row.stock === 0 ? "Out of stock" : `${row.stock} left`} tone={row.stock === 0 ? "danger" : "warning"} />
          </li>
        ))}
        {alerts.length === 0 && (
          <li className="px-3 py-8 text-center text-xs text-muted-foreground">No stock alerts. Add inventory to start tracking levels.</li>
        )}
      </ul>
    </Panel>
  );
}
