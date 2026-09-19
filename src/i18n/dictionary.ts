/**
 * Central UI string dictionary for Tejaraa.
 *
 * Strings live in per-section files under `src/i18n/dict/` so different parts
 * of the site can be translated independently:
 *  - `core`     shared chrome (header, footer, nav) + shop homepage
 *  - `shop`     shop storefront flows (catalog, cart, checkout, account, auth)
 *  - `selling`  Dropshipping & Selling pages and portal
 *  - `agency`   Agencies & VAs pages and portal
 *  - `supplier` Wholesalers & Suppliers pages and portal
 *
 * English is the source of truth; every key SHOULD have an Arabic counterpart —
 * missing Arabic falls back to English at runtime.
 */
import { en as coreEn, ar as coreAr } from './dict/core';
import { en as shopEn, ar as shopAr } from './dict/shop';
import { en as sellingEn, ar as sellingAr } from './dict/selling';
import { en as agencyEn, ar as agencyAr } from './dict/agency';
import { en as supplierEn, ar as supplierAr } from './dict/supplier';

export type Locale = 'en' | 'ar';

export const en = {
  ...coreEn,
  ...shopEn,
  ...sellingEn,
  ...agencyEn,
  ...supplierEn,
};

export type TranslationKey = keyof typeof en;

export const ar: Partial<Record<TranslationKey, string>> = {
  ...coreAr,
  ...shopAr,
  ...sellingAr,
  ...agencyAr,
  ...supplierAr,
};

export const dictionaries: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en,
  ar,
};
