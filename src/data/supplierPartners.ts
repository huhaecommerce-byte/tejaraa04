import {
  BadgeCheck, Boxes, Building2, ClipboardCheck, FileText, Factory, Globe2, Handshake,
  Layers, PackageSearch, ScrollText, Store, Truck, UserRound, Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  title: string;
  text: string;
}

/** Business types the supplier registration form actually accepts. */
export const supplierTypes: SupplierItem[] = [
  {
    icon: Factory,
    title: 'Manufacturers',
    text: 'Supply the products you make directly, and put them in front of the e-commerce demand Tejaraa works with.',
  },
  {
    icon: Truck,
    title: 'Distributors',
    text: 'Supply the brands and product lines you already distribute across your market.',
  },
  {
    icon: Warehouse,
    title: 'Wholesalers',
    text: 'Offer a broader catalogue and competitive supply for the categories Tejaraa reviews.',
  },
  {
    icon: Globe2,
    title: 'Importers',
    text: 'Supply products you already bring in through your own import and distribution network.',
  },
  {
    icon: UserRound,
    title: 'Individual traders',
    text: 'Registering as an individual or freelancer is supported — upload a licence if you have one.',
  },
];

export const supplierBenefits: SupplierItem[] = [
  {
    icon: Store,
    title: 'Access to e-commerce demand',
    text: 'Approved products can be offered through the Tejaraa channels that fit them, instead of one storefront at a time.',
  },
  {
    icon: Boxes,
    title: 'Catalogue expansion',
    text: 'Add more of your range to the Tejaraa catalogue for review as your assortment grows.',
  },
  {
    icon: ClipboardCheck,
    title: 'A structured review process',
    text: 'Your company, documents and products go through a clear review — you always know which stage you are at.',
  },
  {
    icon: Layers,
    title: 'One supplier workspace',
    text: 'Manage your products, incoming orders and payout requests from a single supplier account.',
  },
  {
    icon: Handshake,
    title: 'Long-term supply relationships',
    text: 'We look for suppliers we can keep buying from, where product, price and service levels line up.',
  },
  {
    icon: BadgeCheck,
    title: 'Regional market experience',
    text: 'Our team works with Saudi and wider Gulf e-commerce every day, so product conversations stay practical.',
  },
];

export interface SupplierStep {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Mirrors the real registration form and the review that follows it. */
export const supplierProcess: SupplierStep[] = [
  {
    icon: ClipboardCheck,
    title: 'Apply',
    text: 'Register your company, business type and contact details in the supplier application.',
  },
  {
    icon: FileText,
    title: 'Send your documents',
    text: 'Upload your trade licence and owner ID, plus VAT or brand authorisation where they apply.',
  },
  {
    icon: Warehouse,
    title: 'Add your warehouse',
    text: 'Tell us where your stock is held so supply and collection can be planned.',
  },
  {
    icon: PackageSearch,
    title: 'Business and product review',
    text: 'Our team reviews your business, then looks at which of your products fit current demand and categories.',
  },
  {
    icon: ScrollText,
    title: 'Commercial agreement',
    text: 'Pricing, supply terms and the conditions that apply to your products are agreed with our team.',
  },
  {
    icon: Boxes,
    title: 'Product onboarding',
    text: 'Approved products are prepared for the Tejaraa workflow that suits them.',
  },
  {
    icon: Truck,
    title: 'Supply and orders',
    text: 'Supply begins against agreed requirements, and you follow orders and payouts in your supplier account.',
  },
];

export interface SupplyModel {
  icon: LucideIcon;
  title: string;
  best: string;
  points: string[];
}

export const supplyModels: SupplyModel[] = [
  {
    icon: Warehouse,
    title: 'Wholesale supply',
    best: 'For suppliers who can supply approved products in agreed quantities.',
    points: ['Supply against agreed commercial requirements', 'Order volumes confirmed with our team', 'Stock held in your own warehouse'],
  },
  {
    icon: Truck,
    title: 'Brand and distributor supply',
    best: 'For distributors and brand owners with authorised product lines.',
    points: ['Supply recognised brands you are authorised to sell', 'Brand authorisation reviewed where it applies', 'Product ranges agreed line by line'],
  },
  {
    icon: Boxes,
    title: 'Catalogue partnership',
    best: 'For suppliers with a wide range who want us to find the fit.',
    points: ['Share a broader catalogue for review', 'We identify items that match current demand', 'Add more products over time'],
  },
];

export interface SupplierCategory {
  name: string;
  text: string;
  image: string;
}

/** Categories reviewed today — interest, not a demand promise. */
export const supplierCategories: SupplierCategory[] = [
  { name: 'Electronics', text: 'Consumer electronics and accessories.', image: catElectronics },
  { name: 'Mobile accessories', text: 'Cases, cables, chargers and audio.', image: catMobile },
  { name: 'Home & kitchen', text: 'Household, kitchen and small appliances.', image: catHome },
  { name: 'Health & beauty', text: 'Personal care and beauty products.', image: catBeauty },
  { name: 'Fashion accessories', text: 'Bags, watches and everyday accessories.', image: catFashion },
  { name: 'Automotive accessories', text: 'Car care and in-car accessories.', image: catAutomotive },
  { name: 'Food & beverage', text: 'Packaged food and drink lines.', image: catFood },
  { name: 'Packaging & supplies', text: 'Packaging, labels and operational supplies.', image: catPackaging },
];

export const supplierRequirements: SupplierItem[] = [
  {
    icon: Building2,
    title: 'A registered business',
    text: 'A trade licence or company registration, with your owner or authorised person ID. Individual traders can apply too.',
  },
  {
    icon: FileText,
    title: 'Documents where they apply',
    text: 'VAT certificate and brand authorisation are asked for when relevant, and a bank document before your first payout.',
  },
  {
    icon: PackageSearch,
    title: 'A relevant product catalogue',
    text: 'Product details we can review: names, specifications, images and barcodes where you have them.',
  },
  {
    icon: Warehouse,
    title: 'Reliable supply capability',
    text: 'Stock you can supply consistently from a warehouse address you can confirm.',
  },
  {
    icon: ScrollText,
    title: 'Workable commercial terms',
    text: 'Supply pricing that works for e-commerce selling. Terms are agreed during review, not published here.',
  },
];

export const supplierChannels: SupplierItem[] = [
  {
    icon: Store,
    title: 'Tejaraa Shop',
    text: 'Approved products can be offered to retail customers on the Tejaraa storefront.',
  },
  {
    icon: Truck,
    title: 'Sellers we supply',
    text: 'Products can be supplied to e-commerce sellers who use Tejaraa sourcing and fulfilment.',
  },
  {
    icon: Globe2,
    title: 'Business buyers',
    text: 'Wholesale quantities can be offered to business buyers in the markets we serve.',
  },
];

export const supplierTrust: SupplierItem[] = [
  { icon: BadgeCheck, title: 'E-commerce experience', text: 'Our team works with online retail and marketplace supply day to day.' },
  { icon: ClipboardCheck, title: 'Structured product review', text: 'Products are reviewed for commercial and operational fit before onboarding.' },
  { icon: ScrollText, title: 'Clear commercial process', text: 'Pricing and supply terms are agreed in writing with your company.' },
  { icon: Handshake, title: 'Partnership focus', text: 'We aim for repeat supply relationships rather than one-off purchases.' },
];

export interface SupplierFaq { q: string; a: string }

export const supplierFaqs: SupplierFaq[] = [
  {
    q: 'Who can become a Tejaraa supplier?',
    a: 'Manufacturers, distributors, wholesalers, importers and individual traders can all apply. You pick your business type in the application.',
  },
  {
    q: 'Do I need to be a manufacturer?',
    a: 'No. Distributors, wholesalers and importers are welcome. What matters is that you can supply the products consistently.',
  },
  {
    q: 'Which product categories do you review?',
    a: 'The categories on this page are what we look at today. If your range sits close to one of them, send it in.',
  },
  {
    q: 'What documents do you ask for?',
    a: 'Trade licence or company registration and the owner or authorised person ID. VAT certificate, brand authorisation and a bank document where they apply.',
  },
  {
    q: 'Do I need brand authorisation?',
    a: 'Only for branded products where the brand requires it. Own-brand and unbranded products do not need it.',
  },
  {
    q: 'How do I share my catalogue?',
    a: 'Send it during the review conversation with our team, or add products in your supplier account once your business is approved.',
  },
  {
    q: 'Does becoming an approved supplier guarantee orders?',
    a: 'No. Approval means we can work with your company. What we buy, and when, depends on category fit, demand and agreed terms.',
  },
  {
    q: 'What are the payment and order terms?',
    a: 'Commercial terms depend on the products and supply model, so they are agreed with your company during review.',
  },
  {
    q: 'How do I get started?',
    a: 'Start the supplier application, add your company details and documents, and our team will take it from there.',
  },
];
