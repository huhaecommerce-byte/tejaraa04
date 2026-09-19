import { wrapEmail, h1, p, button, BRAND, esc } from "./_brand";

export interface NewsletterItem {
  title: string;
  summary?: string;
  url?: string;
}
export interface NewsletterData {
  headline?: string;
  intro?: string;
  items?: NewsletterItem[];
  ctaLabel?: string;
  ctaUrl?: string;
}

export function subject(d: NewsletterData = {}): string {
  return d.headline?.trim() || `${BRAND.name} digest`;
}

export function html(d: NewsletterData = {}): string {
  const headline = d.headline?.trim() || "Your Tejaraa digest";
  const intro = d.intro?.trim() || "Here's what's new in sourcing, fulfillment and the KSA marketplace.";
  const items = d.items ?? [];

  const itemsHtml = items.length === 0
    ? ""
    : items.map((it, i) => `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
             style="${i > 0 ? `border-top:1px solid ${BRAND.border};` : ""}padding:0;margin:0;">
        <tr>
          <td style="padding:18px 0;">
            <div style="font-size:16px;font-weight:700;color:${BRAND.text};margin-bottom:6px;">
              ${it.url
                ? `<a href="${esc(it.url)}" style="color:${BRAND.primary};text-decoration:none;">${esc(it.title)}</a>`
                : esc(it.title)}
            </div>
            ${it.summary ? `<div style="font-size:14px;color:${BRAND.muted};line-height:1.55;">${esc(it.summary)}</div>` : ""}
          </td>
        </tr>
      </table>
    `).join("");

  const body = `
    ${h1(headline)}
    ${p(intro)}
    <div style="margin-top:8px;">${itemsHtml}</div>
    ${d.ctaUrl ? button(d.ctaLabel?.trim() || "Read more", d.ctaUrl) : ""}
  `;
  return wrapEmail({
    preview: esc(intro),
    bodyHtml: body,
    footerNote: "You're receiving this because you opted into Tejaraa updates.",
  });
}
