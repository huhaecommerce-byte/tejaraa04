import {
  BadgeCheck, Boxes, Building2, ClipboardCheck, FileText, Factory, Globe2, Handshake,
  Layers, PackageSearch, ScrollText, Store, Truck, UserRound, Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '@/i18n/dictionary';
import catElectronics from '@/assets/partners/cat-electronics.jpg';
import catMobile from '@/assets/partners/cat-mobile.jpg';
import catHome from '@/assets/partners/cat-home.jpg';
import catBeauty from '@/assets/partners/cat-beauty.jpg';
import catFashion from '@/assets/partners/cat-fashion.jpg';
import catAutomotive from '@/assets/partners/cat-automotive.jpg';
import catFood from '@/assets/partners/cat-food.jpg';
import catPackaging from '@/assets/partners/cat-packaging.jpg';

/**
 * Public Suppliers (/partners) content.
 * Every claim here mirrors what the real supplier registration, review and
 * supplier workspace actually do — no guaranteed orders, no published
 * commercial terms, no invented network metrics.
 */

/** Supplier registration is account creation only — no separate public application form. */
export const supplierApplyPath = '/partners/signup';
export const supplierSignInPath = '/partners/signin';

export interface SupplierItem {
  icon: LucideIcon;
  title: TranslationKey;
  text: TranslationKey;
}

/** Business types the supplier registration form actually accepts. */
export const supplierTypes: SupplierItem[] = [
  { icon: Factory, title: 'supplier.types.manufacturers.title', text: 'supplier.types.manufacturers.text' },
  { icon: Truck, title: 'supplier.types.distributors.title', text: 'supplier.types.distributors.text' },
  { icon: Warehouse, title: 'supplier.types.wholesalers.title', text: 'supplier.types.wholesalers.text' },
  { icon: Globe2, title: 'supplier.types.importers.title', text: 'supplier.types.importers.text' },
  { icon: UserRound, title: 'supplier.types.individualTraders.title', text: 'supplier.types.individualTraders.text' },
];

export const supplierBenefits: SupplierItem[] = [
  { icon: Store, title: 'supplier.benefitsList.ecommerceDemand.title', text: 'supplier.benefitsList.ecommerceDemand.text' },
  { icon: Boxes, title: 'supplier.benefitsList.catalogueExpansion.title', text: 'supplier.benefitsList.catalogueExpansion.text' },
  { icon: ClipboardCheck, title: 'supplier.benefitsList.structuredReview.title', text: 'supplier.benefitsList.structuredReview.text' },
  { icon: Layers, title: 'supplier.benefitsList.oneWorkspace.title', text: 'supplier.benefitsList.oneWorkspace.text' },
  { icon: Handshake, title: 'supplier.benefitsList.longTerm.title', text: 'supplier.benefitsList.longTerm.text' },
  { icon: BadgeCheck, title: 'supplier.benefitsList.regionalExperience.title', text: 'supplier.benefitsList.regionalExperience.text' },
];

export interface SupplierStep {
  icon: LucideIcon;
  title: TranslationKey;
  text: TranslationKey;
}

/** Mirrors the real registration form and the review that follows it. */
export const supplierProcess: SupplierStep[] = [
  { icon: ClipboardCheck, title: 'supplier.processSteps.apply.title', text: 'supplier.processSteps.apply.text' },
  { icon: FileText, title: 'supplier.processSteps.sendDocuments.title', text: 'supplier.processSteps.sendDocuments.text' },
  { icon: Warehouse, title: 'supplier.processSteps.addWarehouse.title', text: 'supplier.processSteps.addWarehouse.text' },
  { icon: PackageSearch, title: 'supplier.processSteps.businessReview.title', text: 'supplier.processSteps.businessReview.text' },
  { icon: ScrollText, title: 'supplier.processSteps.commercialAgreement.title', text: 'supplier.processSteps.commercialAgreement.text' },
  { icon: Boxes, title: 'supplier.processSteps.productOnboarding.title', text: 'supplier.processSteps.productOnboarding.text' },
  { icon: Truck, title: 'supplier.processSteps.supplyOrders.title', text: 'supplier.processSteps.supplyOrders.text' },
];

export interface SupplyModel {
  icon: LucideIcon;
  title: TranslationKey;
  best: TranslationKey;
  points: TranslationKey[];
}

export const supplyModels: SupplyModel[] = [
  {
    icon: Warehouse,
    title: 'supplier.supplyModelsList.wholesale.title',
    best: 'supplier.supplyModelsList.wholesale.best',
    points: ['supplier.supplyModelsList.wholesale.point1', 'supplier.supplyModelsList.wholesale.point2', 'supplier.supplyModelsList.wholesale.point3'],
  },
  {
    icon: Truck,
    title: 'supplier.supplyModelsList.brand.title',
    best: 'supplier.supplyModelsList.brand.best',
    points: ['supplier.supplyModelsList.brand.point1', 'supplier.supplyModelsList.brand.point2', 'supplier.supplyModelsList.brand.point3'],
  },
  {
    icon: Boxes,
    title: 'supplier.supplyModelsList.catalogue.title',
    best: 'supplier.supplyModelsList.catalogue.best',
    points: ['supplier.supplyModelsList.catalogue.point1', 'supplier.supplyModelsList.catalogue.point2', 'supplier.supplyModelsList.catalogue.point3'],
  },
];

export interface SupplierCategory {
  name: TranslationKey;
  text: TranslationKey;
  image: string;
}

/** Categories reviewed today — interest, not a demand promise. */
export const supplierCategories: SupplierCategory[] = [
  { name: 'supplier.categoriesList.electronics.name', text: 'supplier.categoriesList.electronics.text', image: catElectronics },
  { name: 'supplier.categoriesList.mobile.name', text: 'supplier.categoriesList.mobile.text', image: catMobile },
  { name: 'supplier.categoriesList.home.name', text: 'supplier.categoriesList.home.text', image: catHome },
  { name: 'supplier.categoriesList.beauty.name', text: 'supplier.categoriesList.beauty.text', image: catBeauty },
  { name: 'supplier.categoriesList.fashion.name', text: 'supplier.categoriesList.fashion.text', image: catFashion },
  { name: 'supplier.categoriesList.automotive.name', text: 'supplier.categoriesList.automotive.text', image: catAutomotive },
  { name: 'supplier.categoriesList.food.name', text: 'supplier.categoriesList.food.text', image: catFood },
  { name: 'supplier.categoriesList.packaging.name', text: 'supplier.categoriesList.packaging.text', image: catPackaging },
];

export const supplierRequirements: SupplierItem[] = [
  { icon: Building2, title: 'supplier.requirementsList.registeredBusiness.title', text: 'supplier.requirementsList.registeredBusiness.text' },
  { icon: FileText, title: 'supplier.requirementsList.documents.title', text: 'supplier.requirementsList.documents.text' },
  { icon: PackageSearch, title: 'supplier.requirementsList.catalogue.title', text: 'supplier.requirementsList.catalogue.text' },
  { icon: Warehouse, title: 'supplier.requirementsList.supplyCapability.title', text: 'supplier.requirementsList.supplyCapability.text' },
  { icon: ScrollText, title: 'supplier.requirementsList.commercialTerms.title', text: 'supplier.requirementsList.commercialTerms.text' },
];

export const supplierChannels: SupplierItem[] = [
  { icon: Store, title: 'supplier.channelsList.shop.title', text: 'supplier.channelsList.shop.text' },
  { icon: Truck, title: 'supplier.channelsList.sellers.title', text: 'supplier.channelsList.sellers.text' },
  { icon: Globe2, title: 'supplier.channelsList.businessBuyers.title', text: 'supplier.channelsList.businessBuyers.text' },
];

export const supplierTrust: SupplierItem[] = [
  { icon: BadgeCheck, title: 'supplier.trustList.experience.title', text: 'supplier.trustList.experience.text' },
  { icon: ClipboardCheck, title: 'supplier.trustList.structuredReview.title', text: 'supplier.trustList.structuredReview.text' },
  { icon: ScrollText, title: 'supplier.trustList.clearProcess.title', text: 'supplier.trustList.clearProcess.text' },
  { icon: Handshake, title: 'supplier.trustList.partnershipFocus.title', text: 'supplier.trustList.partnershipFocus.text' },
];

export interface SupplierFaq { q: TranslationKey; a: TranslationKey }

export const supplierFaqs: SupplierFaq[] = [
  { q: 'supplier.faqList.who.q', a: 'supplier.faqList.who.a' },
  { q: 'supplier.faqList.manufacturer.q', a: 'supplier.faqList.manufacturer.a' },
  { q: 'supplier.faqList.categories.q', a: 'supplier.faqList.categories.a' },
  { q: 'supplier.faqList.documents.q', a: 'supplier.faqList.documents.a' },
  { q: 'supplier.faqList.brandAuth.q', a: 'supplier.faqList.brandAuth.a' },
  { q: 'supplier.faqList.shareCatalogue.q', a: 'supplier.faqList.shareCatalogue.a' },
  { q: 'supplier.faqList.guaranteeOrders.q', a: 'supplier.faqList.guaranteeOrders.a' },
  { q: 'supplier.faqList.paymentTerms.q', a: 'supplier.faqList.paymentTerms.a' },
  { q: 'supplier.faqList.getStarted.q', a: 'supplier.faqList.getStarted.a' },
];
