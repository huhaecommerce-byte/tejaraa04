/**
 * Public Seller Services detail pages (Phase 2).
 * Content configuration only — shared presentation components render it.
 * Every claim here must match a service Tejaraa actually operates. No pricing
 * plans, no automation promises, no guaranteed outcomes.
 */
import {
  Boxes, Building2, ClipboardCheck, Globe2, Layers, MapPin, Package, PackageSearch,
  Rocket, ScanBarcode, Search, ShoppingBag, Store, Tags, Truck, Warehouse,
  Handshake, ListChecks, SlidersHorizontal, Languages, LineChart, Plug,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '@/i18n/dictionary';

export interface IconItem {
  icon?: LucideIcon;
  title: TranslationKey;
  text: TranslationKey;
}

export interface ProcessStep {
  title: TranslationKey;
  text: TranslationKey;
}

export interface FaqItem {
  q: TranslationKey;
  a: TranslationKey;
}

export interface ServicePageConfig {
  slug: string;
  path: string;
  navLabel: TranslationKey;
  icon: LucideIcon;
  seo: { title: TranslationKey; description: TranslationKey };
  hero: { title: TranslationKey; lead: TranslationKey; tags: TranslationKey[] };
  overview: { title: TranslationKey; paragraphs: TranslationKey[] };
  audience: { title: TranslationKey; items: IconItem[] };
  process: { title: TranslationKey; note?: TranslationKey; steps: ProcessStep[] };
  split?: { title: TranslationKey; tejaraa: TranslationKey[]; you: TranslationKey[] };
  benefits: { title: TranslationKey; items: IconItem[] };
  requirements?: { title: TranslationKey; intro?: TranslationKey; items: TranslationKey[]; note?: TranslationKey };
  related: string[];
  faqs: FaqItem[];
  cta: { title: TranslationKey; text: TranslationKey; primaryLabel: TranslationKey; secondaryLabel: TranslationKey };
}

function sharedFaq(key: 'faqStart' | 'faqPricing' | 'faqRegion'): FaqItem {
  return { q: `selling.svc.shared.${key}.q` as TranslationKey, a: `selling.svc.shared.${key}.a` as TranslationKey };
}

export const servicePages: ServicePageConfig[] = [
  {
    slug: 'product-hunting',
    path: '/selling/product-hunting',
    navLabel: 'selling.svc.product-hunting.nav',
    icon: Search,
    seo: { title: 'selling.svc.product-hunting.seoTitle', description: 'selling.svc.product-hunting.seoDesc' },
    hero: { title: 'selling.svc.product-hunting.heroTitle', lead: 'selling.svc.product-hunting.heroLead', tags: ['selling.svc.product-hunting.tag.0', 'selling.svc.product-hunting.tag.1', 'selling.svc.product-hunting.tag.2'] },
    overview: { title: 'selling.svc.product-hunting.ovTitle', paragraphs: ['selling.svc.product-hunting.ovP.0', 'selling.svc.product-hunting.ovP.1'] },
    audience: { title: 'selling.svc.product-hunting.audTitle', items: [{ icon: Rocket, title: 'selling.svc.product-hunting.aud.0.title', text: 'selling.svc.product-hunting.aud.0.text' }, { icon: Store, title: 'selling.svc.product-hunting.aud.1.title', text: 'selling.svc.product-hunting.aud.1.text' }, { icon: ShoppingBag, title: 'selling.svc.product-hunting.aud.2.title', text: 'selling.svc.product-hunting.aud.2.text' }, { icon: Layers, title: 'selling.svc.product-hunting.aud.3.title', text: 'selling.svc.product-hunting.aud.3.text' }] },
    process: { title: 'selling.svc.product-hunting.procTitle', note: 'selling.svc.product-hunting.procNote', steps: [{ title: 'selling.svc.product-hunting.proc.0.title', text: 'selling.svc.product-hunting.proc.0.text' }, { title: 'selling.svc.product-hunting.proc.1.title', text: 'selling.svc.product-hunting.proc.1.text' }, { title: 'selling.svc.product-hunting.proc.2.title', text: 'selling.svc.product-hunting.proc.2.text' }, { title: 'selling.svc.product-hunting.proc.3.title', text: 'selling.svc.product-hunting.proc.3.text' }, { title: 'selling.svc.product-hunting.proc.4.title', text: 'selling.svc.product-hunting.proc.4.text' }] },
    split: { title: 'selling.svc.product-hunting.splitTitle', tejaraa: ['selling.svc.product-hunting.splitTejaraa.0', 'selling.svc.product-hunting.splitTejaraa.1', 'selling.svc.product-hunting.splitTejaraa.2', 'selling.svc.product-hunting.splitTejaraa.3'], you: ['selling.svc.product-hunting.splitYou.0', 'selling.svc.product-hunting.splitYou.1', 'selling.svc.product-hunting.splitYou.2', 'selling.svc.product-hunting.splitYou.3'] },
    benefits: { title: 'selling.svc.product-hunting.benTitle', items: [{ icon: ListChecks, title: 'selling.svc.product-hunting.ben.0.title', text: 'selling.svc.product-hunting.ben.0.text' }, { icon: Handshake, title: 'selling.svc.product-hunting.ben.1.title', text: 'selling.svc.product-hunting.ben.1.text' }, { icon: MapPin, title: 'selling.svc.product-hunting.ben.2.title', text: 'selling.svc.product-hunting.ben.2.text' }] },
    requirements: { title: 'selling.svc.product-hunting.reqTitle', intro: 'selling.svc.product-hunting.reqIntro', items: ['selling.svc.product-hunting.reqItems.0', 'selling.svc.product-hunting.reqItems.1', 'selling.svc.product-hunting.reqItems.2', 'selling.svc.product-hunting.reqItems.3'] },
    related: ['product-sourcing', 'dropshipping'],
    faqs: [{ q: 'selling.svc.product-hunting.faq.0.q', a: 'selling.svc.product-hunting.faq.0.a' }, { q: 'selling.svc.product-hunting.faq.1.q', a: 'selling.svc.product-hunting.faq.1.a' }, { q: 'selling.svc.product-hunting.faq.2.q', a: 'selling.svc.product-hunting.faq.2.a' }, sharedFaq("faqPricing"), sharedFaq("faqStart")],
    cta: { title: 'selling.svc.product-hunting.ctaTitle', text: 'selling.svc.product-hunting.ctaText', primaryLabel: 'selling.svc.product-hunting.ctaPrimary', secondaryLabel: 'selling.svc.product-hunting.ctaSecondary' },
  },
  {
    slug: 'product-sourcing',
    path: '/selling/product-sourcing',
    navLabel: 'selling.svc.product-sourcing.nav',
    icon: Globe2,
    seo: { title: 'selling.svc.product-sourcing.seoTitle', description: 'selling.svc.product-sourcing.seoDesc' },
    hero: { title: 'selling.svc.product-sourcing.heroTitle', lead: 'selling.svc.product-sourcing.heroLead', tags: ['selling.svc.product-sourcing.tag.0', 'selling.svc.product-sourcing.tag.1', 'selling.svc.product-sourcing.tag.2'] },
    overview: { title: 'selling.svc.product-sourcing.ovTitle', paragraphs: ['selling.svc.product-sourcing.ovP.0', 'selling.svc.product-sourcing.ovP.1'] },
    audience: { title: 'selling.svc.product-sourcing.audTitle', items: [{ icon: ShoppingBag, title: 'selling.svc.product-sourcing.aud.0.title', text: 'selling.svc.product-sourcing.aud.0.text' }, { icon: Store, title: 'selling.svc.product-sourcing.aud.1.title', text: 'selling.svc.product-sourcing.aud.1.text' }, { icon: Building2, title: 'selling.svc.product-sourcing.aud.2.title', text: 'selling.svc.product-sourcing.aud.2.text' }, { icon: Layers, title: 'selling.svc.product-sourcing.aud.3.title', text: 'selling.svc.product-sourcing.aud.3.text' }] },
    process: { title: 'selling.svc.product-sourcing.procTitle', steps: [{ title: 'selling.svc.product-sourcing.proc.0.title', text: 'selling.svc.product-sourcing.proc.0.text' }, { title: 'selling.svc.product-sourcing.proc.1.title', text: 'selling.svc.product-sourcing.proc.1.text' }, { title: 'selling.svc.product-sourcing.proc.2.title', text: 'selling.svc.product-sourcing.proc.2.text' }, { title: 'selling.svc.product-sourcing.proc.3.title', text: 'selling.svc.product-sourcing.proc.3.text' }, { title: 'selling.svc.product-sourcing.proc.4.title', text: 'selling.svc.product-sourcing.proc.4.text' }] },
    benefits: { title: 'selling.svc.product-sourcing.benTitle', items: [{ icon: Handshake, title: 'selling.svc.product-sourcing.ben.0.title', text: 'selling.svc.product-sourcing.ben.0.text' }, { icon: Globe2, title: 'selling.svc.product-sourcing.ben.1.title', text: 'selling.svc.product-sourcing.ben.1.text' }, { icon: Warehouse, title: 'selling.svc.product-sourcing.ben.2.title', text: 'selling.svc.product-sourcing.ben.2.text' }] },
    requirements: { title: 'selling.svc.product-sourcing.reqTitle', items: ['selling.svc.product-sourcing.reqItems.0', 'selling.svc.product-sourcing.reqItems.1', 'selling.svc.product-sourcing.reqItems.2', 'selling.svc.product-sourcing.reqItems.3'], note: 'selling.svc.product-sourcing.reqNote' },
    related: ['product-hunting', 'warehousing', 'fulfillment'],
    faqs: [{ q: 'selling.svc.product-sourcing.faq.0.q', a: 'selling.svc.product-sourcing.faq.0.a' }, { q: 'selling.svc.product-sourcing.faq.1.q', a: 'selling.svc.product-sourcing.faq.1.a' }, { q: 'selling.svc.product-sourcing.faq.2.q', a: 'selling.svc.product-sourcing.faq.2.a' }, { q: 'selling.svc.product-sourcing.faq.3.q', a: 'selling.svc.product-sourcing.faq.3.a' }, sharedFaq("faqPricing"), sharedFaq("faqStart")],
    cta: { title: 'selling.svc.product-sourcing.ctaTitle', text: 'selling.svc.product-sourcing.ctaText', primaryLabel: 'selling.svc.product-sourcing.ctaPrimary', secondaryLabel: 'selling.svc.product-sourcing.ctaSecondary' },
  },
  {
    slug: 'dropshipping',
    path: '/selling/dropshipping',
    navLabel: 'selling.svc.dropshipping.nav',
    icon: Package,
    seo: { title: 'selling.svc.dropshipping.seoTitle', description: 'selling.svc.dropshipping.seoDesc' },
    hero: { title: 'selling.svc.dropshipping.heroTitle', lead: 'selling.svc.dropshipping.heroLead', tags: ['selling.svc.dropshipping.tag.0', 'selling.svc.dropshipping.tag.1', 'selling.svc.dropshipping.tag.2'] },
    overview: { title: 'selling.svc.dropshipping.ovTitle', paragraphs: ['selling.svc.dropshipping.ovP.0', 'selling.svc.dropshipping.ovP.1'] },
    audience: { title: 'selling.svc.dropshipping.audTitle', items: [{ icon: Rocket, title: 'selling.svc.dropshipping.aud.0.title', text: 'selling.svc.dropshipping.aud.0.text' }, { icon: Store, title: 'selling.svc.dropshipping.aud.1.title', text: 'selling.svc.dropshipping.aud.1.text' }, { icon: ShoppingBag, title: 'selling.svc.dropshipping.aud.2.title', text: 'selling.svc.dropshipping.aud.2.text' }, { icon: LineChart, title: 'selling.svc.dropshipping.aud.3.title', text: 'selling.svc.dropshipping.aud.3.text' }] },
    process: { title: 'selling.svc.dropshipping.procTitle', note: 'selling.svc.dropshipping.procNote', steps: [{ title: 'selling.svc.dropshipping.proc.0.title', text: 'selling.svc.dropshipping.proc.0.text' }, { title: 'selling.svc.dropshipping.proc.1.title', text: 'selling.svc.dropshipping.proc.1.text' }, { title: 'selling.svc.dropshipping.proc.2.title', text: 'selling.svc.dropshipping.proc.2.text' }, { title: 'selling.svc.dropshipping.proc.3.title', text: 'selling.svc.dropshipping.proc.3.text' }, { title: 'selling.svc.dropshipping.proc.4.title', text: 'selling.svc.dropshipping.proc.4.text' }, { title: 'selling.svc.dropshipping.proc.5.title', text: 'selling.svc.dropshipping.proc.5.text' }] },
    split: { title: 'selling.svc.dropshipping.splitTitle', tejaraa: ['selling.svc.dropshipping.splitTejaraa.0', 'selling.svc.dropshipping.splitTejaraa.1', 'selling.svc.dropshipping.splitTejaraa.2', 'selling.svc.dropshipping.splitTejaraa.3'], you: ['selling.svc.dropshipping.splitYou.0', 'selling.svc.dropshipping.splitYou.1', 'selling.svc.dropshipping.splitYou.2', 'selling.svc.dropshipping.splitYou.3'] },
    benefits: { title: 'selling.svc.dropshipping.benTitle', items: [{ icon: Package, title: 'selling.svc.dropshipping.ben.0.title', text: 'selling.svc.dropshipping.ben.0.text' }, { icon: SlidersHorizontal, title: 'selling.svc.dropshipping.ben.1.title', text: 'selling.svc.dropshipping.ben.1.text' }, { icon: Truck, title: 'selling.svc.dropshipping.ben.2.title', text: 'selling.svc.dropshipping.ben.2.text' }] },
    requirements: { title: 'selling.svc.dropshipping.reqTitle', items: ['selling.svc.dropshipping.reqItems.0', 'selling.svc.dropshipping.reqItems.1', 'selling.svc.dropshipping.reqItems.2', 'selling.svc.dropshipping.reqItems.3'] },
    related: ['product-sourcing', 'integrations', 'fulfillment'],
    faqs: [{ q: 'selling.svc.dropshipping.faq.0.q', a: 'selling.svc.dropshipping.faq.0.a' }, { q: 'selling.svc.dropshipping.faq.1.q', a: 'selling.svc.dropshipping.faq.1.a' }, { q: 'selling.svc.dropshipping.faq.2.q', a: 'selling.svc.dropshipping.faq.2.a' }, { q: 'selling.svc.dropshipping.faq.3.q', a: 'selling.svc.dropshipping.faq.3.a' }, { q: 'selling.svc.dropshipping.faq.4.q', a: 'selling.svc.dropshipping.faq.4.a' }, sharedFaq("faqPricing"), sharedFaq("faqStart")],
    cta: { title: 'selling.svc.dropshipping.ctaTitle', text: 'selling.svc.dropshipping.ctaText', primaryLabel: 'selling.svc.dropshipping.ctaPrimary', secondaryLabel: 'selling.svc.dropshipping.ctaSecondary' },
  },
  {
    slug: 'fulfillment',
    path: '/selling/fulfillment',
    navLabel: 'selling.svc.fulfillment.nav',
    icon: Truck,
    seo: { title: 'selling.svc.fulfillment.seoTitle', description: 'selling.svc.fulfillment.seoDesc' },
    hero: { title: 'selling.svc.fulfillment.heroTitle', lead: 'selling.svc.fulfillment.heroLead', tags: ['selling.svc.fulfillment.tag.0', 'selling.svc.fulfillment.tag.1', 'selling.svc.fulfillment.tag.2'] },
    overview: { title: 'selling.svc.fulfillment.ovTitle', paragraphs: ['selling.svc.fulfillment.ovP.0', 'selling.svc.fulfillment.ovP.1'] },
    audience: { title: 'selling.svc.fulfillment.audTitle', items: [{ icon: Store, title: 'selling.svc.fulfillment.aud.0.title', text: 'selling.svc.fulfillment.aud.0.text' }, { icon: ShoppingBag, title: 'selling.svc.fulfillment.aud.1.title', text: 'selling.svc.fulfillment.aud.1.text' }, { icon: Building2, title: 'selling.svc.fulfillment.aud.2.title', text: 'selling.svc.fulfillment.aud.2.text' }, { icon: Boxes, title: 'selling.svc.fulfillment.aud.3.title', text: 'selling.svc.fulfillment.aud.3.text' }] },
    process: { title: 'selling.svc.fulfillment.procTitle', steps: [{ title: 'selling.svc.fulfillment.proc.0.title', text: 'selling.svc.fulfillment.proc.0.text' }, { title: 'selling.svc.fulfillment.proc.1.title', text: 'selling.svc.fulfillment.proc.1.text' }, { title: 'selling.svc.fulfillment.proc.2.title', text: 'selling.svc.fulfillment.proc.2.text' }, { title: 'selling.svc.fulfillment.proc.3.title', text: 'selling.svc.fulfillment.proc.3.text' }, { title: 'selling.svc.fulfillment.proc.4.title', text: 'selling.svc.fulfillment.proc.4.text' }] },
    split: { title: 'selling.svc.fulfillment.splitTitle', tejaraa: ['selling.svc.fulfillment.splitTejaraa.0', 'selling.svc.fulfillment.splitTejaraa.1', 'selling.svc.fulfillment.splitTejaraa.2', 'selling.svc.fulfillment.splitTejaraa.3'], you: ['selling.svc.fulfillment.splitYou.0', 'selling.svc.fulfillment.splitYou.1', 'selling.svc.fulfillment.splitYou.2', 'selling.svc.fulfillment.splitYou.3'] },
    benefits: { title: 'selling.svc.fulfillment.benTitle', items: [{ icon: ClipboardCheck, title: 'selling.svc.fulfillment.ben.0.title', text: 'selling.svc.fulfillment.ben.0.text' }, { icon: MapPin, title: 'selling.svc.fulfillment.ben.1.title', text: 'selling.svc.fulfillment.ben.1.text' }, { icon: Layers, title: 'selling.svc.fulfillment.ben.2.title', text: 'selling.svc.fulfillment.ben.2.text' }] },
    requirements: { title: 'selling.svc.fulfillment.reqTitle', items: ['selling.svc.fulfillment.reqItems.0', 'selling.svc.fulfillment.reqItems.1', 'selling.svc.fulfillment.reqItems.2', 'selling.svc.fulfillment.reqItems.3'] },
    related: ['warehousing', 'packaging-labeling', 'marketplace-preparation'],
    faqs: [{ q: 'selling.svc.fulfillment.faq.0.q', a: 'selling.svc.fulfillment.faq.0.a' }, { q: 'selling.svc.fulfillment.faq.1.q', a: 'selling.svc.fulfillment.faq.1.a' }, { q: 'selling.svc.fulfillment.faq.2.q', a: 'selling.svc.fulfillment.faq.2.a' }, { q: 'selling.svc.fulfillment.faq.3.q', a: 'selling.svc.fulfillment.faq.3.a' }, sharedFaq("faqPricing"), sharedFaq("faqRegion")],
    cta: { title: 'selling.svc.fulfillment.ctaTitle', text: 'selling.svc.fulfillment.ctaText', primaryLabel: 'selling.svc.fulfillment.ctaPrimary', secondaryLabel: 'selling.svc.fulfillment.ctaSecondary' },
  },
  {
    slug: 'warehousing',
    path: '/selling/warehousing',
    navLabel: 'selling.svc.warehousing.nav',
    icon: Warehouse,
    seo: { title: 'selling.svc.warehousing.seoTitle', description: 'selling.svc.warehousing.seoDesc' },
    hero: { title: 'selling.svc.warehousing.heroTitle', lead: 'selling.svc.warehousing.heroLead', tags: ['selling.svc.warehousing.tag.0', 'selling.svc.warehousing.tag.1', 'selling.svc.warehousing.tag.2'] },
    overview: { title: 'selling.svc.warehousing.ovTitle', paragraphs: ['selling.svc.warehousing.ovP.0', 'selling.svc.warehousing.ovP.1'] },
    audience: { title: 'selling.svc.warehousing.audTitle', items: [{ icon: Boxes, title: 'selling.svc.warehousing.aud.0.title', text: 'selling.svc.warehousing.aud.0.text' }, { icon: Building2, title: 'selling.svc.warehousing.aud.1.title', text: 'selling.svc.warehousing.aud.1.text' }, { icon: ShoppingBag, title: 'selling.svc.warehousing.aud.2.title', text: 'selling.svc.warehousing.aud.2.text' }, { icon: Globe2, title: 'selling.svc.warehousing.aud.3.title', text: 'selling.svc.warehousing.aud.3.text' }] },
    process: { title: 'selling.svc.warehousing.procTitle', steps: [{ title: 'selling.svc.warehousing.proc.0.title', text: 'selling.svc.warehousing.proc.0.text' }, { title: 'selling.svc.warehousing.proc.1.title', text: 'selling.svc.warehousing.proc.1.text' }, { title: 'selling.svc.warehousing.proc.2.title', text: 'selling.svc.warehousing.proc.2.text' }, { title: 'selling.svc.warehousing.proc.3.title', text: 'selling.svc.warehousing.proc.3.text' }] },
    benefits: { title: 'selling.svc.warehousing.benTitle', items: [{ icon: MapPin, title: 'selling.svc.warehousing.ben.0.title', text: 'selling.svc.warehousing.ben.0.text' }, { icon: Truck, title: 'selling.svc.warehousing.ben.1.title', text: 'selling.svc.warehousing.ben.1.text' }, { icon: ClipboardCheck, title: 'selling.svc.warehousing.ben.2.title', text: 'selling.svc.warehousing.ben.2.text' }] },
    requirements: { title: 'selling.svc.warehousing.reqTitle', items: ['selling.svc.warehousing.reqItems.0', 'selling.svc.warehousing.reqItems.1', 'selling.svc.warehousing.reqItems.2', 'selling.svc.warehousing.reqItems.3'], note: 'selling.svc.warehousing.reqNote' },
    related: ['fulfillment', 'packaging-labeling', 'product-sourcing'],
    faqs: [{ q: 'selling.svc.warehousing.faq.0.q', a: 'selling.svc.warehousing.faq.0.a' }, { q: 'selling.svc.warehousing.faq.1.q', a: 'selling.svc.warehousing.faq.1.a' }, { q: 'selling.svc.warehousing.faq.2.q', a: 'selling.svc.warehousing.faq.2.a' }, { q: 'selling.svc.warehousing.faq.3.q', a: 'selling.svc.warehousing.faq.3.a' }, sharedFaq("faqPricing"), sharedFaq("faqStart")],
    cta: { title: 'selling.svc.warehousing.ctaTitle', text: 'selling.svc.warehousing.ctaText', primaryLabel: 'selling.svc.warehousing.ctaPrimary', secondaryLabel: 'selling.svc.warehousing.ctaSecondary' },
  },
  {
    slug: 'packaging-labeling',
    path: '/selling/packaging-labeling',
    navLabel: 'selling.svc.packaging-labeling.nav',
    icon: Tags,
    seo: { title: 'selling.svc.packaging-labeling.seoTitle', description: 'selling.svc.packaging-labeling.seoDesc' },
    hero: { title: 'selling.svc.packaging-labeling.heroTitle', lead: 'selling.svc.packaging-labeling.heroLead', tags: ['selling.svc.packaging-labeling.tag.0', 'selling.svc.packaging-labeling.tag.1', 'selling.svc.packaging-labeling.tag.2'] },
    overview: { title: 'selling.svc.packaging-labeling.ovTitle', paragraphs: ['selling.svc.packaging-labeling.ovP.0', 'selling.svc.packaging-labeling.ovP.1'] },
    audience: { title: 'selling.svc.packaging-labeling.audTitle', items: [{ icon: ShoppingBag, title: 'selling.svc.packaging-labeling.aud.0.title', text: 'selling.svc.packaging-labeling.aud.0.text' }, { icon: Store, title: 'selling.svc.packaging-labeling.aud.1.title', text: 'selling.svc.packaging-labeling.aud.1.text' }, { icon: Boxes, title: 'selling.svc.packaging-labeling.aud.2.title', text: 'selling.svc.packaging-labeling.aud.2.text' }, { icon: Building2, title: 'selling.svc.packaging-labeling.aud.3.title', text: 'selling.svc.packaging-labeling.aud.3.text' }] },
    process: { title: 'selling.svc.packaging-labeling.procTitle', steps: [{ title: 'selling.svc.packaging-labeling.proc.0.title', text: 'selling.svc.packaging-labeling.proc.0.text' }, { title: 'selling.svc.packaging-labeling.proc.1.title', text: 'selling.svc.packaging-labeling.proc.1.text' }, { title: 'selling.svc.packaging-labeling.proc.2.title', text: 'selling.svc.packaging-labeling.proc.2.text' }, { title: 'selling.svc.packaging-labeling.proc.3.title', text: 'selling.svc.packaging-labeling.proc.3.text' }, { title: 'selling.svc.packaging-labeling.proc.4.title', text: 'selling.svc.packaging-labeling.proc.4.text' }] },
    benefits: { title: 'selling.svc.packaging-labeling.benTitle', items: [{ icon: ScanBarcode, title: 'selling.svc.packaging-labeling.ben.0.title', text: 'selling.svc.packaging-labeling.ben.0.text' }, { icon: Truck, title: 'selling.svc.packaging-labeling.ben.1.title', text: 'selling.svc.packaging-labeling.ben.1.text' }, { icon: Package, title: 'selling.svc.packaging-labeling.ben.2.title', text: 'selling.svc.packaging-labeling.ben.2.text' }] },
    requirements: { title: 'selling.svc.packaging-labeling.reqTitle', items: ['selling.svc.packaging-labeling.reqItems.0', 'selling.svc.packaging-labeling.reqItems.1', 'selling.svc.packaging-labeling.reqItems.2', 'selling.svc.packaging-labeling.reqItems.3'], note: 'selling.svc.packaging-labeling.reqNote' },
    related: ['marketplace-preparation', 'fulfillment', 'warehousing'],
    faqs: [{ q: 'selling.svc.packaging-labeling.faq.0.q', a: 'selling.svc.packaging-labeling.faq.0.a' }, { q: 'selling.svc.packaging-labeling.faq.1.q', a: 'selling.svc.packaging-labeling.faq.1.a' }, { q: 'selling.svc.packaging-labeling.faq.2.q', a: 'selling.svc.packaging-labeling.faq.2.a' }, { q: 'selling.svc.packaging-labeling.faq.3.q', a: 'selling.svc.packaging-labeling.faq.3.a' }, sharedFaq("faqPricing"), sharedFaq("faqStart")],
    cta: { title: 'selling.svc.packaging-labeling.ctaTitle', text: 'selling.svc.packaging-labeling.ctaText', primaryLabel: 'selling.svc.packaging-labeling.ctaPrimary', secondaryLabel: 'selling.svc.packaging-labeling.ctaSecondary' },
  },
  {
    slug: 'marketplace-preparation',
    path: '/selling/marketplace-preparation',
    navLabel: 'selling.svc.marketplace-preparation.nav',
    icon: ClipboardCheck,
    seo: { title: 'selling.svc.marketplace-preparation.seoTitle', description: 'selling.svc.marketplace-preparation.seoDesc' },
    hero: { title: 'selling.svc.marketplace-preparation.heroTitle', lead: 'selling.svc.marketplace-preparation.heroLead', tags: ['selling.svc.marketplace-preparation.tag.0', 'selling.svc.marketplace-preparation.tag.1', 'selling.svc.marketplace-preparation.tag.2'] },
    overview: { title: 'selling.svc.marketplace-preparation.ovTitle', paragraphs: ['selling.svc.marketplace-preparation.ovP.0', 'selling.svc.marketplace-preparation.ovP.1'] },
    audience: { title: 'selling.svc.marketplace-preparation.audTitle', items: [{ icon: ShoppingBag, title: 'selling.svc.marketplace-preparation.aud.0.title', text: 'selling.svc.marketplace-preparation.aud.0.text' }, { icon: Store, title: 'selling.svc.marketplace-preparation.aud.1.title', text: 'selling.svc.marketplace-preparation.aud.1.text' }, { icon: Boxes, title: 'selling.svc.marketplace-preparation.aud.2.title', text: 'selling.svc.marketplace-preparation.aud.2.text' }, { icon: Building2, title: 'selling.svc.marketplace-preparation.aud.3.title', text: 'selling.svc.marketplace-preparation.aud.3.text' }] },
    process: { title: 'selling.svc.marketplace-preparation.procTitle', note: 'selling.svc.marketplace-preparation.procNote', steps: [{ title: 'selling.svc.marketplace-preparation.proc.0.title', text: 'selling.svc.marketplace-preparation.proc.0.text' }, { title: 'selling.svc.marketplace-preparation.proc.1.title', text: 'selling.svc.marketplace-preparation.proc.1.text' }, { title: 'selling.svc.marketplace-preparation.proc.2.title', text: 'selling.svc.marketplace-preparation.proc.2.text' }, { title: 'selling.svc.marketplace-preparation.proc.3.title', text: 'selling.svc.marketplace-preparation.proc.3.text' }, { title: 'selling.svc.marketplace-preparation.proc.4.title', text: 'selling.svc.marketplace-preparation.proc.4.text' }] },
    split: { title: 'selling.svc.marketplace-preparation.splitTitle', tejaraa: ['selling.svc.marketplace-preparation.splitTejaraa.0', 'selling.svc.marketplace-preparation.splitTejaraa.1', 'selling.svc.marketplace-preparation.splitTejaraa.2', 'selling.svc.marketplace-preparation.splitTejaraa.3'], you: ['selling.svc.marketplace-preparation.splitYou.0', 'selling.svc.marketplace-preparation.splitYou.1', 'selling.svc.marketplace-preparation.splitYou.2', 'selling.svc.marketplace-preparation.splitYou.3'] },
    benefits: { title: 'selling.svc.marketplace-preparation.benTitle', items: [{ icon: ClipboardCheck, title: 'selling.svc.marketplace-preparation.ben.0.title', text: 'selling.svc.marketplace-preparation.ben.0.text' }, { icon: ScanBarcode, title: 'selling.svc.marketplace-preparation.ben.1.title', text: 'selling.svc.marketplace-preparation.ben.1.text' }, { icon: Warehouse, title: 'selling.svc.marketplace-preparation.ben.2.title', text: 'selling.svc.marketplace-preparation.ben.2.text' }] },
    requirements: { title: 'selling.svc.marketplace-preparation.reqTitle', items: ['selling.svc.marketplace-preparation.reqItems.0', 'selling.svc.marketplace-preparation.reqItems.1', 'selling.svc.marketplace-preparation.reqItems.2', 'selling.svc.marketplace-preparation.reqItems.3'] },
    related: ['packaging-labeling', 'fulfillment', 'integrations'],
    faqs: [{ q: 'selling.svc.marketplace-preparation.faq.0.q', a: 'selling.svc.marketplace-preparation.faq.0.a' }, { q: 'selling.svc.marketplace-preparation.faq.1.q', a: 'selling.svc.marketplace-preparation.faq.1.a' }, { q: 'selling.svc.marketplace-preparation.faq.2.q', a: 'selling.svc.marketplace-preparation.faq.2.a' }, { q: 'selling.svc.marketplace-preparation.faq.3.q', a: 'selling.svc.marketplace-preparation.faq.3.a' }, { q: 'selling.svc.marketplace-preparation.faq.4.q', a: 'selling.svc.marketplace-preparation.faq.4.a' }, sharedFaq("faqPricing")],
    cta: { title: 'selling.svc.marketplace-preparation.ctaTitle', text: 'selling.svc.marketplace-preparation.ctaText', primaryLabel: 'selling.svc.marketplace-preparation.ctaPrimary', secondaryLabel: 'selling.svc.marketplace-preparation.ctaSecondary' },
  },
];

export const servicePageBySlug = Object.fromEntries(servicePages.map((page) => [page.slug, page]));

/** Extra destinations that appear in navigation and related-service blocks. */
export const sellerExtraPages = {
  integrations: {
    slug: 'integrations',
    path: '/selling/integrations',
    navLabel: 'selling.svc.extra.integrations.nav' as TranslationKey,
    icon: Plug,
    blurb: 'selling.svc.extra.integrations.blurb' as TranslationKey,
  },
  howItWorks: {
    slug: 'how-it-works',
    path: '/selling/how-it-works',
    navLabel: 'selling.svc.extra.howItWorks.nav' as TranslationKey,
    icon: ListChecks,
    blurb: 'selling.svc.extra.howItWorks.blurb' as TranslationKey,
  },
} as const;

/** Channels a seller can register today, with an honest support level. */
export type ChannelSupport = 'Connected integration' | 'Supported workflow' | 'Manual / assisted setup';

export interface ChannelCard {
  icon: LucideIcon;
  name: TranslationKey;
  kind: 'Store platform' | 'Marketplace' | 'Other';
  support: ChannelSupport;
  text: TranslationKey;
}

export const sellerChannelCards: ChannelCard[] = [
  {
    icon: ShoppingBag,
    name: 'selling.svc.channel.0.name',
    kind: 'Store platform',
    support: 'Supported workflow',
    text: 'selling.svc.channel.0.text',
  },
  {
    icon: Globe2,
    name: 'selling.svc.channel.1.name',
    kind: 'Store platform',
    support: 'Supported workflow',
    text: 'selling.svc.channel.1.text',
  },
  {
    icon: Package,
    name: 'selling.svc.channel.2.name',
    kind: 'Marketplace',
    support: 'Supported workflow',
    text: 'selling.svc.channel.2.text',
  },
  {
    icon: Store,
    name: 'selling.svc.channel.3.name',
    kind: 'Marketplace',
    support: 'Supported workflow',
    text: 'selling.svc.channel.3.text',
  },
  {
    icon: Boxes,
    name: 'selling.svc.channel.4.name',
    kind: 'Other',
    support: 'Manual / assisted setup',
    text: 'selling.svc.channel.4.text',
  },
];

export interface JourneyPath {
  id: string;
  icon: LucideIcon;
  title: TranslationKey;
  steps: TranslationKey[];
  note: TranslationKey;
  links: { label: TranslationKey; to: string }[];
}

export const sellerJourneys: JourneyPath[] = [
  {
    id: 'new-store',
    icon: Rocket,
    title: 'selling.svc.journey.0.title',
    steps: ['selling.svc.journey.0.step.0', 'selling.svc.journey.0.step.1', 'selling.svc.journey.0.step.2', 'selling.svc.journey.0.step.3'],
    note: 'selling.svc.journey.0.note',
    links: [
      { label: 'selling.svc.journey.0.link.0', to: '/selling/product-hunting' },
      { label: 'selling.svc.journey.0.link.1', to: '/selling/dropshipping' },
    ],
  },
  {
    id: 'existing-store',
    icon: Store,
    title: 'selling.svc.journey.1.title',
    steps: ['selling.svc.journey.1.step.0', 'selling.svc.journey.1.step.1', 'selling.svc.journey.1.step.2', 'selling.svc.journey.1.step.3'],
    note: 'selling.svc.journey.1.note',
    links: [
      { label: 'selling.svc.journey.1.link.0', to: '/selling/integrations' },
      { label: 'selling.svc.journey.1.link.1', to: '/selling/fulfillment' },
    ],
  },
  {
    id: 'marketplace',
    icon: ShoppingBag,
    title: 'selling.svc.journey.2.title',
    steps: ['selling.svc.journey.2.step.0', 'selling.svc.journey.2.step.1', 'selling.svc.journey.2.step.2'],
    note: 'selling.svc.journey.2.note',
    links: [
      { label: 'selling.svc.journey.2.link.0', to: '/selling/marketplace-preparation' },
      { label: 'selling.svc.journey.2.link.1', to: '/selling/product-sourcing' },
    ],
  },
  {
    id: 'have-inventory',
    icon: Boxes,
    title: 'selling.svc.journey.3.title',
    steps: ['selling.svc.journey.3.step.0', 'selling.svc.journey.3.step.1', 'selling.svc.journey.3.step.2', 'selling.svc.journey.3.step.3'],
    note: 'selling.svc.journey.3.note',
    links: [
      { label: 'selling.svc.journey.3.link.0', to: '/selling/warehousing' },
      { label: 'selling.svc.journey.3.link.1', to: '/selling/fulfillment' },
    ],
  },
  {
    id: 'expand',
    icon: Layers,
    title: 'selling.svc.journey.4.title',
    steps: ['selling.svc.journey.4.step.0', 'selling.svc.journey.4.step.1', 'selling.svc.journey.4.step.2', 'selling.svc.journey.4.step.3'],
    note: 'selling.svc.journey.4.note',
    links: [
      { label: 'selling.svc.journey.4.link.0', to: '/selling/product-hunting' },
      { label: 'selling.svc.journey.4.link.1', to: '/selling/product-sourcing' },
    ],
  },
];

export const sellerTrustStrip: IconItem[] = [
  { icon: PackageSearch, title: 'selling.svc.trustStrip.0.title', text: 'selling.svc.trustStrip.0.text' },
  { icon: MapPin, title: 'selling.svc.trustStrip.1.title', text: 'selling.svc.trustStrip.1.text' },
  { icon: SlidersHorizontal, title: 'selling.svc.trustStrip.2.title', text: 'selling.svc.trustStrip.2.text' },
  { icon: Languages, title: 'selling.svc.trustStrip.3.title', text: 'selling.svc.trustStrip.3.text' },
];
