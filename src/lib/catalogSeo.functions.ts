import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const productSchema = z.object({ handle: z.string().trim().min(1).max(200) });

const categorySchema = z.object({
  top: z.string().trim().min(1).max(160),
  sub: z.string().trim().max(160).optional(),
  detail: z.string().trim().max(160).optional(),
  page: z.number().int().min(0).max(500).optional(),
});

export type SeoProduct = {
  id: string;
  slug: string | null;
  slug_ar: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  images: string[];
  sku: string;
  source: string;
  top_category: string;
  sub_category: string;
  detailed_category: string;
  price_sar: number;
  stock_qty: number;
  track_inventory?: boolean;
  low_stock_threshold?: number;
  moq: number;
  weight_kg: number;
  estimated_delivery: string | null;
  labelling_available: boolean | null;
  platforms: string[] | null;
  updated_at: string;
  rating_avg?: number | null;
  review_count?: number;
  top_reviews?: { rating: number; title: string; body: string; created_at: string; author_name: string }[];
  related_products?: SeoProduct[];
  related_ratings?: Record<string, { avg_rating: number | null; review_count: number | null }>;
};

export type CategoryNode = {
  top: string;
  sub: string;
  detail: string;
  cnt: number;
};

/** Public, unauthenticated product lookup by slug or id (used for server-rendered SEO). */
export const getProductSeo = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data }): Promise<SeoProduct | null> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.handle);
    const cols =
      'id, slug, slug_ar, name, name_ar, description, description_ar, images, sku, source, top_category, sub_category, detailed_category, price_sar, stock_qty, track_inventory, low_stock_threshold, moq, weight_kg, estimated_delivery, labelling_available, platforms, updated_at';
    const q = supabaseAdmin.from('products').select(cols);
    const { data: row } = uuid
      ? await q.eq('id', data.handle).maybeSingle()
      : await q.or(`slug.eq.${data.handle},slug_ar.eq.${data.handle}`).maybeSingle();
    if (!row) return null;

    // Real review data for structured-data aggregateRating / review fields.
    const { data: reviews, count } = await supabaseAdmin
      .from('product_reviews')
      .select('rating, title, body, created_at, user_id', { count: 'exact' })
      .eq('product_id', row.id)
      .order('created_at', { ascending: false })
      .limit(5);

    let rating_avg: number | null = null;
    let review_count = count ?? 0;
    let top_reviews: SeoProduct['top_reviews'] = [];
    if (reviews?.length) {
      rating_avg = reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', reviews.map((r) => r.user_id));
      const nameByUser = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
      top_reviews = reviews.map((r) => ({
        rating: r.rating,
        title: r.title ?? '',
        body: r.body ?? '',
        created_at: r.created_at,
        author_name: nameByUser.get(r.user_id) || 'Verified buyer',
      }));
    }

    const { data: related } = await supabaseAdmin
      .from('products')
      .select(cols)
      .eq('top_category', row.top_category)
      .neq('id', row.id)
      .order('is_featured', { ascending: false })
      .limit(10);

    const relatedProducts = (related ?? []) as unknown as SeoProduct[];
    const relatedIds = relatedProducts.map((product) => product.id);
    let related_ratings: SeoProduct['related_ratings'] = {};
    if (relatedIds.length > 0) {
      const { data: ratingRows } = await supabaseAdmin
        .from('product_rating_stats')
        .select('product_id, avg_rating, review_count')
        .in('product_id', relatedIds);
      related_ratings = Object.fromEntries((ratingRows ?? []).flatMap((rating) => rating.product_id ? [[rating.product_id, { avg_rating: rating.avg_rating, review_count: rating.review_count }]] : []));
    }

    return { ...(row as SeoProduct), rating_avg, review_count, top_reviews, related_products: relatedProducts, related_ratings };
  });

/** Category hierarchy with product counts, served from the cached rollup table. */
export const getCategoryTree = createServerFn({ method: 'GET' }).handler(async (): Promise<CategoryNode[]> => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  const read = async () => {
    const rows: CategoryNode[] = [];
    for (let page = 0; page < 10; page++) {
      const { data } = await supabaseAdmin
        .from('product_category_counts_cache')
        .select('top_category, sub_category, detailed_category, cnt')
        .order('top_category')
        .range(page * 1000, page * 1000 + 999);
      const chunk = data ?? [];
      for (const r of chunk) {
        rows.push({
          top: r.top_category ?? '',
          sub: r.sub_category ?? '',
          detail: r.detailed_category ?? '',
          cnt: Number(r.cnt ?? 0),
        });
      }
      if (chunk.length < 1000) break;
    }
    return rows;
  };

  let rows = await read();
  if (rows.length === 0) {
    await supabaseAdmin.rpc('refresh_category_counts_cache');
    rows = await read();
  }
  return rows.filter((r) => r.top);
});

export type CategoryPageData = {
  top: string;
  sub: string | null;
  detail: string | null;
  total: number;
  products: SeoProduct[];
  children: { name: string; cnt: number }[];
};

const PAGE = 24;

/** Products + child categories for a category landing page (slug segments in, names resolved server-side). */
export const getCategoryPage = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => categorySchema.parse(d))
  .handler(async ({ data }): Promise<CategoryPageData | null> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { slugify } = await import('@/lib/seo/slug');

    const { data: cacheRows } = await supabaseAdmin
      .from('product_category_counts_cache')
      .select('top_category, sub_category, detailed_category, cnt')
      .limit(10000);

    const rows = (cacheRows ?? []).map((r) => ({
      top: r.top_category ?? '',
      sub: r.sub_category ?? '',
      detail: r.detailed_category ?? '',
      cnt: Number(r.cnt ?? 0),
    }));

    const top = rows.find((r) => slugify(r.top) === data.top)?.top;
    if (!top) return null;

    let sub: string | null = null;
    if (data.sub) {
      sub = rows.find((r) => r.top === top && slugify(r.sub) === data.sub)?.sub ?? null;
      if (!sub) return null;
    }

    let detail: string | null = null;
    if (data.detail) {
      detail =
        rows.find((r) => r.top === top && r.sub === sub && slugify(r.detail) === data.detail)?.detail ?? null;
      if (!detail) return null;
    }

    const page = data.page ?? 0;
    let query = supabaseAdmin
      .from('products')
      .select(
        'id, slug, slug_ar, name, name_ar, description, description_ar, images, sku, source, top_category, sub_category, detailed_category, price_sar, stock_qty, track_inventory, low_stock_threshold, updated_at',
        { count: 'estimated' },
      )
      .eq('top_category', top);
    if (sub) query = query.eq('sub_category', sub);
    if (detail) query = query.eq('detailed_category', detail);

    const { data: products, count } = await query
      .order('id', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);

    const children = (() => {
      const map = new Map<string, number>();
      for (const r of rows) {
        if (r.top !== top) continue;
        if (!sub) {
          if (r.sub) map.set(r.sub, (map.get(r.sub) ?? 0) + r.cnt);
        } else if (r.sub === sub && !detail) {
          if (r.detail) map.set(r.detail, (map.get(r.detail) ?? 0) + r.cnt);
        }
      }
      return [...map.entries()].map(([name, cnt]) => ({ name, cnt })).sort((a, b) => b.cnt - a.cnt);
    })();

    return {
      top,
      sub,
      detail,
      total: count ?? rows.filter((r) => r.top === top).reduce((s, r) => s + r.cnt, 0),
      products: (products ?? []) as unknown as SeoProduct[],
      children,
    };
  });
