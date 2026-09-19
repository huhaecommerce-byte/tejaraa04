/**
 * Retail vs bulk pricing for the public storefront.
 *
 * A single unit is sold at the normal selling price. Larger quantities get an
 * automatic discount from configurable tiers (Admin → Settings → Pricing).
 */

export interface BulkTier {
  minQty: number;
  offPercent: number;
}

export const DEFAULT_BULK_TIERS: BulkTier[] = [
  { minQty: 10, offPercent: 5 },
  { minQty: 50, offPercent: 10 },
  { minQty: 100, offPercent: 15 },
];

export const BULK_TIER_KEYS = [
  'retail_tier_enabled',
  'retail_tier_qty_1',
  'retail_tier_off_1',
  'retail_tier_qty_2',
  'retail_tier_off_2',
  'retail_tier_qty_3',
  'retail_tier_off_3',
] as const;

/** Bulk tiers are shown/applied only when the admin enables them. */
export function bulkTiersEnabled(map: Record<string, string>): boolean {
  const v = (map['retail_tier_enabled'] ?? 'true').toLowerCase();
  return v !== 'false' && v !== 'no' && v !== '0' && v !== 'off';
}

export function parseBulkTiers(map: Record<string, string>): BulkTier[] {
  if (!bulkTiersEnabled(map)) return [];
  const tiers: BulkTier[] = [];
  for (let i = 1; i <= 3; i++) {
    const qty = Number(map[`retail_tier_qty_${i}`]);
    const off = Number(map[`retail_tier_off_${i}`]);
    if (Number.isFinite(qty) && qty > 1 && Number.isFinite(off) && off > 0) {
      tiers.push({ minQty: Math.round(qty), offPercent: off });
    }
  }
  const list = tiers.length ? tiers : DEFAULT_BULK_TIERS;
  return [...list].sort((a, b) => a.minQty - b.minQty);
}

/** Discount percent that applies to this quantity. */
export function tierDiscountPercent(qty: number, tiers: BulkTier[]): number {
  let off = 0;
  for (const t of tiers) if (qty >= t.minQty) off = t.offPercent;
  return off;
}

/** Unit price in SAR after any quantity discount. */
export function unitPriceForQty(basePriceSar: number, qty: number, tiers: BulkTier[]): number {
  const off = tierDiscountPercent(qty, tiers);
  return Math.round(basePriceSar * (1 - off / 100) * 100) / 100;
}

export const VAT_RATE = 0.15;

export function money(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
