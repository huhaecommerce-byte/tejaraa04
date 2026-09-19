/**
 * Public Seller Services content.
 * Content only — no business logic. Keep every claim factual and tied to a
 * service Tejaraa actually operates today.
 */
import {
  Boxes, Building2, ClipboardCheck, Globe2, Handshake, Layers, LineChart,
  MapPin, Package, PackageSearch, Plug, Rocket, Search, ShoppingBag,
  Sparkles, Store, Tags, Truck, Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '@/i18n/dictionary';

export interface SellerService {
  id: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  textKey: TranslationKey;
  /** Destination: a public service page where one exists, otherwise an in-page anchor. */
  href: string;
}

const serviceIds = [
  ['product-hunting', Search, '/selling/product-hunting'],
  ['product-sourcing', Globe2, '/selling/product-sourcing'],
  ['dropshipping', Package, '/selling/dropshipping'],
  ['fulfillment', Truck, '/selling/fulfillment'],
  ['warehousing', Warehouse, '/selling/warehousing'],
  ['packaging', Tags, '/selling/packaging-labeling'],
  ['marketplace-prep', ClipboardCheck, '/selling/marketplace-preparation'],
  ['integrations', Plug, '/selling/integrations'],
] as const;

export const sellerServices: SellerService[] = serviceIds.map(([id, icon, href]) => ({
  id,
  icon,
  titleKey: `selling.services.${id}.title` as TranslationKey,
  textKey: `selling.services.${id}.text` as TranslationKey,
  href,
}));

export interface SellerProcessStep {
  id: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

export const sellerProcess: SellerProcessStep[] = [Search, PackageSearch, Store, ShoppingBag, Truck].map(
  (icon, i) => ({
    id: `step-${i + 1}`,
    icon,
    titleKey: `selling.process.${i + 1}.title` as TranslationKey,
    textKey: `selling.process.${i + 1}.text` as TranslationKey,
  }),
);

export interface SellerBenefit {
  id: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

export const sellerBenefits: SellerBenefit[] = [Layers, Handshake, Sparkles, ClipboardCheck, MapPin, LineChart].map(
  (icon, i) => ({
    id: `benefit-${i + 1}`,
    icon,
    titleKey: `selling.benefits.${i + 1}.title` as TranslationKey,
    textKey: `selling.benefits.${i + 1}.text` as TranslationKey,
  }),
);

export interface SellerAudience {
  id: string;
  /** Service page this seller type should start on. */
  to: string;
  linkKey: TranslationKey;
  icon: LucideIcon;
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

export const sellerAudiences: SellerAudience[] = (
  [
    [Rocket, '/selling/product-hunting'],
    [Store, '/selling/integrations'],
    [ShoppingBag, '/selling/marketplace-preparation'],
    [Building2, '/selling/warehousing'],
  ] as const
).map(([icon, to], i) => ({
  id: `audience-${i + 1}`,
  icon,
  to,
  titleKey: `selling.audience.${i + 1}.title` as TranslationKey,
  textKey: `selling.audience.${i + 1}.text` as TranslationKey,
  linkKey: `selling.audience.${i + 1}.link` as TranslationKey,
}));

export interface SellerModel {
  id: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  bestKey: TranslationKey;
  pointKeys: TranslationKey[];
  /** Service page for this model. */
  to: string;
}

export const sellerModels: SellerModel[] = (
  [
    ['dropshipping', Package, '/selling/dropshipping'],
    ['sourcing', Globe2, '/selling/product-sourcing'],
    ['fulfilment', Warehouse, '/selling/fulfillment'],
  ] as const
).map(([id, icon, to]) => ({
  id,
  icon,
  to,
  titleKey: `selling.models.${id}.title` as TranslationKey,
  bestKey: `selling.models.${id}.best` as TranslationKey,
  pointKeys: [1, 2, 3].map((n) => `selling.models.${id}.p${n}` as TranslationKey),
}));

export interface SellerChannel {
  icon: LucideIcon;
  label: string;
  labelKey?: TranslationKey;
  noteKey: TranslationKey;
}

/** Channels sellers can register on their Tejaraa account today. */
export const sellerChannels: SellerChannel[] = [
  { icon: ShoppingBag, label: 'Shopify', noteKey: 'selling.channels.store' },
  { icon: Globe2, label: 'WooCommerce', noteKey: 'selling.channels.store' },
  { icon: Package, label: 'Amazon Seller', noteKey: 'selling.channels.marketplace' },
  { icon: Store, label: 'Noon Seller', noteKey: 'selling.channels.marketplace' },
  { icon: Boxes, label: 'Other channels', labelKey: 'selling.channels.other', noteKey: 'selling.channels.manual' },
];

export interface SellerFaq {
  qKey: TranslationKey;
  aKey: TranslationKey;
}

export const sellerFaqs: SellerFaq[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  qKey: `selling.faq.${n}.q` as TranslationKey,
  aKey: `selling.faq.${n}.a` as TranslationKey,
}));
