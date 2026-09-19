import { createClient } from "@supabase/supabase-js";
import { blogPosts } from "@/data/blogPosts";
import { categoryPath, productPath } from "@/lib/seo/slug";

const SITE_URL = 'https://tejaraa.com';
const PAGE_SIZE = 45000; // stay under the 50k URL / 50MB per-sitemap limit

const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

const xmlHeaders = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
};

const MARKETING_PATHS = [
  '/',
  '/catalog',
  '/services',
  '/noon-seller-services-ksa',
  '/pricing',
  '/contact',
  '/blog',
];

const staticPaths = () => [
  ...MARKETING_PATHS,
  ...blogPosts.map((p) => `/blog/${p.slug}`),
];

async function totalProducts(): Promise<number> {
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'estimated', head: true });
  return count ?? 0;
}

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlset(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`;
}

/**
 * One <url> with its Arabic alternate. Both language versions are listed so
 * Google can pair them, which is what the hreflang tags on the pages declare.
 */
function urlEntry(path: string, opts: { lastmod?: string | null; changefreq?: string; priority?: string } = {}) {
  const en = `${SITE_URL}${path}`;
  const ar = `${SITE_URL}/ar${path === '/' ? '' : path}`;
  const alternates =
    `<xhtml:link rel="alternate" hreflang="en-sa" href="${xmlEscape(en)}"/>` +
    `<xhtml:link rel="alternate" hreflang="ar-sa" href="${xmlEscape(ar)}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(en)}"/>`;
  const lastmod = opts.lastmod ? `<lastmod>${new Date(opts.lastmod).toISOString()}</lastmod>` : '';
  const changefreq = opts.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : '';
  const priority = opts.priority ? `<priority>${opts.priority}</priority>` : '';
  return (
    `<url><loc>${xmlEscape(en)}</loc>${lastmod}${changefreq}${priority}${alternates}</url>` +
    `<url><loc>${xmlEscape(ar)}</loc>${lastmod}${changefreq}${alternates}</url>`
  );
}

/** Boundary id for keyset paging — cheap index-only lookup instead of a huge OFFSET fetch. */
async function boundaryId(offset: number): Promise<string | null> {
  if (offset <= 0) return null;
  const { data } = await supabase
    .from('products')
    .select('id')
    .order('id', { ascending: true })
    .range(offset - 1, offset - 1);
  return data?.[0]?.id ?? null;
}

async function categoryUrls(): Promise<string> {
  const { data } = await supabase
    .from('product_category_counts_cache')
    .select('top_category, sub_category, detailed_category')
    .limit(10000);

  const paths = new Set<string>();
  for (const r of data ?? []) {
    const top = r.top_category ?? '';
    if (!top) continue;
    paths.add(categoryPath(top));
    if (r.sub_category) paths.add(categoryPath(top, r.sub_category));
    if (r.sub_category && r.detailed_category) {
      paths.add(categoryPath(top, r.sub_category, r.detailed_category));
    }
  }
  return [...paths].map((p) => urlEntry(p, { changefreq: 'daily', priority: '0.8' })).join('');
}

export async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const pageParam = url.searchParams.get('page');

    // ---- Child product sitemap ----
    if (pageParam !== null) {
      const page = Math.max(0, parseInt(pageParam, 10) || 0);
      const after = await boundaryId(page * PAGE_SIZE);

      let query = supabase
        .from('products')
        .select('id, slug, updated_at')
        .order('id', { ascending: true })
        .limit(PAGE_SIZE);
      if (after) query = query.gt('id', after);

      const { data, error } = await query;
      if (error) throw error;

      const urls = (data ?? [])
        .map((p) => urlEntry(productPath(p), { lastmod: p.updated_at, changefreq: 'weekly' }))
        .join('');

      return new Response(urlset([urls]), { headers: xmlHeaders });
    }

    // ---- Marketing + blog child sitemap ----
    if (url.searchParams.get('static') === '1') {
      const entries = staticPaths().map((p) =>
        urlEntry(p, { changefreq: p === '/' ? 'daily' : 'weekly', priority: p === '/' ? '1.0' : '0.7' }),
      );
      return new Response(urlset(entries), { headers: xmlHeaders });
    }

    // ---- Category child sitemap ----
    if (url.searchParams.get('categories') === '1') {
      return new Response(urlset([await categoryUrls()]), { headers: xmlHeaders });
    }

    // ---- Sitemap index ----
    const total = await totalProducts();
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    // Pinned to the project domain so child sitemap URLs are always
    // https://tejaraa.com, regardless of the requesting host.
    const base = `${SITE_URL}/sitemap.xml`;
    const now = new Date().toISOString();

    // Marketing and category sitemaps come first so Google discovers the
    // highest-value hub pages before crawling deep into the product long tail.
    const children: string[] = [
      `<sitemap><loc>${xmlEscape(`${base}?static=1`)}</loc><lastmod>${now}</lastmod></sitemap>`,
      `<sitemap><loc>${xmlEscape(`${base}?categories=1`)}</loc><lastmod>${now}</lastmod></sitemap>`,
    ];
    for (let i = 0; i < pages; i++) {
      children.push(`<sitemap><loc>${xmlEscape(`${base}?page=${i}`)}</loc><lastmod>${now}</lastmod></sitemap>`);
    }

    const indexBody = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${children.join('')}</sitemapindex>`;
    return new Response(indexBody, { headers: xmlHeaders });
  } catch (e) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<!-- error: ${(e as Error).message} -->`, {
      status: 500,
      headers: xmlHeaders,
    });
  }
}
