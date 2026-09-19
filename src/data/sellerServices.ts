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

export interface SellerService {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  /** Destination: a public service page where one exists, otherwise an in-page anchor. */
  href: string;
}

export const sellerServices: SellerService[] = [
  {
    id: 'product-hunting',
    icon: Search,
    title: 'Product Hunting',
    text: 'Find products with potential for your store before you commit to stock.',
    href: '/selling/product-hunting',
  },
  {
    id: 'product-sourcing',
    icon: Globe2,
    title: 'Product Sourcing',
    text: 'Buy from local and overseas suppliers without running procurement yourself.',
    href: '/selling/product-sourcing',
  },
  {
    id: 'dropshipping',
    icon: Package,
    title: 'Dropshipping',
    text: 'Sell with no inventory of your own — we fulfil each order.',
    href: '/selling/dropshipping',
  },
  {
    id: 'fulfillment',
    icon: Truck,
    title: 'Order Fulfilment',
    text: 'Picking, packing and dispatch for every order you send us.',
    href: '/selling/fulfillment',
  },
  {
    id: 'warehousing',
    icon: Warehouse,
    title: 'Warehousing',
    text: 'Store stock inside Saudi Arabia and release it as orders come in.',
    href: '/selling/warehousing',
  },
  {
    id: 'packaging',
    icon: Tags,
    title: 'Packaging & Labelling',
    text: 'Barcodes, labels, bagging and bundling to your channel requirements.',
    href: '/selling/packaging-labeling',
  },
  {
    id: 'marketplace-prep',
    icon: ClipboardCheck,
    title: 'Marketplace Preparation',
    text: 'Inventory prepared for Amazon and Noon fulfilment requirements.',
    href: '/selling/marketplace-preparation',
  },
  {
    id: 'integrations',
    icon: Plug,
    title: 'E-Commerce Integrations',
    text: 'Register your stores and marketplace accounts in one place.',
    href: '/selling/integrations',
  },
];

export interface SellerProcessStep {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const sellerProcess: SellerProcessStep[] = [
  { icon: Search, title: 'Find products', text: 'Browse our catalogue or ask us to hunt products for your store.' },
  { icon: PackageSearch, title: 'Source', text: 'Send a sourcing request and we handle the supply side.' },
  { icon: Store, title: 'Connect & sell', text: 'List the products on the sales channels you already use.' },
  { icon: ShoppingBag, title: 'Receive orders', text: 'Send us each order, or manage volume from your seller account.' },
  { icon: Truck, title: 'Fulfil & deliver', text: 'We prepare, pack and dispatch using the service you chose.' },
];

export interface SellerBenefit {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const sellerBenefits: SellerBenefit[] = [
  { icon: Layers, title: 'One partner for several services', text: 'Sourcing, storage, prep and fulfilment under one account.' },
  { icon: Handshake, title: 'Flexible sourcing', text: 'From a single test unit to repeat bulk orders.' },
  { icon: Sparkles, title: 'Less operational complexity', text: 'One partner instead of several service providers to coordinate.' },
  { icon: ClipboardCheck, title: 'Marketplace experience', text: 'Inventory prepared to supported marketplace requirements.' },
  { icon: MapPin, title: 'Saudi market focus', text: 'Warehousing and delivery in the Kingdom, Arabic and English support.' },
  { icon: LineChart, title: 'Built for growing sellers', text: 'Use what you need today, add more as volume grows.' },
];

export interface SellerAudience {
  /** Service page this seller type should start on. */
  to: string;
  linkLabel: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

export const sellerAudiences: SellerAudience[] = [
  { icon: Rocket, title: 'Starting your first store?', text: 'Simplify sourcing and fulfilment while you build the business.', to: '/selling/product-hunting', linkLabel: 'Start with product hunting' },
  { icon: Store, title: 'Already selling online?', text: 'Grow your catalogue without rebuilding your operation.', to: '/selling/integrations', linkLabel: 'Connect your channel' },
  { icon: ShoppingBag, title: 'Selling on marketplaces?', text: 'Source, prepare and fulfil products for supported marketplace channels.', to: '/selling/marketplace-preparation', linkLabel: 'See marketplace preparation' },
  { icon: Building2, title: 'Scaling your brand?', text: 'Add warehousing and fulfilment as volume grows.', to: '/selling/warehousing', linkLabel: 'See warehousing' },
];

export interface SellerModel {
  id: string;
  icon: LucideIcon;
  title: string;
  best: string;
  points: string[];
  /** Service page for this model. */
  to: string;
}

export const sellerModels: SellerModel[] = [
  {
    id: 'dropshipping',
    icon: Package,
    title: 'Dropshipping',
    best: 'For selling without holding inventory.',
    points: ['No inventory to buy upfront', 'Send us each order as it comes in', 'We prepare and dispatch to your customer'],
    to: '/selling/dropshipping',
  },
  {
    id: 'sourcing',
    icon: Globe2,
    title: 'Product Sourcing',
    best: 'For finding and buying the right products.',
    points: ['Product hunting and supplier sourcing', 'Local and overseas supply options', 'Buy single units or repeat bulk orders'],
    to: '/selling/product-sourcing',
  },
  {
    id: 'fulfilment',
    icon: Warehouse,
    title: 'Storage & Fulfilment',
    best: 'For sellers who already hold stock and need storage, prep and delivery.',
    points: ['Store stock inside Saudi Arabia', 'Packaging, labelling and marketplace prep', 'Release stock for orders or marketplace transfers'],
    to: '/selling/fulfillment',
  },
];

export interface SellerChannel {
  icon: LucideIcon;
  label: string;
  note: string;
}

/** Channels sellers can register on their Tejaraa account today. */
export const sellerChannels: SellerChannel[] = [
  { icon: ShoppingBag, label: 'Shopify', note: 'Store channel' },
  { icon: Globe2, label: 'WooCommerce', note: 'Store channel' },
  { icon: Package, label: 'Amazon Seller', note: 'Marketplace channel' },
  { icon: Store, label: 'Noon Seller', note: 'Marketplace channel' },
  { icon: Boxes, label: 'Other channels', note: 'Register manually' },
];

export interface SellerFaq {
  q: string;
  a: string;
}

export const sellerFaqs: SellerFaq[] = [
  {
    q: 'What is Tejaraa Seller Services?',
    a: 'The part of Tejaraa built for e-commerce sellers: product hunting, sourcing, dropshipping, warehousing, packaging, marketplace preparation and fulfilment in one seller account.',
  },
  {
    q: 'Can I use Tejaraa for dropshipping?',
    a: 'Yes. Sell without buying stock upfront — send us each order and we prepare and dispatch it to your customer.',
  },
  {
    q: 'Can Tejaraa help me source products?',
    a: 'Yes. Order from our catalogue, or send a sourcing request and our team works on a supply option.',
  },
  {
    q: 'Do I need to hold my own inventory?',
    a: 'No. Dropshipping needs no stock of your own; warehousing and fulfilment are there if you prefer stock ready inside Saudi Arabia.',
  },
  {
    q: 'Which sales channels can I use with Tejaraa?',
    a: 'Register channels such as Shopify, WooCommerce, Amazon Seller and Noon Seller, and add others manually. Available automation depends on your plan.',
  },
  {
    q: 'Can Tejaraa prepare orders for marketplaces?',
    a: 'Yes — packaging, labelling and prep for supported marketplace requirements, including Amazon and Noon transfers.',
  },
  {
    q: 'Where does Tejaraa operate?',
    a: 'Saudi Arabia: storage and delivery inside the Kingdom, sourcing from local and overseas suppliers.',
  },
  {
    q: 'How do I get started?',
    a: 'Create a seller account, tell us which services you need, then send a sourcing request or your first order. Or contact us to discuss your setup first.',
  },
];
