import { wrapEmail, h1, p, button, panel, BRAND, esc } from "./_brand";

export interface OrderUpdateData {
  name?: string;
  orderId?: string;
  status?: string;
  trackingNumber?: string;
  ctaUrl?: string;
}

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending: { title: "Order received", body: "We've got your order and our team is reviewing it now." },
  confirmed: { title: "Order confirmed", body: "Your order is confirmed and moving into processing." },
  processing: { title: "Order being prepared", body: "Our warehouse team is picking and packing your order." },
  shipped: { title: "Order shipped 🚚", body: "Your order is on its way." },
  delivered: { title: "Order delivered ✅", body: "Your order has been delivered. Thanks for shopping with Tejaraa." },
  cancelled: { title: "Order cancelled", body: "Your order has been cancelled. Reach out if this wasn't expected." },
};

export function subject(d: OrderUpdateData = {}): string {
  const s = (d.status || "updated").toLowerCase();
  const copy = STATUS_COPY[s];
  const short = d.orderId ? ` #${d.orderId.slice(0, 8)}` : "";
  return `${copy?.title ?? "Order update"}${short}`;
}

export function html(d: OrderUpdateData = {}): string {
  const name = d.name?.trim() || "there";
  const status = (d.status || "updated").toLowerCase();
  const copy = STATUS_COPY[status] ?? { title: "Order update", body: `Your order status changed to ${status}.` };
  const cta = d.ctaUrl || `${BRAND.url}/dropshipping/orders`;
  const body = `
    ${h1(copy.title)}
    ${p(`Hi ${esc(name)}, ${copy.body}`)}
    ${panel(`
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;color:${BRAND.text};">
        ${d.orderId ? `<tr><td style="padding:4px 0;color:${BRAND.muted};">Order ID</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(d.orderId)}</td></tr>` : ""}
        <tr><td style="padding:4px 0;color:${BRAND.muted};">Status</td><td style="padding:4px 0;text-align:right;font-weight:600;color:${BRAND.primary};text-transform:capitalize;">${esc(status)}</td></tr>
        ${d.trackingNumber ? `<tr><td style="padding:4px 0;color:${BRAND.muted};">Tracking</td><td style="padding:4px 0;text-align:right;font-weight:600;">${esc(d.trackingNumber)}</td></tr>` : ""}
      </table>
    `)}
    ${button("View order details", cta)}
  `;
  return wrapEmail({
    preview: `${copy.title}${d.orderId ? ` — #${d.orderId.slice(0, 8)}` : ""}`,
    bodyHtml: body,
  });
}
