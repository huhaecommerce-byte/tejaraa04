import {
  BadgeCheck, Boxes, Building2, ClipboardCheck, FileSpreadsheet, FileText, Factory, Globe2,
  Handshake, Layers, PackageSearch, Ruler, ScrollText, Search, Store, Truck, UserRound, Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

export const supplierApprovalDisclaimer =
  'Submitting a supplier application does not guarantee approval or purchase orders. Supplier and product selection depends on commercial, category and operational requirements.';

/* ---------------------------------------------------------------- nav ----- */

export interface SupplierNavItem {
  label: string;
  to: string;
  blurb: string;
}

export const supplierNavPages: SupplierNavItem[] = [
  { label: 'Who Can Supply', to: '/partners/who-can-supply', blurb: 'Manufacturers, distributors, wholesalers, importers and brand owners.' },
  { label: 'Supply Models', to: '/partners/supply-models', blurb: 'The ways Tejaraa works with suppliers.' },
  { label: 'How It Works', to: '/partners/how-it-works', blurb: 'From application to supplying orders, step by step.' },
  { label: 'Categories', to: '/partners/categories', blurb: 'Product areas our team reviews today.' },
  { label: 'Requirements', to: '/partners/requirements', blurb: 'Business, product, catalogue and commercial information.' },
  { label: 'Markets & Channels', to: '/partners/markets', blurb: 'Where approved products may be offered.' },
];

/* ------------------------------------------------------- how it works ----- */

export interface JourneyStep {
  icon: LucideIcon;
  title: string;
  text: string;
  detail: string[];
}

export const supplierJourney: JourneyStep[] = [
  {
    icon: ClipboardCheck,
    title: 'Apply',
    text: 'Tell us about your company, product categories, brands and supply capability.',
    detail: [
      'Register your account and company details',
      'Choose your business type: wholesaler, distributor, manufacturer, importer or individual trader',
      'Add the categories and brands you supply',
    ],
  },
  {
    icon: FileText,
    title: 'Business review',
    text: 'We review basic company and supplier information to understand the business and product fit.',
    detail: [
      'Trade licence or company registration',
      'Owner or authorised person ID',
      'VAT certificate and brand authorisation where they apply',
    ],
  },
  {
    icon: FileSpreadsheet,
    title: 'Share your catalogue',
    text: 'Send your range in whichever form you already keep it.',
    detail: [
      'Excel or CSV product list',
      'Catalogue PDF, website or online catalogue link',
      'Brand list, when you supply branded ranges',
    ],
  },
  {
    icon: Search,
    title: 'Product review',
    text: 'Our team looks at which of your products fit what Tejaraa is sourcing.',
    detail: [
      'Category relevance and commercial fit',
      'Availability, stock and lead time',
      'Product information and documentation',
      'Operational feasibility for e-commerce orders',
    ],
  },
  {
    icon: ScrollText,
    title: 'Commercial discussion',
    text: 'For relevant products, commercial terms and supply requirements are discussed with your company.',
    detail: [
      'Supply pricing per product line',
      'Any minimums you apply and expected lead times',
      'Terms are agreed with your company, not published here',
    ],
  },
  {
    icon: Handshake,
    title: 'Supplier approval',
    text: 'If the business and product fit is suitable, you can proceed to the applicable commercial onboarding process.',
    detail: [
      'Your supplier account is activated',
      'Agreed terms are confirmed in writing',
      'A bank document is requested before any payout',
    ],
  },
  {
    icon: Boxes,
    title: 'Product onboarding',
    text: 'Approved products are prepared for the applicable Tejaraa commerce and procurement workflow.',
    detail: [
      'Product title, brand and category',
      'Images and specifications',
      'Barcode where available',
      'Supply cost, stock and lead time',
    ],
  },
  {
    icon: Truck,
    title: 'Supply and orders',
    text: 'Approved products may be supplied according to agreed commercial and operational requirements.',
    detail: [
      'Orders and payout requests are handled in your supplier account',
      'Stock and availability kept up to date',
      'Products can be added to the catalogue over time',
    ],
  },
];

/* ------------------------------------------------------ who can supply ---- */

export interface SupplierTypeDetail {
  id: string;
  icon: LucideIcon;
  title: string;
  bestFor: string;
  intro: string;
  points: string[];
}

export const supplierTypeDetails: SupplierTypeDetail[] = [
  {
    id: 'manufacturers',
    icon: Factory,
    title: 'Manufacturers',
    bestFor: 'Direct product supply and production-backed catalogues.',
    intro: 'Supply products directly from your own production or brand-controlled inventory.',
    points: ['Direct availability from production', 'Catalogue depth across your own lines', 'Product specifications and documentation at source', 'Own-brand products need no brand authorisation'],
  },
  {
    id: 'distributors',
    icon: Truck,
    title: 'Authorised distributors',
    bestFor: 'Established branded product ranges.',
    intro: 'Authorised or established distributors can supply branded product ranges through their existing regional distribution network.',
    points: ['Branded ranges you already distribute', 'Brand authorisation reviewed where the brand requires it', 'Existing stock and replenishment cycles', 'Product lines agreed one by one'],
  },
  {
    id: 'wholesalers',
    icon: Warehouse,
    title: 'Wholesalers',
    bestFor: 'Broad multi-brand catalogue supply.',
    intro: 'Wholesalers may provide broad catalogue access and competitive supply across relevant product categories.',
    points: ['Multi-brand and multi-category ranges', 'Share a wider catalogue so we can identify the fit', 'Not every wholesale catalogue will be accepted', 'Stock held in your own warehouse'],
  },
  {
    id: 'importers',
    icon: Globe2,
    title: 'Importers',
    bestFor: 'Product ranges already landed in supported markets.',
    intro: 'Regional importers can present product ranges already available in the markets we serve.',
    points: ['Products already imported and in stock locally', 'Import and compliance documentation where it applies', 'Reliable replenishment on repeat lines'],
  },
  {
    id: 'brand-owners',
    icon: BadgeCheck,
    title: 'Brand owners',
    bestFor: 'Expanding owned product lines.',
    intro: 'Brand owners can introduce their own products and expand distribution through the Tejaraa commerce channels that fit them.',
    points: ['Introduce your own product lines for review', 'Keep brand and product information consistent', 'Add new lines to the catalogue over time'],
  },
  {
    id: 'individual-traders',
    icon: UserRound,
    title: 'Individual traders',
    bestFor: 'Small trading businesses and freelancers.',
    intro: 'Registering as an individual or freelancer is supported in the application, with a licence uploaded where you have one.',
    points: ['Register as Individual / Freelancer', 'Same product and catalogue review applies', 'Documents requested according to your setup'],
  },
];

/* -------------------------------------------------------- supply models --- */

export interface SupplyModelDetail {
  id: string;
  icon: LucideIcon;
  title: string;
  bestFor: string;
  intro: string;
  points: string[];
}

export const supplyModelDetails: SupplyModelDetail[] = [
  {
    id: 'wholesale-supply',
    icon: Warehouse,
    title: 'Wholesale supply',
    bestFor: 'Suppliers who can supply approved products in agreed quantities.',
    intro: 'Supply approved products based on agreed pricing, stock and commercial terms.',
    points: ['Products approved line by line', 'Supply against agreed requirements', 'Stock held in your own warehouse'],
  },
  {
    id: 'brand-supply',
    icon: Truck,
    title: 'Distributor and brand supply',
    bestFor: 'Distributors and brand owners with authorised ranges.',
    intro: 'Supply established brand catalogues or authorised product ranges through your distribution business.',
    points: ['Branded ranges reviewed with authorisation where required', 'Consistent product information per brand', 'Ranges extended as the relationship develops'],
  },
  {
    id: 'catalogue-supply',
    icon: Boxes,
    title: 'Catalogue-based supply',
    bestFor: 'Suppliers with many SKUs across several categories.',
    intro: 'Share a broader catalogue so Tejaraa can identify products relevant to its current sourcing requirements.',
    points: ['Send the full range instead of picking items yourself', 'We shortlist products that match current demand', 'More products can be reviewed later'],
  },
  {
    id: 'purchase-order-supply',
    icon: ScrollText,
    title: 'Purchase order supply',
    bestFor: 'Approved suppliers on agreed product lines.',
    intro: 'Where applicable, supply may be managed through approved purchase orders under agreed terms.',
    points: ['Orders appear in your supplier account', 'Quantities confirmed per order, not guaranteed in advance', 'Payout requests follow the agreed process'],
  },
];

/* ------------------------------------------------------------ categories -- */

export interface CategoryDetail {
  name: string;
  examples: string;
}

export const categoryExamples: Record<string, string> = {
  Electronics: 'Consumer electronics, audio, small devices, TV and remote accessories.',
  'Mobile accessories': 'Cases, chargers, cables, screen protectors and related accessories.',
  'Home & kitchen': 'Household items, kitchenware, storage and small appliances.',
  'Health & beauty': 'Personal care, skincare, hair care and grooming products.',
  'Fashion accessories': 'Bags, watches, belts, eyewear and everyday accessories.',
  'Automotive accessories': 'Car care, interior accessories and in-car electronics.',
  'Food & beverage': 'Packaged food, drinks and shelf-stable grocery lines.',
  'Packaging & supplies': 'Packaging materials, labels, cartons and operational supplies.',
};

export const supplierCategoryCards = supplierCategories.map((category) => ({
  ...category,
  examples: categoryExamples[category.name] ?? category.text,
}));

/* ---------------------------------------------------------- requirements -- */

export interface RequirementGroup {
  icon: LucideIcon;
  title: string;
  intro: string;
  items: string[];
  note?: string;
}

export const requirementGroups: RequirementGroup[] = [
  {
    icon: Building2,
    title: 'Business requirements',
    intro: 'What we need to understand your company.',
    items: [
      'Registered company with a trade licence or company registration',
      'Owner or authorised person ID',
      'Business contact person, email and phone',
      'Individual traders and freelancers can apply, with a licence where they have one',
    ],
  },
  {
    icon: FileText,
    title: 'Documentation',
    intro: 'Documents are requested according to your setup and products.',
    items: [
      'Trade licence or company registration — required',
      'Owner or authorised person ID — required',
      'VAT certificate — where your business is VAT registered',
      'Brand authorisation — for branded products where the brand requires it',
      'Company bank document — before your first payout, not at application',
    ],
    note: 'Suppliers are expected to provide genuine, legally marketable products and the applicable product documentation.',
  },
  {
    icon: PackageSearch,
    title: 'Product information',
    intro: 'Product details we review, and later use for onboarding.',
    items: [
      'Product title and brand',
      'Category',
      'Barcode (EAN / UPC) where available',
      'Product images',
      'Specifications and packaging details',
      'Country of origin where relevant',
    ],
  },
  {
    icon: FileSpreadsheet,
    title: 'Catalogue information',
    intro: 'Send your range in the format you already keep it in.',
    items: [
      'Excel or CSV product list',
      'Catalogue PDF',
      'Website or online catalogue link',
      'Brand list for branded ranges',
    ],
    note: 'Products are uploaded in the supplier workspace after approval — no public upload is needed to apply.',
  },
  {
    icon: Ruler,
    title: 'Commercial information',
    intro: 'Commercial details are discussed per product line during review.',
    items: [
      'Supply cost and currency',
      'Any minimum order quantity you apply — suppliers set their own, there is no single Tejaraa MOQ',
      'Available stock',
      'Lead time for replenishment',
    ],
    note: 'Margins, payment cycles and purchase volumes are agreed with your company and are not published here.',
  },
  {
    icon: Layers,
    title: 'Operational capability',
    intro: 'What keeps supply working once products are live.',
    items: [
      'Stock and availability kept up to date',
      'Order preparation within the agreed lead time',
      'Packing suitable for e-commerce shipping',
      'Confirmed warehouse address for collection or handover',
    ],
  },
];

/* -------------------------------------------------------------- markets --- */

export interface MarketChannel {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const marketChannels: MarketChannel[] = [
  { icon: Store, title: 'Tejaraa Shop', text: 'Approved products can be offered to retail customers on the Tejaraa storefront.' },
  { icon: Truck, title: 'Sellers we supply', text: 'Products can be supplied to e-commerce sellers using Tejaraa sourcing and fulfilment services.' },
  { icon: Globe2, title: 'Business buyers', text: 'Wholesale quantities can be offered to business buyers in the markets we serve.' },
];

export const marketRegions = [
  { name: 'Saudi Arabia', text: 'Our primary market for e-commerce demand and supplier partnerships.' },
  { name: 'United Arab Emirates', text: 'Supplier registration and supply conversations are supported.' },
  { name: 'Wider GCC', text: 'Kuwait, Qatar, Bahrain and Oman are supported in supplier registration.' },
];

export const marketNote =
  "Approved products may be considered for Tejaraa's supported sales channels based on category, commercial and operational fit. Placement on any channel is not guaranteed.";

