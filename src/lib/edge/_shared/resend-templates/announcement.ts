import { wrapEmail, h1, p, button, BRAND, esc } from "./_brand";

export interface AnnouncementData {
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function subject(d: AnnouncementData = {}): string {
  return d.headline?.trim() || `News from ${BRAND.name}`;
}

export function html(d: AnnouncementData = {}): string {
  const headline = d.headline?.trim() || "We have an update for you";
  const bodyText = d.body?.trim() || "Thanks for being part of Tejaraa. Here's the latest from our team.";
  const ctaLabel = d.ctaLabel?.trim();
  const ctaUrl = d.ctaUrl?.trim();
  const body = `
    ${h1(headline)}
    ${p(bodyText)}
    ${ctaLabel && ctaUrl ? button(ctaLabel, ctaUrl) : ""}
  `;
  return wrapEmail({
    preview: esc(headline),
    bodyHtml: body,
  });
}
