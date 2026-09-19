import { wrapEmail, h1, p, button, BRAND, esc } from "./_brand";

export interface PromoData {
  headline?: string;
  subhead?: string;
  code?: string;
  discount?: string; // e.g. "15% off" or "50 SAR"
  ctaLabel?: string;
  ctaUrl?: string;
  expiresAt?: string;
}

export function subject(d: PromoData = {}): string {
  if (d.discount) return `${d.discount} on your next Tejaraa order`;
  return d.headline?.trim() || `A special offer from ${BRAND.name}`;
}

export function html(d: PromoData = {}): string {
  const headline = d.headline?.trim() || "Just for you";
  const sub = d.subhead?.trim() || "Save on your next sourcing or bulk order with Tejaraa.";
  const ctaLabel = d.ctaLabel?.trim() || "Shop now";
  const ctaUrl = d.ctaUrl?.trim() || `${BRAND.url}/products`;
  const codeBlock = d.code
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
        <tr>
          <td align="center"
              style="background:linear-gradient(135deg,${BRAND.primaryLight},${BRAND.primary});
                     padding:22px;border-radius:14px;color:#ffffff;
                     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            ${d.discount ? `<div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.85;margin-bottom:6px;">${esc(d.discount)}</div>` : ""}
            <div style="font-size:13px;opacity:0.9;margin-bottom:6px;">Use code</div>
            <div style="font-size:30px;font-weight:800;letter-spacing:4px;">${esc(d.code)}</div>
            ${d.expiresAt ? `<div style="margin-top:10px;font-size:12px;opacity:0.85;">Expires ${esc(d.expiresAt)}</div>` : ""}
          </td>
        </tr>
      </table>`
    : "";
  const body = `
    ${h1(headline)}
    ${p(sub)}
    ${codeBlock}
    ${button(ctaLabel, ctaUrl)}
    <p style="margin:18px 0 0;font-size:12px;color:${BRAND.muted};">Terms apply. Limited time offer.</p>
  `;
  return wrapEmail({
    preview: d.discount ? `${d.discount} — code ${d.code ?? "inside"}` : esc(headline),
    bodyHtml: body,
  });
}
