export const SITE_URL = 'https://tejaraa.com';

/** Browser-safe slugifier - mirrors the database public.slugify() rule. */
export function slugify(input: string | null | undefined): string {
  return (input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slugifier that preserves Arabic letters/digits (for /ar/ URLs). */
export function slugifyAr(input: string | null | undefined): string {
  return (input ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '') // strip diacritics + tatweel
    .replace(/[^a-z0-9\u0621-\u063A\u0641-\u064A\u0660-\u0669\u06F0-\u06F9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: string) => UUID_RE.test(v);

export const productPath = (p: { slug?: string | null; id: string }) => `/product/${p.slug || p.id}`;

export const categoryPath = (top: string, sub?: string | null, detail?: string | null) => {
  const parts = [slugify(top)];
  if (sub) parts.push(slugify(sub));
  if (detail) parts.push(slugify(detail));
  return `/category/${parts.join('/')}`;
};

export const arPath = (path: string) => (path === '/' ? '/ar' : `/ar${path}`);
