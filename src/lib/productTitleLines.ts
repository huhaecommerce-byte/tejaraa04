import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * How many lines of a product name to show on product tiles.
 * 0 means "show the full name" (no trimming). Managed in Admin → Settings.
 */
export const PRODUCT_TITLE_LINES_KEY = 'product_title_lines';
export const DEFAULT_PRODUCT_TITLE_LINES = 3;

let cached: number | null = null;
let inflight: Promise<number> | null = null;

async function load(): Promise<number> {
  if (cached !== null) return cached;
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', PRODUCT_TITLE_LINES_KEY)
          .maybeSingle();
        const n = Number((data as any)?.value);
        cached =
          Number.isFinite(n) && n >= 0 && n <= 10 ? Math.round(n) : DEFAULT_PRODUCT_TITLE_LINES;
      } catch {
        cached = DEFAULT_PRODUCT_TITLE_LINES;
      }
      return cached;
    })();
  }
  return inflight;
}


export function useProductTitleLines(): number {
  const [lines, setLines] = useState<number>(cached ?? DEFAULT_PRODUCT_TITLE_LINES);
  useEffect(() => {
    let alive = true;
    load().then((n) => {
      if (alive) setLines(n);
    });
    return () => {
      alive = false;
    };
  }, []);
  return lines;
}

/** Inline style that clamps to `lines` rows, or shows the whole name when 0. */
export function titleClampStyle(lines: number): React.CSSProperties {
  if (!lines || lines <= 0) return { overflowWrap: 'anywhere' };
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  } as React.CSSProperties;
}
