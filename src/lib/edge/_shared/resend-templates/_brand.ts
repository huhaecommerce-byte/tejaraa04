// Tejaraa storefront-green email brand layout for Resend templates.
// Palette mirrors src/index.css --primary (hsl 152 69% 31%) ≈ #187F4E.

export const BRAND = {
  name: "Tejaraa",
  url: "https://tejaraa.com",
  supportEmail: "info@tejaraa.com",
  // Greens
  primary: "#187F4E",      // hsl(152 69% 31%)
  primaryDark: "#0F5A38",  // gradient end
  primaryLight: "#22A968", // gradient start
  accent: "#15803D",
  panel: "#F0FDF4",
  // Neutrals
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
};

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const esc = escapeHtml;

export function button(label: string, href: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
    <tr>
      <td align="center" bgcolor="${BRAND.primary}" style="border-radius:10px;">
        <a href="${esc(href)}" target="_blank"
           style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background:linear-gradient(135deg,${BRAND.primaryLight},${BRAND.primary});">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function panel(innerHtml: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
         style="background:${BRAND.panel};border:1px solid #DCFCE7;border-radius:12px;margin:20px 0;">
    <tr><td style="padding:20px 24px;">${innerHtml}</td></tr>
  </table>`;
}

/**
 * Wraps a body fragment in a full HTML email document with the
 * green Tejaraa header + footer.
 */
export function wrapEmail(opts: {
  preview: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const { preview, bodyHtml, footerNote } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(BRAND.name)}</title>
<style>
  @media (max-width:600px) {
    .container { width:100% !important; }
    .px { padding-left:20px !important; padding-right:20px !important; }
    h1 { font-size:22px !important; }
  }
  a { color:${BRAND.primary}; }
</style>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preview)}</div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F3F4F6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600"
               style="width:600px;max-width:600px;background:${BRAND.bg};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px -8px rgba(15,90,56,0.15);">

          <!-- Green gradient header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primaryDark} 0%,${BRAND.primary} 55%,${BRAND.primaryLight} 100%);padding:36px 32px;text-align:left;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:1.5px;color:#ffffff;">
                    TEJARAA
                  </td>
                  <td align="right" style="font-size:12px;color:rgba(255,255,255,0.85);font-weight:500;letter-spacing:0.5px;">
                    B2B Sourcing &amp; Fulfillment
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px" style="padding:36px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.text};">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAFAFA;border-top:1px solid ${BRAND.border};padding:24px 40px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};line-height:1.6;">
              ${footerNote ? `<div style="margin-bottom:10px;">${footerNote}</div>` : ""}
              <div>
                <a href="${BRAND.url}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">tejaraa.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.primary};text-decoration:none;">${BRAND.supportEmail}</a>
              </div>
              <div style="margin-top:10px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Tejaraa. Riyadh, Kingdom of Saudi Arabia.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.text};">${esc(text)}</h1>`;
}
export function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.text};">${esc(text)}</p>`;
}
export function muted(text: string): string {
  return `<p style="margin:0 0 14px;font-size:13px;color:${BRAND.muted};">${esc(text)}</p>`;
}
