import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VAT_RATE } from '@/lib/retailPricing';
import {
  DEFAULT_PRICING,
  fetchPricingSettings,
  importShippingFee,
  type PricingSettings,
} from '@/lib/priceConversion';

export interface ShippingSettings {
  flatSar: number;
  freeOverSar: number;
}

export const DEFAULT_SHIPPING: ShippingSettings = { flatSar: 25, freeOverSar: 500 };

export function useShippingSettings(): ShippingSettings {
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING);
  useEffect(() => {
    supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['retail_shipping_flat_sar', 'retail_free_shipping_over_sar'])
      .then(({ data }) => {
        if (!data?.length) return;
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setSettings({
          flatSar: Number(map['retail_shipping_flat_sar'] ?? DEFAULT_SHIPPING.flatSar) || 0,
          freeOverSar:
            Number(map['retail_free_shipping_over_sar'] ?? DEFAULT_SHIPPING.freeOverSar) || 0,
        });
      });
  }, []);
  return settings;
}

/** Pricing formula settings (markup, weight rate, weight-fee mode/scope). */
export function usePricingSettings(): PricingSettings {
  const [settings, setSettings] = useState<PricingSettings>(DEFAULT_PRICING);
  useEffect(() => {
    fetchPricingSettings(supabase as any).then(setSettings).catch(() => {});
  }, []);
  return settings;
}

/**
 * Import Shipping Fee for a whole cart — the same weight formula used on the
 * dashboard Place Order page (weight × qty × SAR/kg, in-scope products only).
 */
export function cartImportShippingFee(
  items: { source?: string | null; weightKg?: number | null; qty: number }[],
  pricing: PricingSettings,
): number {
  const total = items.reduce(
    (sum, i) =>
      sum + importShippingFee({ weight_kg: i.weightKg ?? 0, source: i.source }, i.qty, pricing),
    0,
  );
  return Math.round(total * 100) / 100;
}

/** Total billable shipment weight in kg (min 0.1 kg, same floor as Place Order). */
export function cartWeightKg(items: { weightKg?: number | null; qty: number }[]): number {
  const raw = items.reduce((w, i) => w + (Number(i.weightKg) || 0.5) * i.qty, 0);
  return Math.max(0.1, Math.round(raw * 1000) / 1000);
}

export function orderTotals(
  subtotal: number,
  shippingSettings: ShippingSettings,
  opts: { shippingOverride?: number | null; importFee?: number } = {},
) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const importFee = round(opts.importFee || 0);
  const baseShipping =
    subtotal <= 0 || (shippingSettings.freeOverSar > 0 && subtotal >= shippingSettings.freeOverSar)
      ? 0
      : shippingSettings.flatSar;
  const shipping =
    opts.shippingOverride != null && opts.shippingOverride >= 0
      ? round(opts.shippingOverride)
      : baseShipping;
  const vat = round((subtotal + shipping + importFee) * VAT_RATE);
  return {
    subtotal: round(subtotal),
    shipping: round(shipping),
    importFee,
    vat,
    total: round(subtotal + shipping + importFee + vat),
  };
}
