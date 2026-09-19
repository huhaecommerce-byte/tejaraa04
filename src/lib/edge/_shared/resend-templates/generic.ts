import { wrapEmail, h1, p, button, esc } from "./_brand";

export interface GenericData {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  preview?: string;
}

export function subject(d: GenericData = {}): string {
  return d.heading?.trim() || "A message from Tejaraa";
}

export function html(d: GenericData = {}): string {
  const heading = d.heading?.trim() || "Hello";
  const text = d.body?.trim() || "";
  // Simple paragraph split on blank lines.
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(p)
    .join("");
  const body = `
    ${h1(heading)}
    ${paragraphs}
    ${d.ctaLabel && d.ctaUrl ? button(d.ctaLabel, d.ctaUrl) : ""}
  `;
  return wrapEmail({
    preview: d.preview?.trim() || esc(heading),
    bodyHtml: body,
  });
}
