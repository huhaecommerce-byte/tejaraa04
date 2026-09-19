import { supabase } from '@/integrations/supabase/client';

export type HeroSource =
  | 'latest'
  | 'most_viewed'
  | 'most_favourited'
  | 'top_sellers'
  | 'featured'
  | 'category'
  | 'manual';

export type HeroOrder =
  | 'newest'
  | 'random'
  | 'price_asc'
  | 'price_desc'
  | 'most_viewed'
  | 'manual';

export type HeroWindow = '7d' | '30d' | '90d' | 'all';

export interface CategoryFilters {
  top: string[];
  sub: string[];
  detailed: string[];
}

export interface HeroSettings {
  id: string;
  product_source: HeroSource;
  category_filter: string[]; // legacy
  category_filters: CategoryFilters;
  product_count: number;
  rotation_interval_ms: number;
  manual_product_ids: string[];
  time_window: HeroWindow;
  order_by: HeroOrder;
  show_out_of_stock: boolean;
  min_stock: number;
  pause_on_hover: boolean;
  show_arrows: boolean;
  show_dots: boolean;
  enabled_desktop: boolean;
  enabled_mobile: boolean;
}

const SAR_RATE_FALLBACK = 3.75;

function windowToColumn(w: HeroWindow): string {
  switch (w) {
    case '7d': return 'views_7d';
    case '30d': return 'views_30d';
    case '90d': return 'views_90d';
    default: return 'total_views';
  }
}

function windowToCutoff(w: HeroWindow): string | null {
  const now = Date.now();
  const days = w === '7d' ? 7 : w === '30d' ? 30 : w === '90d' ? 90 : null;
  if (days === null) return null;
  return new Date(now - days * 86400000).toISOString();
}

function applyCategoryFilters(query: any, filters: CategoryFilters, legacy: string[]) {
  const tops = filters?.top?.length ? filters.top : (legacy || []);
  if (tops.length) query = query.in('top_category', tops);
  if (filters?.sub?.length) query = query.in('sub_category', filters.sub);
  if (filters?.detailed?.length) query = query.in('detailed_category', filters.detailed);
  return query;
}

function applyStockFilters(query: any, settings: HeroSettings) {
  if (!settings.show_out_of_stock) {
    query = query.gt('stock_qty', Math.max(0, settings.min_stock - 1));
  } else if (settings.min_stock > 0) {
    query = query.gte('stock_qty', settings.min_stock);
  }
  return query;
}

function applyOrder(query: any, settings: HeroSettings) {
  switch (settings.order_by) {
    case 'price_asc':
      return query.order('price_sar', { ascending: true, nullsFirst: false });
    case 'price_desc':
      return query.order('price_sar', { ascending: false, nullsFirst: false });
    case 'newest':
    default:
      return query.order('created_at', { ascending: false });
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fetch hero products according to admin settings.
 * Returns up to settings.product_count products.
 */
export async function fetchHeroProducts(settings: HeroSettings): Promise<any[]> {
  const count = Math.max(1, Math.min(60, settings.product_count || 12));
  const filters = settings.category_filters || { top: [], sub: [], detailed: [] };
  const cutoff = windowToCutoff(settings.time_window);

  // ---------- Manual ----------
  if (settings.product_source === 'manual') {
    const ids = settings.manual_product_ids || [];
    if (!ids.length) return [];
    const { data } = await supabase.from('products').select('*').in('id', ids);
    if (!data) return [];
    // preserve manual order
    const map = new Map(data.map((p: any) => [p.id, p]));
    const ordered = ids.map(id => map.get(id)).filter(Boolean) as any[];
    return ordered.slice(0, count);
  }

  // ---------- Featured ----------
  if (settings.product_source === 'featured') {
    let q: any = supabase.from('products').select('*').eq('is_featured', true);
    q = applyCategoryFilters(q, filters, settings.category_filter);
    q = applyStockFilters(q, settings);
    q = applyOrder(q, settings);
    const { data } = await q.limit(count * 2);
    if (!data) return [];
    return settings.order_by === 'random' ? shuffle(data).slice(0, count) : data.slice(0, count);
  }

  // ---------- Most viewed ----------
  if (settings.product_source === 'most_viewed') {
    const col = windowToColumn(settings.time_window);
    const { data: views } = await (supabase as any)
      .from('product_view_counts')
      .select(`product_id, ${col}`)
      .order(col, { ascending: false })
      .limit(count * 4);
    const ids = (views || []).map((v: any) => v.product_id).filter(Boolean);
    if (!ids.length) return [];
    let q: any = supabase.from('products').select('*').in('id', ids);
    q = applyCategoryFilters(q, filters, settings.category_filter);
    q = applyStockFilters(q, settings);
    const { data } = await q;
    if (!data) return [];
    // preserve view-count order
    const orderMap = new Map<string, number>(ids.map((id: string, i: number) => [id, i]));
    const sorted = [...data].sort(
      (a: any, b: any) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
    );
    return sorted.slice(0, count);
  }

  // ---------- Most favourited ----------
  if (settings.product_source === 'most_favourited') {
    let favQ: any = supabase.from('favourites').select('product_id, created_at');
    if (cutoff) favQ = favQ.gte('created_at', cutoff);
    const { data: favs } = await favQ.limit(5000);
    if (!favs || !favs.length) return [];
    const counts = new Map<string, number>();
    favs.forEach((f: any) => {
      counts.set(f.product_id, (counts.get(f.product_id) || 0) + 1);
    });
    const rankedIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count * 4)
      .map(([id]) => id);
    let q: any = supabase.from('products').select('*').in('id', rankedIds);
    q = applyCategoryFilters(q, filters, settings.category_filter);
    q = applyStockFilters(q, settings);
    const { data } = await q;
    if (!data) return [];
    const sorted = [...data].sort(
      (a: any, b: any) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0)
    );
    return sorted.slice(0, count);
  }

  // ---------- Top sellers ----------
  if (settings.product_source === 'top_sellers') {
    let oQ: any = supabase
      .from('orders')
      .select('products, created_at')
      .neq('status', 'cancelled');
    if (cutoff) oQ = oQ.gte('created_at', cutoff);
    const { data: orders } = await oQ.limit(2000);
    if (!orders || !orders.length) return [];
    const counts = new Map<string, number>();
    orders.forEach((o: any) => {
      const items = Array.isArray(o.products) ? o.products : [];
      items.forEach((p: any) => {
        const id = p?.product_id || p?.id;
        const qty = Number(p?.quantity || p?.qty || 1);
        if (id) counts.set(id, (counts.get(id) || 0) + qty);
      });
    });
    const rankedIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count * 4)
      .map(([id]) => id);
    if (!rankedIds.length) return [];
    let q: any = supabase.from('products').select('*').in('id', rankedIds);
    q = applyCategoryFilters(q, filters, settings.category_filter);
    q = applyStockFilters(q, settings);
    const { data } = await q;
    if (!data) return [];
    const sorted = [...data].sort(
      (a: any, b: any) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0)
    );
    return sorted.slice(0, count);
  }

  // ---------- Category-only ----------
  if (settings.product_source === 'category') {
    let q: any = supabase.from('products').select('*');
    q = applyCategoryFilters(q, filters, settings.category_filter);
    q = applyStockFilters(q, settings);
    q = applyOrder(q, settings);
    const { data } = await q.limit(count * 3);
    if (!data) return [];
    return settings.order_by === 'random' ? shuffle(data).slice(0, count) : data.slice(0, count);
  }

  // ---------- Latest (default) ----------
  let q: any = supabase.from('products').select('*');
  q = applyCategoryFilters(q, filters, settings.category_filter);
  q = applyStockFilters(q, settings);
  q = applyOrder(q, settings);
  const { data } = await q.limit(count * 2);
  if (!data) return [];
  return settings.order_by === 'random' ? shuffle(data).slice(0, count) : data.slice(0, count);
}

export const HERO_SOURCE_LABELS: Record<HeroSource, string> = {
  latest: 'Latest products',
  most_viewed: 'Most viewed',
  most_favourited: 'Most favourited',
  top_sellers: 'Top sellers',
  featured: 'Featured (hand-picked)',
  category: 'Filter by categories',
  manual: 'Pick manually',
};

export const HERO_ORDER_LABELS: Record<HeroOrder, string> = {
  newest: 'Newest first',
  random: 'Random shuffle',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  most_viewed: 'Most viewed',
  manual: 'Manual order',
};

export const HERO_WINDOW_LABELS: Record<HeroWindow, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

export { SAR_RATE_FALLBACK };
