export type WeightFeeMode = 'in_price' | 'at_checkout';
export type WeightFeeScope = 'global' | 'local' | 'all';

export interface PricingSettings {
  usd_to_sar_rate: number;
  sell_markup_percent: number;
  sell_flat_add: number;
  sell_weight_rate: number;
  weight_fee_mode: WeightFeeMode;
  weight_fee_scope: WeightFeeScope;
}

export const DEFAULT_PRICING: PricingSettings = {
  usd_to_sar_rate: 3.75,
  sell_markup_percent: 0,
  sell_flat_add: 0,
  sell_weight_rate: 0,
  weight_fee_mode: 'in_price',
  weight_fee_scope: 'global',
};

export const PRICING_KEYS = [
  'usd_to_sar_rate',
  'sell_markup_percent',
  'sell_flat_add',
  'sell_weight_rate',
  'weight_fee_mode',
  'weight_fee_scope',
] as const;

export const PRICING_LABELS: Record<string, string> = {
  usd_to_sar_rate: 'USD to SAR Rate',
  sell_markup_percent: 'Selling markup %',
  sell_flat_add: 'Selling flat fee (SAR)',
  sell_weight_rate: 'Selling weight rate (SAR/kg)',
  weight_fee_mode: 'Weight fee mode',
  weight_fee_scope: 'Weight fee applies to',
};

/** Is this product inside the weight-fee scope (by product source)? */
export function weightFeeApplies(
  source: string | null | undefined,
  settings: PricingSettings
): boolean {
  const src = (source || 'local').toLowerCase();
  const scope = settings.weight_fee_scope || 'global';
  return scope === 'all' || scope === src;
}

/** Does the stored product price already include the weight charge? */
export function weightFeeInPrice(
  source: string | null | undefined,
  settings: PricingSettings
): boolean {
  return (settings.weight_fee_mode || 'in_price') === 'in_price' && weightFeeApplies(source, settings);
}

/**
 * Import Shipping Fee (SAR) charged at checkout — only when the weight charge
 * is configured to be applied at checkout and the product is in scope.
 */
export function importShippingFee(
  product: { weight_kg?: number | null; source?: string | null } | null | undefined,
  quantity: number,
  settings: PricingSettings
): number {
  if (!product) return 0;
  if ((settings.weight_fee_mode || 'in_price') !== 'at_checkout') return 0;
  if (!weightFeeApplies(product.source, settings)) return 0;
  const weight = Number(product.weight_kg) || 0;
  const qty = Number(quantity) || 0;
  return Math.round(weight * qty * (settings.sell_weight_rate || 0) * 100) / 100;
}

/** Selling price in SAR derived from the cost (buying) price in USD. */
export function computeSellingPriceSar(
  costUsd: number,
  weightKg: number,
  settings: PricingSettings,
  source?: string | null
): number {
  const rate = settings.usd_to_sar_rate || 3.75;
  const weightPart = weightFeeInPrice(source ?? 'global', settings)
    ? (Number(weightKg) || 0) * (settings.sell_weight_rate || 0)
    : 0;
  return (
    (Number(costUsd) || 0) * rate * (1 + (settings.sell_markup_percent || 0) / 100) +
    (settings.sell_flat_add || 0) +
    weightPart
  );
}

/** Same selling price expressed in USD. */
export function computeSellingPriceUsd(
  costUsd: number,
  weightKg: number,
  settings: PricingSettings,
  source?: string | null
): number {
  const rate = settings.usd_to_sar_rate || 3.75;
  return computeSellingPriceSar(costUsd, weightKg, settings, source) / rate;
}

export function parsePricingSettings(
  settingsMap: Record<string, string>
): PricingSettings {
  const mode = settingsMap['weight_fee_mode'] === 'at_checkout' ? 'at_checkout' : 'in_price';
  const rawScope = settingsMap['weight_fee_scope'];
  const scope: WeightFeeScope =
    rawScope === 'all' || rawScope === 'local' || rawScope === 'global' ? rawScope : 'global';
  return {
    usd_to_sar_rate: parseFloat(settingsMap['usd_to_sar_rate'] || '3.75') || 3.75,
    sell_markup_percent: parseFloat(settingsMap['sell_markup_percent'] || '0') || 0,
    sell_flat_add: parseFloat(settingsMap['sell_flat_add'] || '0') || 0,
    sell_weight_rate: parseFloat(settingsMap['sell_weight_rate'] || '0') || 0,
    weight_fee_mode: mode,
    weight_fee_scope: scope,
  };
}

/** Fetch pricing settings from the database. */
export async function fetchPricingSettings(
  supabase: { from: (t: string) => any }
): Promise<PricingSettings> {
  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', [...PRICING_KEYS]);
  const rawMap: Record<string, string> = {};
  (data || []).forEach((s: any) => { rawMap[s.key] = s.value; });
  return parsePricingSettings(rawMap);
}

/** Single selling price (SAR) for a product row, with legacy fallback. */
export function sellPriceSar(p: any): number {
  if (p == null) return 0;
  const v = Number(p.price_sar ?? 0);
  if (v > 0) return v;
  return Number(p.dropship_price ?? p.bulk_price ?? 0) || 0;
}

/** Single selling price (USD) for a product row, with legacy fallback. */
export function sellPriceUsd(p: any): number {
  if (p == null) return 0;
  const v = Number(p.price_usd ?? 0);
  if (v > 0) return v;
  return Number(p.dropship_price_usd ?? p.bulk_price_usd ?? 0) || 0;
}

/** Cost (buying) price in USD — admin-facing only. */
export function costUsd(p: any): number {
  if (p == null) return 0;
  const v = Number(p.cost_usd ?? 0);
  if (v > 0) return v;
  return Number(p.bulk_price_usd ?? p.dropship_price_usd ?? 0) || 0;
}
