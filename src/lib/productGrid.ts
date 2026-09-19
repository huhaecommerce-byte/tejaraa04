import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * How many product cards fit in one row, per screen size.
 * Managed in Admin → Settings → Storefront.
 */
export interface ProductGridCols {
  mobile: number;
  tablet: number;
  desktop: number;
}

export const DEFAULT_PRODUCT_GRID: ProductGridCols = { mobile: 2, tablet: 3, desktop: 5 };

export const PRODUCT_GRID_KEYS = [
  'products_per_row_mobile',
  'products_per_row_tablet',
  'products_per_row_desktop',
] as const;

let cached: ProductGridCols | null = null;
let inflight: Promise<ProductGridCols> | null = null;

function clamp(v: unknown, fallback: number, max: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= max ? Math.round(n) : fallback;
}

async function load(): Promise<ProductGridCols> {
  if (cached) return cached;
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', PRODUCT_GRID_KEYS as unknown as string[]);
        const map: Record<string, string> = {};
        (data ?? []).forEach((r: any) => {
          map[r.key] = r.value;
        });
        cached = {
          mobile: clamp(map['products_per_row_mobile'], DEFAULT_PRODUCT_GRID.mobile, 4),
          tablet: clamp(map['products_per_row_tablet'], DEFAULT_PRODUCT_GRID.tablet, 8),
          desktop: clamp(map['products_per_row_desktop'], DEFAULT_PRODUCT_GRID.desktop, 10),
        };
      } catch {
        cached = DEFAULT_PRODUCT_GRID;
      }
      return cached;
    })();
  }
  return inflight;
}

/** Style object driving the `.product-grid` responsive columns. */
export function useProductGridStyle(): CSSProperties {
  const [cols, setCols] = useState<ProductGridCols>(cached ?? DEFAULT_PRODUCT_GRID);
  useEffect(() => {
    let alive = true;
    load().then((c) => {
      if (alive) setCols(c);
    });
    return () => {
      alive = false;
    };
  }, []);
  return {
    ['--pg-mobile' as any]: cols.mobile,
    ['--pg-tablet' as any]: cols.tablet,
    ['--pg-desktop' as any]: cols.desktop,
  } as CSSProperties;
}

/** Applies the admin-configured columns as CSS variables on <html>. */
export function useApplyProductGridVars(): void {
  useEffect(() => {
    let alive = true;
    load().then((c) => {
      if (!alive || typeof document === 'undefined') return;
      const root = document.documentElement;
      root.style.setProperty('--pg-mobile', String(c.mobile));
      root.style.setProperty('--pg-tablet', String(c.tablet));
      root.style.setProperty('--pg-desktop', String(c.desktop));
    });
    return () => {
      alive = false;
    };
  }, []);
}
