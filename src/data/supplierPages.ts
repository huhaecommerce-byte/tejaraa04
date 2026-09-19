import {
  BadgeCheck, Boxes, Building2, ClipboardCheck, FileSpreadsheet, FileText, Factory, Globe2,
  Handshake, Layers, PackageSearch, Ruler, ScrollText, Search, Store, Truck, UserRound, Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '@/i18n/dictionary';
import { supplierCategories } from '@/data/supplierPartners';

/**
 * Public supplier journey content (Phase 2, /partners/*).
 * Everything here describes the real registration form, the real review that
 * follows it and the real supplier workspace. No guaranteed approval, no
 * guaranteed purchase orders, no published margins, payment cycles or volumes.
 */

/** Supplier registration is account creation only — no separate public application form. */
export const supplierApplyRoute = '/partners/signup';
export const supplierSignInRoute = '/partners/signin';

export const supplierApprovalDisclaimer: TranslationKey = 'supplier.approvalDisclaimer';

/* ---------------------------------------------------------------- nav ----- */

export interface SupplierNavItem {
  label: TranslationKey;
  to: string;
  blurb: TranslationKey;
}

export const supplierNavPages: SupplierNavItem[] = [
  { label: 'supplier.navPages.whoCanSupply.label', to: '/partners/who-can-supply', blurb: 'supplier.navPages.whoCanSupply.blurb' },
  { label: 'supplier.navPages.supplyModels.label', to: '/partners/supply-models', blurb: 'supplier.navPages.supplyModels.blurb' },
  { label: 'supplier.navPages.howItWorks.label', to: '/partners/how-it-works', blurb: 'supplier.navPages.howItWorks.blurb' },
  { label: 'supplier.navPages.categories.label', to: '/partners/categories', blurb: 'supplier.navPages.categories.blurb' },
  { label: 'supplier.navPages.requirements.label', to: '/partners/requirements', blurb: 'supplier.navPages.requirements.blurb' },
  { label: 'supplier.navPages.markets.label', to: '/partners/markets', blurb: 'supplier.navPages.markets.blurb' },
];

/* ------------------------------------------------------- how it works ----- */

export interface JourneyStep {
  icon: LucideIcon;
  title: TranslationKey;
  text: TranslationKey;
  detail: TranslationKey[];
}

export const supplierJourney: JourneyStep[] = [
  {
    icon: ClipboardCheck, title: 'supplier.journey.apply.title', text: 'supplier.journey.apply.text',
    detail: ['supplier.journey.apply.detail1', 'supplier.journey.apply.detail2', 'supplier.journey.apply.detail3'],
  },
  {
    icon: FileText, title: 'supplier.journey.businessReview.title', text: 'supplier.journey.businessReview.text',
    detail: ['supplier.journey.businessReview.detail1', 'supplier.journey.businessReview.detail2', 'supplier.journey.businessReview.detail3'],
  },
  {
    icon: FileSpreadsheet, title: 'supplier.journey.shareCatalogue.title', text: 'supplier.journey.shareCatalogue.text',
    detail: ['supplier.journey.shareCatalogue.detail1', 'supplier.journey.shareCatalogue.detail2', 'supplier.journey.shareCatalogue.detail3'],
  },
  {
    icon: Search, title: 'supplier.journey.productReview.title', text: 'supplier.journey.productReview.text',
    detail: ['supplier.journey.productReview.detail1', 'supplier.journey.productReview.detail2', 'supplier.journey.productReview.detail3', 'supplier.journey.productReview.detail4'],
  },
  {
    icon: ScrollText, title: 'supplier.journey.commercialDiscussion.title', text: 'supplier.journey.commercialDiscussion.text',
    detail: ['supplier.journey.commercialDiscussion.detail1', 'supplier.journey.commercialDiscussion.detail2', 'supplier.journey.commercialDiscussion.detail3'],
  },
  {
    icon: Handshake, title: 'supplier.journey.supplierApproval.title', text: 'supplier.journey.supplierApproval.text',
    detail: ['supplier.journey.supplierApproval.detail1', 'supplier.journey.supplierApproval.detail2', 'supplier.journey.supplierApproval.detail3'],
  },
  {
    icon: Boxes, title: 'supplier.journey.productOnboarding.title', text: 'supplier.journey.productOnboarding.text',
    detail: ['supplier.journey.productOnboarding.detail1', 'supplier.journey.productOnboarding.detail2', 'supplier.journey.productOnboarding.detail3', 'supplier.journey.productOnboarding.detail4'],
  },
  {
    icon: Truck, title: 'supplier.journey.supplyOrders.title', text: 'supplier.journey.supplyOrders.text',
    detail: ['supplier.journey.supplyOrders.detail1', 'supplier.journey.supplyOrders.detail2', 'supplier.journey.supplyOrders.detail3'],
  },
];

/* ------------------------------------------------------ who can supply ---- */

export interface SupplierTypeDetail {
  id: string;
  icon: LucideIcon;
  title: TranslationKey;
  bestFor: TranslationKey;
  intro: TranslationKey;
  points: TranslationKey[];
}

export const supplierTypeDetails: SupplierTypeDetail[] = [
  {
    id: 'manufacturers', icon: Factory,
    title: 'supplier.typeDetails.manufacturers.title', bestFor: 'supplier.typeDetails.manufacturers.bestFor', intro: 'supplier.typeDetails.manufacturers.intro',
    points: ['supplier.typeDetails.manufacturers.point1', 'supplier.typeDetails.manufacturers.point2', 'supplier.typeDetails.manufacturers.point3', 'supplier.typeDetails.manufacturers.point4'],
  },
  {
    id: 'distributors', icon: Truck,
    title: 'supplier.typeDetails.distributors.title', bestFor: 'supplier.typeDetails.distributors.bestFor', intro: 'supplier.typeDetails.distributors.intro',
    points: ['supplier.typeDetails.distributors.point1', 'supplier.typeDetails.distributors.point2', 'supplier.typeDetails.distributors.point3', 'supplier.typeDetails.distributors.point4'],
  },
  {
    id: 'wholesalers', icon: Warehouse,
    title: 'supplier.typeDetails.wholesalers.title', bestFor: 'supplier.typeDetails.wholesalers.bestFor', intro: 'supplier.typeDetails.wholesalers.intro',
    points: ['supplier.typeDetails.wholesalers.point1', 'supplier.typeDetails.wholesalers.point2', 'supplier.typeDetails.wholesalers.point3', 'supplier.typeDetails.wholesalers.point4'],
  },
  {
    id: 'importers', icon: Globe2,
    title: 'supplier.typeDetails.importers.title', bestFor: 'supplier.typeDetails.importers.bestFor', intro: 'supplier.typeDetails.importers.intro',
    points: ['supplier.typeDetails.importers.point1', 'supplier.typeDetails.importers.point2', 'supplier.typeDetails.importers.point3'],
  },
  {
    id: 'brand-owners', icon: BadgeCheck,
    title: 'supplier.typeDetails.brandOwners.title', bestFor: 'supplier.typeDetails.brandOwners.bestFor', intro: 'supplier.typeDetails.brandOwners.intro',
    points: ['supplier.typeDetails.brandOwners.point1', 'supplier.typeDetails.brandOwners.point2', 'supplier.typeDetails.brandOwners.point3'],
  },
  {
    id: 'individual-traders', icon: UserRound,
    title: 'supplier.typeDetails.individualTraders.title', bestFor: 'supplier.typeDetails.individualTraders.bestFor', intro: 'supplier.typeDetails.individualTraders.intro',
    points: ['supplier.typeDetails.individualTraders.point1', 'supplier.typeDetails.individualTraders.point2', 'supplier.typeDetails.individualTraders.point3'],
  },
];

/* -------------------------------------------------------- supply models --- */

export interface SupplyModelDetail {
  id: string;
  icon: LucideIcon;
  title: TranslationKey;
  bestFor: TranslationKey;
  intro: TranslationKey;
  points: TranslationKey[];
}

export const supplyModelDetails: SupplyModelDetail[] = [
  {
    id: 'wholesale-supply', icon: Warehouse,
    title: 'supplier.modelDetails.wholesaleSupply.title', bestFor: 'supplier.modelDetails.wholesaleSupply.bestFor', intro: 'supplier.modelDetails.wholesaleSupply.intro',
    points: ['supplier.modelDetails.wholesaleSupply.point1', 'supplier.modelDetails.wholesaleSupply.point2', 'supplier.modelDetails.wholesaleSupply.point3'],
  },
  {
    id: 'brand-supply', icon: Truck,
    title: 'supplier.modelDetails.brandSupply.title', bestFor: 'supplier.modelDetails.brandSupply.bestFor', intro: 'supplier.modelDetails.brandSupply.intro',
    points: ['supplier.modelDetails.brandSupply.point1', 'supplier.modelDetails.brandSupply.point2', 'supplier.modelDetails.brandSupply.point3'],
  },
  {
    id: 'catalogue-supply', icon: Boxes,
    title: 'supplier.modelDetails.catalogueSupply.title', bestFor: 'supplier.modelDetails.catalogueSupply.bestFor', intro: 'supplier.modelDetails.catalogueSupply.intro',
    points: ['supplier.modelDetails.catalogueSupply.point1', 'supplier.modelDetails.catalogueSupply.point2', 'supplier.modelDetails.catalogueSupply.point3'],
  },
  {
    id: 'purchase-order-supply', icon: ScrollText,
    title: 'supplier.modelDetails.purchaseOrderSupply.title', bestFor: 'supplier.modelDetails.purchaseOrderSupply.bestFor', intro: 'supplier.modelDetails.purchaseOrderSupply.intro',
    points: ['supplier.modelDetails.purchaseOrderSupply.point1', 'supplier.modelDetails.purchaseOrderSupply.point2', 'supplier.modelDetails.purchaseOrderSupply.point3'],
  },
];

/* ------------------------------------------------------------ categories -- */

export interface CategoryDetail {
  name: TranslationKey;
  examples: TranslationKey;
}

export const categoryExamples: Partial<Record<TranslationKey, TranslationKey>> = {
  'supplier.categoriesList.electronics.name': 'supplier.categoryExamples.electronics',
  'supplier.categoriesList.mobile.name': 'supplier.categoryExamples.mobile',
  'supplier.categoriesList.home.name': 'supplier.categoryExamples.home',
  'supplier.categoriesList.beauty.name': 'supplier.categoryExamples.beauty',
  'supplier.categoriesList.fashion.name': 'supplier.categoryExamples.fashion',
  'supplier.categoriesList.automotive.name': 'supplier.categoryExamples.automotive',
  'supplier.categoriesList.food.name': 'supplier.categoryExamples.food',
  'supplier.categoriesList.packaging.name': 'supplier.categoryExamples.packaging',
};

export const supplierCategoryCards = supplierCategories.map((category) => ({
  ...category,
  examples: categoryExamples[category.name] ?? category.text,
}));

/* ---------------------------------------------------------- requirements -- */

export interface RequirementGroup {
  icon: LucideIcon;
  title: TranslationKey;
  intro: TranslationKey;
  items: TranslationKey[];
  note?: TranslationKey;
}

export const requirementGroups: RequirementGroup[] = [
  {
    icon: Building2, title: 'supplier.requirementGroups.business.title', intro: 'supplier.requirementGroups.business.intro',
    items: ['supplier.requirementGroups.business.item1', 'supplier.requirementGroups.business.item2', 'supplier.requirementGroups.business.item3', 'supplier.requirementGroups.business.item4'],
  },
  {
    icon: FileText, title: 'supplier.requirementGroups.documentation.title', intro: 'supplier.requirementGroups.documentation.intro',
    items: ['supplier.requirementGroups.documentation.item1', 'supplier.requirementGroups.documentation.item2', 'supplier.requirementGroups.documentation.item3', 'supplier.requirementGroups.documentation.item4', 'supplier.requirementGroups.documentation.item5'],
    note: 'supplier.requirementGroups.documentation.note',
  },
  {
    icon: PackageSearch, title: 'supplier.requirementGroups.productInfo.title', intro: 'supplier.requirementGroups.productInfo.intro',
    items: ['supplier.requirementGroups.productInfo.item1', 'supplier.requirementGroups.productInfo.item2', 'supplier.requirementGroups.productInfo.item3', 'supplier.requirementGroups.productInfo.item4', 'supplier.requirementGroups.productInfo.item5', 'supplier.requirementGroups.productInfo.item6'],
  },
  {
    icon: FileSpreadsheet, title: 'supplier.requirementGroups.catalogueInfo.title', intro: 'supplier.requirementGroups.catalogueInfo.intro',
    items: ['supplier.requirementGroups.catalogueInfo.item1', 'supplier.requirementGroups.catalogueInfo.item2', 'supplier.requirementGroups.catalogueInfo.item3', 'supplier.requirementGroups.catalogueInfo.item4'],
    note: 'supplier.requirementGroups.catalogueInfo.note',
  },
  {
    icon: Ruler, title: 'supplier.requirementGroups.commercialInfo.title', intro: 'supplier.requirementGroups.commercialInfo.intro',
    items: ['supplier.requirementGroups.commercialInfo.item1', 'supplier.requirementGroups.commercialInfo.item2', 'supplier.requirementGroups.commercialInfo.item3', 'supplier.requirementGroups.commercialInfo.item4'],
    note: 'supplier.requirementGroups.commercialInfo.note',
  },
  {
    icon: Layers, title: 'supplier.requirementGroups.operational.title', intro: 'supplier.requirementGroups.operational.intro',
    items: ['supplier.requirementGroups.operational.item1', 'supplier.requirementGroups.operational.item2', 'supplier.requirementGroups.operational.item3', 'supplier.requirementGroups.operational.item4'],
  },
];

/* -------------------------------------------------------------- markets --- */

export interface MarketChannel {
  icon: LucideIcon;
  title: TranslationKey;
  text: TranslationKey;
}

export const marketChannels: MarketChannel[] = [
  { icon: Store, title: 'supplier.channelsList.shop.title', text: 'supplier.marketChannels.shop.text' },
  { icon: Truck, title: 'supplier.channelsList.sellers.title', text: 'supplier.marketChannels.sellers.text' },
  { icon: Globe2, title: 'supplier.channelsList.businessBuyers.title', text: 'supplier.channelsList.businessBuyers.text' },
];

export const marketRegions: { name: TranslationKey; text: TranslationKey }[] = [
  { name: 'supplier.marketRegions.saudi.name', text: 'supplier.marketRegions.saudi.text' },
  { name: 'supplier.marketRegions.uae.name', text: 'supplier.marketRegions.uae.text' },
  { name: 'supplier.marketRegions.gcc.name', text: 'supplier.marketRegions.gcc.text' },
];

export const marketNote: TranslationKey = 'supplier.marketNote';
