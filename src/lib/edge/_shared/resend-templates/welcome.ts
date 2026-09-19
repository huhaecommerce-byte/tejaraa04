import { wrapEmail, h1, p, button, panel, BRAND, esc } from "./_brand";

export interface WelcomeData {
  name?: string;
  ctaUrl?: string;
}

export function subject(_d: WelcomeData = {}): string {
  return `Welcome to ${BRAND.name} 🌱`;
}

export function html(d: WelcomeData = {}): string {
  const name = d.name?.trim() || "there";
  const cta = d.ctaUrl || `${BRAND.url}/dropshipping`;
  const body = `
    ${h1(`Welcome aboard, ${esc(name)}!`)}
    ${p(`We're thrilled to have you on Tejaraa — your end-to-end B2B sourcing & fulfillment partner in Saudi Arabia.`)}
    ${panel(`
      <div style="font-size:14px;color:${BRAND.text};line-height:1.7;">
        <strong style="color:${BRAND.primary};">Here's what you can do today:</strong>
        <ul style="margin:10px 0 0 18px;padding:0;">
          <li>Browse 2,000+ ready-to-ship products</li>
          <li>Request bulk quotes or new sourcing</li>
          <li>Store inventory in our Riyadh warehouse</li>
          <li>Auto-fulfill orders to Amazon, Noon &amp; your store</li>
        </ul>
      </div>
    `)}
    ${button("Open your dashboard", cta)}
    ${p(`Need a hand? Just reply to this email — a real person on our team will get back to you within hours.`)}
  `;
  return wrapEmail({
    preview: `Welcome to Tejaraa, ${name} — your account is ready.`,
    bodyHtml: body,
  });
}
