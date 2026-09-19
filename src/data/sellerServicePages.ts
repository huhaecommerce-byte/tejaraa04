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

export interface IconItem {
  icon?: LucideIcon;
  title: string;
  text: string;
}

export interface ProcessStep {
  title: string;
  text: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ServicePageConfig {
  slug: string;
  path: string;
  navLabel: string;
  icon: LucideIcon;
  seo: { title: string; description: string };
  hero: { title: string; lead: string; tags: string[] };
  overview: { title: string; paragraphs: string[] };
  audience: { title: string; items: IconItem[] };
  process: { title: string; note?: string; steps: ProcessStep[] };
  split?: { title: string; tejaraa: string[]; you: string[] };
  benefits: { title: string; items: IconItem[] };
  requirements?: { title: string; intro?: string; items: string[]; note?: string };
  related: string[];
  faqs: FaqItem[];
  cta: { title: string; text: string; primaryLabel: string; secondaryLabel: string };
}

const sharedFaqStart: FaqItem = {
  q: 'How do I get started?',
  a: 'Create a seller account and tell us which service you need, or send an enquiry from this page and our team will follow up with the next step for your business.',
};

const sharedFaqPricing: FaqItem = {
  q: 'How is pricing calculated?',
  a: 'Pricing depends on your products, volume and services, so we quote per business. Request pricing here or from your seller account.',
};

const sharedFaqRegion: FaqItem = {
  q: 'Which region does Tejaraa serve?',
  a: 'Tejaraa is built for e-commerce sellers in Saudi Arabia, with storage and delivery inside the Kingdom and sourcing from local and overseas suppliers.',
};

export const servicePages: ServicePageConfig[] = [
  /* ── Product hunting ───────────────────────────────────────────── */
  {
    slug: 'product-hunting',
    path: '/selling/product-hunting',
    navLabel: 'Product Hunting',
    icon: Search,
    seo: {
      title: 'Product Hunting for Online Sellers — Tejaraa Seller Services',
      description:
        'Discover product opportunities for your store or marketplace based on your category, market and selling goals, then move straight into sourcing with Tejaraa.',
    },
    hero: {
      title: 'Product Hunting with Tejaraa',
      lead: 'Discover product opportunities based on your category, market and selling goals — before you commit to stock.',
      tags: ['Category research', 'Product shortlists', 'Sourcing-ready'],
    },
    overview: {
      title: 'What is product hunting?',
      paragraphs: [
        'Product hunting is the research step before you buy anything. Tell us your category, your market and the kind of products you want to carry, and our team looks for options that fit.',
        'You get a shortlist to review. You decide what to sell — and we can take the ones you like straight into sourcing.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: Rocket, title: 'New sellers', text: 'You want to start selling but have not decided which products to launch with.' },
        { icon: Store, title: 'Existing stores', text: 'You already sell and want to add products that suit your current audience.' },
        { icon: ShoppingBag, title: 'Marketplace sellers', text: 'You are looking for products to list on the marketplace channels you already use.' },
        { icon: Layers, title: 'Catalogue expansion', text: 'You want to widen your range without researching every category yourself.' },
      ],
    },
    process: {
      title: 'How product hunting works',
      note: 'Research takes time and depends on the category. We share what we find — the buying decision is always yours.',
      steps: [
        { title: 'Define market & category', text: 'Tell us who you sell to, which categories interest you and any constraints.' },
        { title: 'Research products', text: 'We look for product options that match your brief and are realistic to source.' },
        { title: 'Review opportunities', text: 'You get the options with the details you need to compare them.' },
        { title: 'Shortlist products', text: 'You pick the products you want to take further.' },
        { title: 'Move to sourcing', text: 'Shortlisted products move into a sourcing request with Tejaraa.' },
      ],
    },
    split: {
      title: 'What we handle, what you decide',
      tejaraa: ['Category and product research', 'Realistic supply options', 'Presenting the shortlist', 'Taking approved items into sourcing'],
      you: ['Your market and category direction', 'Your selling price and margins', 'Which products to shortlist', 'The final decision to buy'],
    },
    benefits: {
      title: 'Why sellers use it',
      items: [
        { icon: ListChecks, title: 'Fewer blind bets', text: 'Review options against your own criteria before spending on stock.' },
        { icon: Handshake, title: 'Research plus supply', text: 'The same team that researches the product can help you source it.' },
        { icon: MapPin, title: 'Local relevance', text: 'Research framed around selling in the Saudi market.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      intro: 'A short brief is enough to start.',
      items: ['The categories or product types you are interested in', 'Who your customers are and where you sell', 'Any budget or order size you have in mind', 'The channel you plan to list on'],
    },
    related: ['product-sourcing', 'dropshipping'],
    faqs: [
      { q: 'Do you guarantee that the products will sell?', a: 'No. We help you find and evaluate options, but no one can guarantee sales. The decision on what to list and at what price stays with you.' },
      { q: 'Do I have to buy the products you find?', a: 'No. Product hunting gives you a shortlist. You choose whether to move any of it into sourcing.' },
      { q: 'Can you research a very specific product?', a: 'Yes. If you already have a product in mind, send us the details and we will look at supply options for it directly.' },
      sharedFaqPricing,
      sharedFaqStart,
    ],
    cta: {
      title: 'Looking for your next product?',
      text: 'Tell us the category you want to sell in and we will come back with realistic options.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Talk to Tejaraa',
    },
  },

  /* ── Product sourcing ──────────────────────────────────────────── */
  {
    slug: 'product-sourcing',
    path: '/selling/product-sourcing',
    navLabel: 'Product Sourcing',
    icon: Globe2,
    seo: {
      title: 'Product Sourcing in Saudi Arabia for E-Commerce Sellers — Tejaraa',
      description:
        'Source products from local and overseas suppliers with Tejaraa. Supplier coordination, cost and availability review, procurement support and preparation for fulfilment.',
    },
    hero: {
      title: 'Product Sourcing with Tejaraa',
      lead: 'Source products from local and overseas suppliers without managing the full procurement process yourself.',
      tags: ['Supplier coordination', 'Cost & availability', 'Local and overseas'],
    },
    overview: {
      title: 'What product sourcing covers',
      paragraphs: [
        'Sourcing covers everything between deciding what you want and having it ready to sell: finding it, coordinating suppliers, checking cost and availability, placing the order.',
        'Start with a single test order or repeat bulk orders as demand builds. Stock can ship to you or stay with Tejaraa for storage and fulfilment.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: ShoppingBag, title: 'Marketplace sellers', text: 'You need supply for the marketplace channels you already sell on.' },
        { icon: Store, title: 'Online stores', text: 'You run your own store and want a simpler way to buy stock.' },
        { icon: Building2, title: 'Growing brands', text: 'You need repeat supply as your volume becomes more predictable.' },
        { icon: Layers, title: 'Sellers expanding catalogue', text: 'You want to add new lines without new supplier relationships of your own.' },
      ],
    },
    process: {
      title: 'How sourcing works',
      steps: [
        { title: 'Tell us what you need', text: 'Share the product, specification, quantity and any deadline.' },
        { title: 'Identify product & supplier options', text: 'We look for supply options that match the request.' },
        { title: 'Review cost & availability', text: 'You see cost and availability before committing.' },
        { title: 'Confirm the order', text: 'You approve the option you want and we place the order.' },
        { title: 'Prepare for fulfilment', text: 'Stock is received and prepared, or dispatched to you.' },
      ],
    },
    benefits: {
      title: 'Why sellers use it',
      items: [
        { icon: Handshake, title: 'Flexible quantities', text: 'Test with a small order, then scale up when the product works.' },
        { icon: Globe2, title: 'Local and overseas supply', text: 'Options from inside the Kingdom and from overseas suppliers.' },
        { icon: Warehouse, title: 'Straight into fulfilment', text: 'Sourced stock can move directly into storage and order fulfilment.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      items: ['The product or specification you want sourced', 'Quantity or order size', 'Target market and channel', 'Any timing or compliance requirement you must meet'],
      note: 'Cost and availability are confirmed per request — we do not quote a fixed sourcing price before we look at the product.',
    },
    related: ['product-hunting', 'warehousing', 'fulfillment'],
    faqs: [
      { q: 'Do you promise the lowest price?', a: 'No. We look for realistic supply options and show you the cost so you can decide. We do not claim to beat every market price.' },
      { q: 'Can I order a single unit?', a: 'Yes, sample and small orders are possible for many products. Minimum quantities depend on the supplier and product.' },
      { q: 'Can you source from overseas?', a: 'Yes. We work with both local and overseas suppliers depending on the product.' },
      { q: 'Where does the stock go after sourcing?', a: 'You choose: it can be shipped to you, or kept with Tejaraa for storage, preparation and order fulfilment.' },
      sharedFaqPricing,
      sharedFaqStart,
    ],
    cta: {
      title: 'Need a product sourced?',
      text: 'Send us the product details and we will come back with cost and availability options.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Request Pricing',
    },
  },

  /* ── Dropshipping ──────────────────────────────────────────────── */
  {
    slug: 'dropshipping',
    path: '/selling/dropshipping',
    navLabel: 'Dropshipping',
    icon: Package,
    seo: {
      title: 'Dropshipping in Saudi Arabia — Tejaraa Seller Services',
      description:
        'Sell without holding your own inventory. Tejaraa supplies the products and prepares, packs and dispatches each order you send for delivery in Saudi Arabia.',
    },
    hero: {
      title: 'Dropshipping with Tejaraa',
      lead: 'Sell products without managing traditional inventory yourself — you list and sell, we supply and fulfil each order.',
      tags: ['No inventory upfront', 'Order-by-order', 'Delivery in Saudi Arabia'],
    },
    overview: {
      title: 'What dropshipping means with Tejaraa',
      paragraphs: [
        'You list products without buying stock in advance. When a customer orders, that order comes to Tejaraa — we prepare, pack and dispatch it to your customer.',
        'You keep the customer relationship, the storefront and the pricing. Tejaraa handles product supply and the fulfilment side of each order you send.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: Rocket, title: 'New sellers', text: 'You want to start selling without buying stock first.' },
        { icon: Store, title: 'Existing stores', text: 'You want to add products without adding inventory risk.' },
        { icon: ShoppingBag, title: 'Marketplace sellers', text: 'You sell on marketplace channels and want supply per order.' },
        { icon: LineChart, title: 'Testing new products', text: 'You want to try a product line before committing to volume.' },
      ],
    },
    process: {
      title: 'How dropshipping works',
      note: 'Orders are sent to Tejaraa from your channel. Automatic syncing depends on your plan — where it is not enabled, orders are submitted from your seller account.',
      steps: [
        { title: 'Choose products', text: 'Pick the products you want to sell from what is available through Tejaraa.' },
        { title: 'List products', text: 'Add them to your store or marketplace listing with your own pricing.' },
        { title: 'Receive a customer order', text: 'Your customer buys from you on your channel.' },
        { title: 'Send the order to Tejaraa', text: 'Submit the order from your seller account, or through a supported channel connection.' },
        { title: 'We prepare the order', text: 'The order is picked, packed and labelled for dispatch.' },
        { title: 'Order delivered', text: 'The order is dispatched for delivery to your customer.' },
      ],
    },
    split: {
      title: 'Who handles what',
      tejaraa: ['Product supply', 'Order preparation and packing', 'Labelling for dispatch', 'Delivery handover for supported areas'],
      you: ['Your storefront or marketplace listing', 'Marketing and customer acquisition', 'Product selection and pricing', 'Your customer communication'],
    },
    benefits: {
      title: 'Why sellers choose it',
      items: [
        { icon: Package, title: 'No inventory upfront', text: 'You pay per order instead of buying stock in advance.' },
        { icon: SlidersHorizontal, title: 'Easy to test', text: 'Add or drop products without stock left over.' },
        { icon: Truck, title: 'Fulfilment included', text: 'Preparation, packing and dispatch are handled for the orders you send.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      items: ['A store or marketplace account where you sell', 'The products you want to list', 'Order details, including the delivery address for each order', 'The delivery region you serve'],
    },
    related: ['product-sourcing', 'integrations', 'fulfillment'],
    faqs: [
      { q: 'Do I need to buy inventory first?', a: 'No. With dropshipping you sell first and the order is fulfilled per order, so there is no stock to buy upfront.' },
      { q: 'How are orders fulfilled?', a: 'Each order you send is picked, packed and labelled by Tejaraa and then dispatched for delivery to your customer.' },
      { q: 'Is everything automatic?', a: 'Not by default. Supported channels can be registered on your account and syncing depends on your plan; otherwise you submit orders from your seller account.' },
      { q: 'Which sales channels are supported?', a: 'You can register store and marketplace channels such as Shopify, WooCommerce, Amazon Seller and Noon Seller, and add other channels manually.' },
      { q: 'Who talks to the customer?', a: 'You do. You own the storefront, the pricing and the customer relationship.' },
      sharedFaqPricing,
      sharedFaqStart,
    ],
    cta: {
      title: 'Start dropshipping with Tejaraa',
      text: 'Create your seller account and choose the products you want to list — no stock to buy first.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Talk to Tejaraa',
    },
  },

  /* ── Fulfilment ────────────────────────────────────────────────── */
  {
    slug: 'fulfillment',
    path: '/selling/fulfillment',
    navLabel: 'Order Fulfilment',
    icon: Truck,
    seo: {
      title: 'E-Commerce Order Fulfilment in Saudi Arabia — Tejaraa',
      description:
        'Order fulfilment for online sellers: inventory intake, picking, packing, labelling and dispatch for your store and marketplace orders in Saudi Arabia.',
    },
    hero: {
      title: 'Order Fulfilment with Tejaraa',
      lead: 'For sellers who already have inventory and need operational support to process customer orders.',
      tags: ['Pick & pack', 'Labelling', 'Dispatch'],
    },
    overview: {
      title: 'What fulfilment covers',
      paragraphs: [
        'Fulfilment is the work behind every order: stock received and stored, orders arriving from your channels, each one picked, packed, labelled and dispatched.',
        'You can use fulfilment for stock you sourced through Tejaraa or for inventory you already own and send to us.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: Store, title: 'Store owners', text: 'You run your own store and order volume is taking too much of your time.' },
        { icon: ShoppingBag, title: 'Marketplace sellers', text: 'You need orders prepared to the requirements of the channel you sell on.' },
        { icon: Building2, title: 'Growing brands', text: 'Your volume is rising and packing at home no longer works.' },
        { icon: Boxes, title: 'Sellers holding stock', text: 'You already own inventory and need somewhere to run operations from.' },
      ],
    },
    process: {
      title: 'The fulfilment process',
      steps: [
        { title: 'Inventory received', text: 'Your stock arrives and is checked in.' },
        { title: 'Order received', text: 'Orders come from your seller account or a registered channel.' },
        { title: 'Pick', text: 'Items are picked against the order.' },
        { title: 'Pack & label', text: 'The order is packed and labelled for its destination.' },
        { title: 'Dispatch & handover', text: 'The order is dispatched and handed over for delivery.' },
      ],
    },
    split: {
      title: 'Who handles what',
      tejaraa: ['Receiving and storing your stock', 'Picking and packing orders', 'Labelling for delivery or marketplace', 'Dispatch and delivery handover'],
      you: ['Selling and pricing', 'Sending orders to Tejaraa', 'Keeping stock levels topped up', 'Customer service'],
    },
    benefits: {
      title: 'Why sellers use it',
      items: [
        { icon: ClipboardCheck, title: 'Consistent preparation', text: 'Orders prepared the same way every time, to your channel requirements.' },
        { icon: MapPin, title: 'Operations inside the Kingdom', text: 'Stock and dispatch handled locally in Saudi Arabia.' },
        { icon: Layers, title: 'Works with your other services', text: 'Combine with sourcing, warehousing and marketplace preparation.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      items: ['Product details and quantities you will send in', 'Store or marketplace details for your orders', 'An order volume estimate', 'The delivery region you serve'],
    },
    related: ['warehousing', 'packaging-labeling', 'marketplace-preparation'],
    faqs: [
      { q: 'Can you fulfil stock I already own?', a: 'Yes. You can send in inventory you bought elsewhere and use Tejaraa for storage and order fulfilment.' },
      { q: 'How do my orders reach Tejaraa?', a: 'Orders are submitted from your seller account, or come through a channel you registered on your account, depending on your plan.' },
      { q: 'Do you handle marketplace orders?', a: 'Yes. Orders for supported marketplace channels can be prepared to those channels’ requirements.' },
      { q: 'What about returns?', a: 'Returns handling is part of our seller operations. The exact process depends on your channel and service setup, so we confirm it with you when you start.' },
      sharedFaqPricing,
      sharedFaqRegion,
    ],
    cta: {
      title: 'Hand over your order operations',
      text: 'Tell us your product mix and monthly order volume and we will prepare a fulfilment setup and quote.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Request Pricing',
    },
  },

  /* ── Warehousing ───────────────────────────────────────────────── */
  {
    slug: 'warehousing',
    path: '/selling/warehousing',
    navLabel: 'Warehousing',
    icon: Warehouse,
    seo: {
      title: 'Warehousing for Online Sellers in Saudi Arabia — Tejaraa',
      description:
        'Store your e-commerce inventory inside Saudi Arabia with Tejaraa. Inventory receiving, storage, stock readiness and a direct link into order fulfilment.',
    },
    hero: {
      title: 'Warehousing with Tejaraa',
      lead: 'Store inventory inside Saudi Arabia and release it whenever your orders come in.',
      tags: ['Inventory intake', 'Storage', 'Release on demand'],
    },
    overview: {
      title: 'What warehousing covers',
      paragraphs: [
        'Warehousing keeps stock ready to ship without filling your own space. Inventory is received, checked in, stored under your seller account and released for orders or marketplace transfers.',
        'It works on its own or together with fulfilment, so the same stock that is stored can be picked and dispatched for your orders.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: Boxes, title: 'Sellers holding stock', text: 'You buy in quantity and need somewhere to keep it ready.' },
        { icon: Building2, title: 'Growing brands', text: 'Your inventory has outgrown home or office storage.' },
        { icon: ShoppingBag, title: 'Marketplace sellers', text: 'You need stock staged before sending it to a marketplace.' },
        { icon: Globe2, title: 'Importers', text: 'You bring stock in and want it received and stored locally.' },
      ],
    },
    process: {
      title: 'How warehousing works',
      steps: [
        { title: 'Inventory receiving', text: 'Your shipment arrives and is checked in against what you declared.' },
        { title: 'Storage', text: 'Stock is stored and tracked under your seller account.' },
        { title: 'Stock readiness', text: 'Items are kept ready for orders or marketplace transfers.' },
        { title: 'Release', text: 'You request a release and the stock moves into fulfilment or a transfer.' },
      ],
    },
    benefits: {
      title: 'Why sellers use it',
      items: [
        { icon: MapPin, title: 'Stock held locally', text: 'Inventory sits inside Saudi Arabia, close to your customers.' },
        { icon: Truck, title: 'Connected to fulfilment', text: 'Stored stock can be picked and dispatched without moving it elsewhere.' },
        { icon: ClipboardCheck, title: 'Visibility on your account', text: 'Your stored inventory is tracked in your seller account.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      items: ['A list of the products and quantities you will send in', 'Product dimensions or packaging details where relevant', 'How long you expect to store the stock', 'Whether stock will be used for orders, marketplace transfers, or both'],
      note: 'Storage terms are confirmed per seller based on your product mix and volume.',
    },
    related: ['fulfillment', 'packaging-labeling', 'product-sourcing'],
    faqs: [
      { q: 'Where is my stock stored?', a: 'Inside Saudi Arabia. Specific facility details are confirmed with you directly when your storage setup is agreed.' },
      { q: 'Is there a minimum or maximum quantity?', a: 'This depends on your product mix and volume, so it is agreed per seller rather than published as a fixed limit.' },
      { q: 'Can I get stock back out?', a: 'Yes. You can request a release for orders, for a marketplace transfer, or to have stock sent to you.' },
      { q: 'Can warehousing be used without fulfilment?', a: 'Yes, storage can be used on its own, though most sellers combine it with fulfilment.' },
      sharedFaqPricing,
      sharedFaqStart,
    ],
    cta: {
      title: 'Need somewhere to keep your stock?',
      text: 'Share your product mix and expected volume and we will prepare a storage setup and quote.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Request Pricing',
    },
  },

  /* ── Packaging & labelling ─────────────────────────────────────── */
  {
    slug: 'packaging-labeling',
    path: '/selling/packaging-labeling',
    navLabel: 'Packaging & Labelling',
    icon: Tags,
    seo: {
      title: 'Packaging & Labelling for E-Commerce Orders — Tejaraa',
      description:
        'Order packing, protective packaging, shipping labels, product labels, barcodes and marketplace labelling prepared by Tejaraa for online sellers in Saudi Arabia.',
    },
    hero: {
      title: 'Packaging & Labelling with Tejaraa',
      lead: 'Get products packed and labelled the way your delivery or marketplace channel requires.',
      tags: ['Barcodes', 'Shipping labels', 'Order packing'],
    },
    overview: {
      title: 'What this service covers',
      paragraphs: [
        'Every channel expects the right barcode, the right label in the right place, packed to survive the trip. This service handles that preparation.',
        'It is used for outgoing customer orders and for inventory being prepared before a marketplace transfer.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: ShoppingBag, title: 'Marketplace sellers', text: 'Your inventory has to meet channel labelling requirements.' },
        { icon: Store, title: 'Store owners', text: 'You want orders packed consistently for every customer.' },
        { icon: Boxes, title: 'Bulk importers', text: 'Stock arrives unlabelled and needs preparing before it can be sold.' },
        { icon: Building2, title: 'Growing brands', text: 'Volume has made manual packing at home impractical.' },
      ],
    },
    process: {
      title: 'How preparation works',
      steps: [
        { title: 'Tell us the requirement', text: 'Share the channel and labelling rules your products must meet.' },
        { title: 'Stock is checked in', text: 'Items are received and reviewed against the requirement.' },
        { title: 'Label & barcode', text: 'Product labels, barcodes and channel labels are applied.' },
        { title: 'Pack', text: 'Items are bagged, bundled or boxed with protective packaging as needed.' },
        { title: 'Ready to ship', text: 'Prepared stock moves into fulfilment or a marketplace shipment.' },
      ],
    },
    benefits: {
      title: 'What you get',
      items: [
        { icon: ScanBarcode, title: 'Correct barcodes', text: 'Barcode and product labels applied to the specification you give us.' },
        { icon: Truck, title: 'Shipping labels', text: 'Delivery labels applied so orders can be dispatched without delay.' },
        { icon: Package, title: 'Protective packing', text: 'Products bagged, bundled or boxed so they arrive intact.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      items: ['The channel requirement or labelling specification to follow', 'Barcode or label artwork where you supply your own', 'Quantities and product details', 'Any packaging preference you need respected'],
      note: 'Custom-branded packaging is not part of the standard service — ask us if you need something specific and we will tell you what is possible.',
    },
    related: ['marketplace-preparation', 'fulfillment', 'warehousing'],
    faqs: [
      { q: 'Which labels can you apply?', a: 'Shipping labels, product labels, barcode labels and labels required by supported marketplace channels.' },
      { q: 'Can you use my own branded packaging?', a: 'Standard packaging is used by default. If you have specific packaging or inserts in mind, contact us and we will confirm what is possible for your products.' },
      { q: 'Do you supply the barcodes?', a: 'Barcodes are applied to the specification you provide. If you do not have one yet, tell us and we will advise on the requirement for your channel.' },
      { q: 'Can this be done for stock already stored with Tejaraa?', a: 'Yes. Stock in storage can be prepared and labelled before it is dispatched or transferred.' },
      sharedFaqPricing,
      sharedFaqStart,
    ],
    cta: {
      title: 'Get your products channel-ready',
      text: 'Send us your labelling requirement and product details and we will confirm the preparation setup.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Talk to Tejaraa',
    },
  },

  /* ── Marketplace preparation ───────────────────────────────────── */
  {
    slug: 'marketplace-preparation',
    path: '/selling/marketplace-preparation',
    navLabel: 'Marketplace Preparation',
    icon: ClipboardCheck,
    seo: {
      title: 'Marketplace Fulfilment Preparation (Amazon & Noon) — Tejaraa',
      description:
        'Prepare inventory for marketplace fulfilment requirements. Tejaraa handles labelling, barcodes, packing and shipment preparation for Amazon and Noon seller inventory.',
    },
    hero: {
      title: 'Marketplace Preparation with Tejaraa',
      lead: 'Prepare your inventory for the fulfilment requirements of the marketplaces you sell on, including Amazon and Noon.',
      tags: ['Label preparation', 'Barcode requirements', 'Shipment preparation'],
    },
    overview: {
      title: 'What marketplace preparation covers',
      paragraphs: [
        'Marketplaces accept inventory only when it is labelled, packed and documented their way. This service prepares your stock before it is sent in.',
        'Tejaraa is an independent service provider. We prepare inventory for marketplace requirements — we are not Amazon or Noon and we are not describing an official partnership with them.',
      ],
    },
    audience: {
      title: 'Who it is for',
      items: [
        { icon: ShoppingBag, title: 'Amazon sellers', text: 'You send inventory into Amazon fulfilment and need it prepared correctly.' },
        { icon: Store, title: 'Noon sellers', text: 'You send inventory into Noon fulfilment and need shipments prepared.' },
        { icon: Boxes, title: 'Bulk importers', text: 'Stock arrives in bulk and needs unit-level preparation.' },
        { icon: Building2, title: 'Multi-channel sellers', text: 'You sell across marketplaces and your own store.' },
      ],
    },
    process: {
      title: 'How preparation works',
      note: 'Requirements are set by each marketplace and can change. We prepare to the requirement that applies to your account and products.',
      steps: [
        { title: 'Share the requirement', text: 'Tell us the marketplace, the programme and the products going in.' },
        { title: 'Stock received', text: 'Inventory is checked in, from your supplier or from your storage with us.' },
        { title: 'Label & barcode', text: 'Unit labels and barcodes are applied to the marketplace requirement.' },
        { title: 'Pack to spec', text: 'Items are bagged, bundled and boxed as the programme requires.' },
        { title: 'Shipment prepared', text: 'Cartons are prepared and labelled for the inbound shipment.' },
      ],
    },
    split: {
      title: 'Who handles what',
      tejaraa: ['Unit labelling and barcodes', 'Packing to programme requirements', 'Carton and shipment preparation', 'Handover for the inbound shipment'],
      you: ['Your marketplace seller account', 'Creating the inbound shipment plan on the marketplace', 'Listings and pricing', 'Sharing the current requirement for your account'],
    },
    benefits: {
      title: 'Why sellers use it',
      items: [
        { icon: ClipboardCheck, title: 'Fewer rejected shipments', text: 'Inventory prepared against the requirement before it leaves.' },
        { icon: ScanBarcode, title: 'Unit-level labelling', text: 'Barcodes and labels applied per unit where the programme requires it.' },
        { icon: Warehouse, title: 'Works with your storage', text: 'Prepare stock that is already stored with Tejaraa.' },
      ],
    },
    requirements: {
      title: 'What we need from you',
      items: ['The marketplace and fulfilment programme you are using', 'The current labelling requirement for your account', 'Products and quantities in the shipment', 'The shipment plan or destination once created'],
    },
    related: ['packaging-labeling', 'fulfillment', 'integrations'],
    faqs: [
      { q: 'Is Tejaraa an Amazon or Noon partner?', a: 'No. Tejaraa is an independent service provider that prepares seller inventory to marketplace requirements. We are not affiliated with or endorsed by Amazon or Noon.' },
      { q: 'Can you prepare inventory for Amazon fulfilment?', a: 'Yes. We prepare labelling, barcodes, packing and cartons for Amazon fulfilment shipments based on the requirement for your account.' },
      { q: 'Can you prepare inventory for Noon fulfilment?', a: 'Yes, the same preparation applies to Noon fulfilment shipments.' },
      { q: 'Do you create the shipment on the marketplace?', a: 'The shipment plan is created on your marketplace seller account. We prepare and label the inventory and cartons for it.' },
      { q: 'Can you prepare stock I already store with you?', a: 'Yes. Stock in storage with Tejaraa can be prepared for a marketplace shipment without shipping it elsewhere first.' },
      sharedFaqPricing,
    ],
    cta: {
      title: 'Preparing a marketplace shipment?',
      text: 'Tell us the marketplace and what is going in, and we will prepare the inventory to requirement.',
      primaryLabel: 'Get Started',
      secondaryLabel: 'Talk to Tejaraa',
    },
  },
];

export const servicePageBySlug = Object.fromEntries(servicePages.map((page) => [page.slug, page]));

/** Extra destinations that appear in navigation and related-service blocks. */
export const sellerExtraPages = {
  integrations: {
    slug: 'integrations',
    path: '/selling/integrations',
    navLabel: 'Integrations',
    icon: Plug,
    blurb: 'See which sales channels you can register and how orders reach Tejaraa.',
  },
  howItWorks: {
    slug: 'how-it-works',
    path: '/selling/how-it-works',
    navLabel: 'How It Works',
    icon: ListChecks,
    blurb: 'The full seller journey, from choosing a model to scaling.',
  },
} as const;

/** Channels a seller can register today, with an honest support level. */
export type ChannelSupport = 'Connected integration' | 'Supported workflow' | 'Manual / assisted setup';

export interface ChannelCard {
  icon: LucideIcon;
  name: string;
  kind: 'Store platform' | 'Marketplace' | 'Other';
  support: ChannelSupport;
  text: string;
}

export const sellerChannelCards: ChannelCard[] = [
  {
    icon: ShoppingBag,
    name: 'Shopify',
    kind: 'Store platform',
    support: 'Supported workflow',
    text: 'Register your Shopify store on your seller account and run sourcing and fulfilment against it. Order syncing depends on your plan.',
  },
  {
    icon: Globe2,
    name: 'WooCommerce',
    kind: 'Store platform',
    support: 'Supported workflow',
    text: 'Register your WooCommerce store and submit orders for fulfilment from your seller account.',
  },
  {
    icon: Package,
    name: 'Amazon Seller',
    kind: 'Marketplace',
    support: 'Supported workflow',
    text: 'Operational support for Amazon sellers: sourcing, preparation and fulfilment shipment preparation.',
  },
  {
    icon: Store,
    name: 'Noon Seller',
    kind: 'Marketplace',
    support: 'Supported workflow',
    text: 'Operational support for Noon sellers, including inventory preparation for Noon fulfilment.',
  },
  {
    icon: Boxes,
    name: 'Other channels',
    kind: 'Other',
    support: 'Manual / assisted setup',
    text: 'Selling somewhere else, including Salla or Zid? Register the channel manually and our team will confirm the workflow with you.',
  },
];

export interface JourneyPath {
  id: string;
  icon: LucideIcon;
  title: string;
  steps: string[];
  note: string;
  links: { label: string; to: string }[];
}

export const sellerJourneys: JourneyPath[] = [
  {
    id: 'new-store',
    icon: Rocket,
    title: 'I am starting a new store',
    steps: ['Product hunting', 'Sourcing or dropshipping', 'List on your channel', 'Fulfilment'],
    note: 'You build and run the storefront yourself — Tejaraa handles the product and order side.',
    links: [
      { label: 'Product Hunting', to: '/selling/product-hunting' },
      { label: 'Dropshipping', to: '/selling/dropshipping' },
    ],
  },
  {
    id: 'existing-store',
    icon: Store,
    title: 'I already have an online store',
    steps: ['Register your channel', 'Add products', 'Send orders', 'Fulfilment'],
    note: 'Register your store on your seller account. The level of order syncing depends on your plan.',
    links: [
      { label: 'Integrations', to: '/selling/integrations' },
      { label: 'Order Fulfilment', to: '/selling/fulfillment' },
    ],
  },
  {
    id: 'marketplace',
    icon: ShoppingBag,
    title: 'I sell on marketplaces',
    steps: ['Source inventory', 'Prepare products', 'Marketplace or seller fulfilment'],
    note: 'Preparation follows the requirement of the marketplace programme you use.',
    links: [
      { label: 'Marketplace Preparation', to: '/selling/marketplace-preparation' },
      { label: 'Product Sourcing', to: '/selling/product-sourcing' },
    ],
  },
  {
    id: 'have-inventory',
    icon: Boxes,
    title: 'I have inventory but need fulfilment',
    steps: ['Send stock in', 'Storage', 'Pick, pack, label', 'Dispatch'],
    note: 'Works with stock you bought anywhere, not only stock sourced through Tejaraa.',
    links: [
      { label: 'Warehousing', to: '/selling/warehousing' },
      { label: 'Order Fulfilment', to: '/selling/fulfillment' },
    ],
  },
  {
    id: 'expand',
    icon: Layers,
    title: 'I want to expand my catalogue',
    steps: ['Product hunting', 'Sourcing', 'List and test', 'Scale what works'],
    note: 'Start with small quantities and increase supply for the products that sell.',
    links: [
      { label: 'Product Hunting', to: '/selling/product-hunting' },
      { label: 'Product Sourcing', to: '/selling/product-sourcing' },
    ],
  },
];

export const sellerTrustStrip: IconItem[] = [
  { icon: PackageSearch, title: 'E-commerce experience', text: 'Seller operations across sourcing, preparation and fulfilment.' },
  { icon: MapPin, title: 'Saudi market focus', text: 'Storage and delivery inside the Kingdom.' },
  { icon: SlidersHorizontal, title: 'Flexible service model', text: 'Use one service or several, and change the mix later.' },
  { icon: Languages, title: 'Arabic & English support', text: 'Work with a team that speaks your customers’ language.' },
];
