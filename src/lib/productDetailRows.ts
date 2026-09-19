import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Which rows appear in the "product details" list on the product page,
 * their labels and their fallback value. Managed in Admin → Settings → Storefront.
 */
export const PRODUCT_DETAIL_ROWS_KEY = 'product_detail_rows';

export type ProductDetailRowKey =
  | 'sku'
  | 'category'
  | 'moq'
  | 'weight'
  | 'stock'
  | 'delivery'
  | 'labelling';

export type ProductDetailRowConfig = {
  key: ProductDetailRowKey;
  label: string;
  enabled: boolean;
  /** Shown when the product has no value for this row. */
  fallback: string;
};

export const DEFAULT_PRODUCT_DETAIL_ROWS: ProductDetailRowConfig[] = [
  { key: 'sku', label: 'SKU', enabled: true, fallback: '—' },
  { key: 'category', label: 'Category', enabled: true, fallback: '—' },
  { key: 'moq', label: 'MOQ', enabled: true, fallback: '1 pc' },
  { key: 'weight', label: 'Weight', enabled: true, fallback: '—' },
  { key: 'stock', label: 'Stock', enabled: true, fallback: 'Made to order' },
  { key: 'delivery', label: 'Delivery', enabled: true, fallback: '7–10 days import' },
  { key: 'labelling', label: 'Labelling', enabled: true, fallback: 'Available' },
];

export function parseProductDetailRows(raw: unknown): ProductDetailRowConfig[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return DEFAULT_PRODUCT_DETAIL_ROWS;
    return DEFAULT_PRODUCT_DETAIL_ROWS.map((def) => {
      const found = parsed.find((r: any) => r && r.key === def.key);
      if (!found) return def;
      return {
        key: def.key,
        label: typeof found.label === 'string' && found.label.trim() ? found.label : def.label,
        enabled: found.enabled !== false,
        fallback:
          typeof found.fallback === 'string' && found.fallback.trim() ? found.fallback : def.fallback,
      };
    });
  } catch {
    return DEFAULT_PRODUCT_DETAIL_ROWS;
  }
}

let cached: ProductDetailRowConfig[] | null = null;
let inflight: Promise<ProductDetailRowConfig[]> | null = null;

async function load(): Promise<ProductDetailRowConfig[]> {
  if (cached) return cached;
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', PRODUCT_DETAIL_ROWS_KEY)
          .maybeSingle();
        cached = parseProductDetailRows((data as any)?.value);
      } catch {
        cached = DEFAULT_PRODUCT_DETAIL_ROWS;
      }
      return cached;
    })();
  }
  return inflight;
}

export function useProductDetailRows(): ProductDetailRowConfig[] {
  const [rows, setRows] = useState<ProductDetailRowConfig[]>(cached ?? DEFAULT_PRODUCT_DETAIL_ROWS);
  useEffect(() => {
    let alive = true;
    load().then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, []);
  return rows;
}
