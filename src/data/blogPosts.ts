export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
}

export interface BlogPost {
  slug: string;
  category: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  date: string;
  sections: BlogSection[];
  faqs: { q: string; a: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-import-goods-from-china-to-saudi-arabia',
    category: 'Sourcing',
    title: 'How to Import Goods from China to Saudi Arabia (Step by Step)',
    metaTitle: 'Import from China to Saudi Arabia: 2026 Guide — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'From finding a factory in Guangzhou to delivering stock to Amazon.sa — the complete import process for Saudi e-commerce sellers, explained step by step.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Step 1: Find and vet your supplier',
        paragraphs: [
          'Most Saudi sellers source on Alibaba, 1688 or Global Sources. The platform matters less than the vetting: check Trade Assurance status, years in business, verified badges, and always request the company business licence. A supplier that hesitates to share documentation is a supplier to avoid.',
          'Order a paid sample before any bulk commitment. Test it against Saudi standards — many products need SASO-compliant test reports before they can legally clear customs, and it is far cheaper to discover a problem with one unit than with a container.',
        ],
        bullets: [
          'Confirm Trade Assurance and verified-supplier badges',
          'Request business licence and factory audit reports',
          'Order and test a paid sample first',
          'Confirm SASO/IEC test report availability',
          'Negotiate MOQ, price and lead time in writing',
          'Use a contract or purchase order for every order',
        ],
      },
      {
        heading: 'Step 2: Choose your shipping method',
        paragraphs: [
          'The right freight mode depends on your margin, urgency and order size. Many successful sellers air-freight the first batch to start selling quickly, then switch to sea freight once demand is proven.',
        ],
        table: {
          headers: ['Method', 'Transit time', 'Cost profile', 'Best for'],
          rows: [
            ['Air freight', '3–8 days', 'Highest per kg', 'Samples, launches, urgent restocks'],
            ['Sea FCL', '25–40 days', 'Lowest per unit at volume', 'Large single-supplier orders'],
            ['Sea LCL', '30–45 days', 'Pay only for space used', 'Medium orders below a full container'],
          ],
        },
      },
      {
        heading: 'Step 3: Certification and customs clearance',
        paragraphs: [
          'Regulated products need a Product Certificate of Conformity (PCoC) via the SABER platform, plus a Shipment Certificate of Conformity (SCoC) for each shipment. Without these, goods cannot clear Saudi customs.',
          'You also need a Saudi commercial registration, a VAT number, correct HS codes and Arabic labelling. Missing paperwork is the number-one cause of clearance delays at Jeddah and Dammam ports.',
        ],
      },
      {
        heading: 'Step 4: Receive, prep and fulfil locally',
        paragraphs: [
          'Once goods land in KSA they need receiving, quality checks, marketplace-compliant labelling (Amazon FNSKU or Noon SKU) and storage until they are delivered to FBA or FBN. Tejaraa handles this entire local leg from one dashboard — you can even ship directly from your supplier to our warehouse.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do I need a commercial registration to import into Saudi Arabia?',
        a: 'Yes. To clear goods commercially you need a Saudi commercial registration (CR), a VAT number, and an importer of record. Individual sellers typically partner with a fulfillment provider or import agent that can act on their behalf.',
      },
      {
        q: 'How much are customs duties when importing to KSA?',
        a: 'Duty rates depend on the HS code of your product — many consumer goods fall between 5% and 15%, and 15% VAT applies on the CIF value plus duty. Always confirm the exact rate for your HS code before pricing your product.',
      },
      {
        q: 'Is it cheaper to ship by air or sea from China to Saudi Arabia?',
        a: 'Sea freight is far cheaper per unit at volume but takes 25–45 days. Air freight costs more but delivers in under a week. A common strategy is air for the first batch, then sea for restocks.',
      },
      {
        q: 'Can Tejaraa receive goods directly from my Chinese supplier?',
        a: 'Yes. Your supplier can ship directly to the Tejaraa warehouse in Saudi Arabia, where we receive, inspect, label and store your stock, then deliver it to Amazon FBA or Noon FBN on your schedule.',
      },
    ],
  },
  {
    slug: 'saber-certification-guide-saudi-arabia',
    category: 'Sourcing',
    title: 'SABER Certification Guide: What Saudi Importers Must Know',
    metaTitle: 'SABER Certification Saudi Arabia: Importer Guide — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'SABER is the gatekeeper of Saudi customs for regulated products. Learn which certificates you need, what they cost, and how to get them without delays.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'What is SABER?',
        paragraphs: [
          'SABER is the Saudi Standards, Metrology and Quality Organization (SASO) online platform for product conformity. Before regulated products can be sold in Saudi Arabia, the importer must register them on SABER and obtain certificates proving they meet Saudi technical regulations.',
          'There are two certificates: the Product Certificate of Conformity (PCoC), issued once per product and valid for one year, and the Shipment Certificate of Conformity (SCoC), issued per shipment. Both are required for customs clearance of regulated goods.',
        ],
      },
      {
        heading: 'Which products need SABER certification?',
        paragraphs: [
          'Most consumer products are regulated: electronics, toys, cosmetics, textiles, building materials, auto parts, food-contact items and more. Some low-risk products are classed as non-regulated and can be self-declared on SABER, but you should verify your exact HS code before assuming.',
        ],
        bullets: [
          'Electronics and electrical appliances',
          'Toys and childcare products',
          'Cosmetics and personal care',
          'Textiles, clothing and footwear',
          'Building and construction materials',
          'Auto spare parts and lubricants',
        ],
      },
      {
        heading: 'The certification process, step by step',
        paragraphs: [
          'First, create a SABER account linked to your Saudi commercial registration. Then classify your product by HS code to see the applicable technical regulation. You will need test reports from an accredited laboratory — your supplier should provide these, and they must match the exact product and model you import.',
          'Submit the test reports to a SASO-approved certification body, which reviews them and issues the PCoC. For each shipment you then request the SCoC on SABER, which customs verifies electronically when the goods arrive.',
        ],
      },
      {
        heading: 'Costs, timelines and common mistakes',
        paragraphs: [
          'PCoC fees are typically a few hundred SAR per product plus certification-body review fees, and lab testing (if reports are missing) can range from a few hundred to several thousand SAR depending on the product. Allow 1–3 weeks when documents are ready, and much longer if new testing is needed.',
          'The most common mistakes: test reports that do not match the shipped model, expired reports, wrong HS code classification, and requesting the SCoC after the shipment has already arrived. Start certification before your goods leave the factory.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How long is a SABER PCoC valid?',
        a: 'A Product Certificate of Conformity is valid for one year. The Shipment Certificate of Conformity (SCoC) is valid only for the specific shipment it was issued for.',
      },
      {
        q: 'Can my Chinese supplier get SABER certification for me?',
        a: 'No. SABER certificates are issued to the Saudi importer, linked to your commercial registration. Your supplier provides the test reports and technical documents you need, but the SABER application must come from the importer in KSA.',
      },
      {
        q: 'What happens if my goods arrive without a SCoC?',
        a: 'Regulated goods without a valid SCoC will be held at customs and cannot be cleared. This leads to storage fees, delays, and in the worst case re-export or destruction of the shipment.',
      },
      {
        q: 'Does Tejaraa help with SABER certification?',
        a: 'Yes. Tejaraa guides sellers through SABER registration, checks supplier test reports before shipment, and coordinates certification so your goods clear customs without surprises.',
      },
    ],
  },
  {
    slug: 'saudi-customs-duties-vat-guide-importers',
    category: 'Sourcing',
    title: 'Saudi Customs Duties and VAT: A Practical Guide for Importers',
    metaTitle: 'Saudi Customs Duty & VAT Guide for Importers — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Duty rates, 15% VAT, HS codes and ZATCA rules — calculate your true landed cost before you price your products for the Saudi market.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'How Saudi customs valuation works',
        paragraphs: [
          'Saudi customs charges are calculated on the CIF value of your shipment — the Cost of goods, plus Insurance, plus Freight to the Saudi port. Both customs duty and VAT are based on this value, which means your shipping cost increases your tax base.',
          'ZATCA (the Zakat, Tax and Customs Authority) administers both customs and VAT. All imports are declared electronically, and documentation mismatches are the main cause of holds and revaluations.',
        ],
      },
      {
        heading: 'Duty rates by product category',
        paragraphs: [
          'Saudi Arabia applies GCC common external tariffs. Many consumer goods carry 5–15% duty, but rates vary widely by HS code, and some categories (like certain foodstuffs or protective tariffs on local industries) are higher. A small HS code misclassification can change your duty rate dramatically.',
        ],
        table: {
          headers: ['Category (indicative)', 'Typical duty rate', 'VAT', 'Notes'],
          rows: [
            ['Electronics & accessories', '0–5%', '15%', 'Often low duty; still needs SABER'],
            ['Clothing & textiles', '5–12%', '15%', 'Arabic labelling required'],
            ['Cosmetics & personal care', '5–10%', '15%', 'SFDA registration also needed'],
            ['Toys', '10–15%', '15%', 'GSO conformity certificate required'],
          ],
        },
      },
      {
        heading: 'Calculating your landed cost',
        paragraphs: [
          'Your true landed cost per unit is: product cost + international freight + insurance + customs duty + 15% VAT + local handling and delivery. VAT on imports is recoverable for VAT-registered businesses, but it still affects your cash flow at clearance time.',
          'A simple rule of thumb many sellers use: take your CIF cost, add 20–35% to cover duty, VAT timing and local handling, and you have a realistic landed-cost estimate to build your pricing on.',
        ],
      },
      {
        heading: 'Documents you need at clearance',
        paragraphs: [
          'Commercial invoice, packing list, bill of lading or airway bill, certificate of origin, SABER certificates for regulated products, and your importer details. Every document must match — quantities, values, HS codes and product descriptions — or clearance stalls.',
        ],
        bullets: [
          'Commercial invoice matching the shipment exactly',
          'Packing list with carton-level detail',
          'Bill of lading / airway bill',
          'Certificate of origin',
          'SABER PCoC and SCoC for regulated goods',
          'Valid CR and VAT number of the importer',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is VAT charged on imports into Saudi Arabia?',
        a: 'Yes. A 15% VAT is charged at import on the CIF value plus customs duty. VAT-registered businesses can typically reclaim this as input tax on their VAT return.',
      },
      {
        q: 'How do I find the duty rate for my product?',
        a: 'Duty rates are set by the HS (Harmonized System) code. Your freight forwarder or fulfillment partner can confirm the correct code and rate — Tejaraa checks HS codes as part of its sourcing and receiving service.',
      },
      {
        q: 'What happens if my shipment is undervalued on the invoice?',
        a: 'ZATCA can revalue shipments it considers undervalued, charging duty and VAT on its own assessment plus potential penalties. Always declare accurate values.',
      },
      {
        q: 'Can I import as an individual without a company?',
        a: 'Small personal shipments are possible, but commercial importing for resale requires a commercial registration. Many sellers work with a fulfillment partner like Tejaraa that handles receiving and compliance locally.',
      },
    ],
  },
  {
    slug: 'how-to-find-reliable-suppliers-alibaba-1688',
    category: 'Sourcing',
    title: 'How to Find Reliable Suppliers on Alibaba and 1688',
    metaTitle: 'Find Reliable Alibaba & 1688 Suppliers: 2026 Guide — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'The difference between a profitable product and a costly scam is supplier vetting. Here is the exact checklist experienced Saudi importers use.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Alibaba vs 1688: which should you use?',
        paragraphs: [
          'Alibaba is built for international buyers: English listings, Trade Assurance, and suppliers experienced with export paperwork. 1688 is the domestic Chinese platform — prices are often 10–30% lower, but listings are in Chinese, most suppliers do not handle export, and you usually need an agent.',
          'For a first product, Alibaba is safer. Once you have volume and a partner on the ground in China (or a sourcing service like Tejaraa), 1688 unlocks better margins.',
        ],
      },
      {
        heading: 'The badges and signals that actually matter',
        paragraphs: [
          'On Alibaba, prioritize Verified Suppliers (third-party audited), Trade Assurance, and suppliers with 3+ years on platform. Check transaction history and response rate. A gold badge alone means little — it is a paid membership tier, not a quality guarantee.',
        ],
        bullets: [
          'Verified Supplier with third-party audit report',
          'Trade Assurance coverage for your order value',
          '3+ years active on the platform',
          'High on-time shipment and response rates',
          'Willingness to share business licence',
          'References from other GCC or export buyers',
        ],
      },
      {
        heading: 'Red flags and common scams',
        paragraphs: [
          'Prices far below market, refusal to use Trade Assurance, pressure to pay by wire to a personal account, stock photos only, and reluctance to video-call the factory are all classic warning signs. Another common trap: a "manufacturer" that is actually a trading company adding 15–25% margin.',
          'Always verify the company name on the invoice matches the business licence, and never pay 100% upfront — 30% deposit and 70% after inspection is the standard safe structure.',
        ],
      },
      {
        heading: 'Samples: your cheapest insurance',
        paragraphs: [
          'Order samples from your top 2–3 suppliers and compare quality side by side. For Saudi Arabia, verify the product can meet SASO requirements and that the supplier can provide matching test reports — a great sample from a supplier without documentation will still fail at customs.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is it safe to buy from Alibaba to Saudi Arabia?',
        a: 'Yes, when you use Trade Assurance, vet the supplier properly, and never pay outside the platform. Most problems come from skipping verification steps or chasing unrealistically low prices.',
      },
      {
        q: 'Can I buy from 1688 without speaking Chinese?',
        a: 'Directly, it is difficult — 1688 is Chinese-only and most sellers do not ship internationally. Sellers typically use a China-based agent or a sourcing partner like Tejaraa to buy from 1688 and consolidate shipments to KSA.',
      },
      {
        q: 'How much should I pay for samples?',
        a: 'Expect to pay the unit price plus express shipping (often $30–$80 total). Free samples are rare for new buyers, and paying is worth it — a sample is far cheaper than a bad container.',
      },
      {
        q: 'How do I know if a supplier is a factory or a trading company?',
        a: 'Check the business licence scope (manufacturing vs trading), ask for a factory video call or audit, and compare their product range — genuine factories usually specialize in a narrow category.',
      },
    ],
  },
  {
    slug: 'how-to-start-dropshipping-in-saudi-arabia',
    category: 'Selling Channels',
    title: 'How to Start Dropshipping in Saudi Arabia (2026 Guide)',
    metaTitle: 'Start Dropshipping in Saudi Arabia: 2026 Guide — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Dropshipping works in Saudi Arabia — but only if you solve shipping times and cash on delivery. Here is the realistic playbook for the Saudi market.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Is dropshipping legal in Saudi Arabia?',
        paragraphs: [
          'Yes. Dropshipping is a legal business model in Saudi Arabia, but you need a commercial registration (the Maroof platform and a freelancer document or CR are common starting points), and you must comply with e-commerce law, VAT registration thresholds, and consumer protection rules including clear return policies.',
        ],
      },
      {
        heading: 'The classic model — and its Saudi problem',
        paragraphs: [
          'Classic dropshipping ships each order directly from China to the customer. In Saudi Arabia this struggles: 2–4 week delivery times, no cash on delivery, high return rates, and customers who expect Amazon-level speed. Cart abandonment and refund requests eat the margin.',
          'The winning Saudi variant is local dropshipping: buy a small batch of proven products, hold them in a Saudi warehouse, and ship domestically in 1–3 days with COD. You keep the low-risk model but deliver a local experience.',
        ],
        table: {
          headers: ['Factor', 'China-direct dropshipping', 'Local dropshipping (KSA stock)'],
          rows: [
            ['Delivery time', '2–4 weeks', '1–3 days'],
            ['Cash on delivery', 'Not available', 'Fully supported'],
            ['Return handling', 'Costly / write-off', 'Local restock'],
            ['Upfront inventory cost', 'None', 'Small batch'],
            ['Customer trust', 'Low', 'High'],
          ],
        },
      },
      {
        heading: 'Setting up: store, payments and suppliers',
        paragraphs: [
          'Saudi sellers typically build on Salla, Zid or Shopify. For payments, local gateways like Tap, HyperPay, Moyasar and Stripe (for cards) plus COD through your courier cover nearly all customers. Choose products with proven demand, then source a test batch rather than committing to a container.',
        ],
        bullets: [
          'Register your business (CR or freelancer document)',
          'Build your store on Salla, Zid or Shopify',
          'Connect a local payment gateway + COD option',
          'Source a small test batch of proven products',
          'Store stock in a KSA warehouse for fast dispatch',
          'Set a clear, local return policy',
        ],
      },
      {
        heading: 'Where Tejaraa fits',
        paragraphs: [
          'Tejaraa gives dropshippers the local infrastructure: we receive your batch from the supplier, store it in our Saudi warehouse, and fulfil orders on demand with fast domestic delivery — including marketplace prep if you also sell on Amazon.sa or Noon.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do I need a commercial registration to dropship in Saudi Arabia?',
        a: 'Yes. Selling online in Saudi Arabia requires registration — commonly a commercial registration (CR) or a freelance document, plus listing on Maroof. You must also comply with Saudi e-commerce law and VAT rules once you pass the registration threshold.',
      },
      {
        q: 'How much money do I need to start dropshipping in KSA?',
        a: 'A local-stock model typically starts from a few thousand SAR: business registration, a store subscription, a small test batch of inventory, and marketing budget. China-direct costs less upfront but converts poorly in the Saudi market.',
      },
      {
        q: 'Which products sell best for dropshipping in Saudi Arabia?',
        a: 'Evergreen categories perform well: beauty and personal care, phone accessories, home and kitchen gadgets, baby products, and modest fashion accessories. Validate demand with a small batch before scaling.',
      },
      {
        q: 'Can I dropship on Amazon.sa or Noon?',
        a: 'Marketplaces require fast, reliable dispatch, which makes holding local stock essential. With stock in a KSA warehouse, Tejaraa can prep and deliver your inventory to Amazon FBA or Noon FBN, or fulfil merchant-fulfilled orders for you.',
      },
    ],
  },
  {
    slug: 'how-to-sell-on-amazon-saudi-arabia',
    category: 'Selling Channels',
    title: 'How to Sell on Amazon Saudi Arabia (Amazon.sa) in 2026',
    metaTitle: 'How to Sell on Amazon Saudi Arabia (Amazon.sa) — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Amazon.sa keeps growing, and Saudi sellers who get FBA right win the buy box. Registration, fees and fulfillment — explained plainly.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Registering your seller account',
        paragraphs: [
          'Register at sellercentral.amazon.sa with your commercial registration, national ID or iqama, bank account, and VAT number (if registered). Amazon offers a Professional selling plan; verification usually takes a few days when documents are clean.',
        ],
      },
      {
        heading: 'FBA vs FBM: choosing your fulfillment model',
        paragraphs: [
          'With FBA (Fulfilled by Amazon), you send bulk stock to an Amazon fulfillment center and Amazon handles storage, packing, delivery, COD and returns — plus your listings get Prime eligibility and better buy-box placement. With FBM you ship orders yourself, which rarely competes on delivery speed.',
        ],
        table: {
          headers: ['Factor', 'FBA', 'FBM'],
          rows: [
            ['Delivery speed', 'Same/next day (Prime)', 'Depends on your courier'],
            ['COD & returns', 'Handled by Amazon', 'You handle everything'],
            ['Buy box advantage', 'Strong', 'Weak'],
            ['Fees', 'Fulfillment + storage fees', 'Referral fee only'],
          ],
        },
      },
      {
        heading: 'Listing requirements that trip sellers up',
        paragraphs: [
          'Amazon.sa requires Arabic-capable listings, correct category approval for restricted categories, compliant product images, and — for FBA — FNSKU labels on every unit plus carton labels and specific prep rules. Incorrect labelling is the most common reason shipments get rejected at the fulfillment center.',
        ],
        bullets: [
          'Arabic + English listing content',
          'Category approval for restricted products',
          'White-background main image, 1000px+',
          'FNSKU label on every unit',
          'Carton content and shipping labels',
          'SABER compliance for regulated products',
        ],
      },
      {
        heading: 'Getting inventory into FBA without the headaches',
        paragraphs: [
          'Tejaraa receives your goods from the supplier, applies FNSKU and carton labels, preps to Amazon specifications, and delivers to the assigned fulfillment center — so your shipments are accepted the first time. You manage everything from your Tejaraa dashboard.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How much does it cost to sell on Amazon.sa?',
        a: 'Costs include the Professional plan subscription, referral fees (typically 5–15% depending on category), and FBA fulfillment and storage fees if you use FBA. Check the current rate card in Seller Central for your category.',
      },
      {
        q: 'Do I need a VAT number to sell on Amazon Saudi Arabia?',
        a: 'If your taxable turnover exceeds the registration threshold (currently SAR 375,000), VAT registration is mandatory. Below that, registration is optional but Amazon may require tax details depending on your setup.',
      },
      {
        q: 'What is an FNSKU and why does it matter?',
        a: 'The FNSKU is Amazon\u2019s unique barcode linking a unit to your seller account. Every FBA unit must carry the correct FNSKU label — missing or wrong labels cause receiving delays or rejections. Tejaraa applies FNSKU labels as part of its prep service.',
      },
      {
        q: 'Can foreigners sell on Amazon.sa?',
        a: 'Non-residents generally need a Saudi commercial entity or work through a local partner. Many international sellers use a local fulfillment and compliance partner like Tejaraa to operate in the Saudi market.',
      },
    ],
  },
  {
    slug: 'how-to-sell-on-noon-saudi-arabia',
    category: 'Selling Channels',
    title: 'How to Sell on Noon Saudi Arabia: Seller Guide 2026',
    metaTitle: 'How to Sell on Noon Saudi Arabia: 2026 Guide — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Noon is Amazon\u2019s biggest rival in KSA. Here is how to register, choose between FBN and direct shipping, and keep your metrics green.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Registering as a Noon seller',
        paragraphs: [
          'Sign up on the Noon seller portal with your Saudi commercial registration, VAT certificate, bank details and ID. Noon reviews and activates accounts, typically within a few business days. You will then create your store profile and brand registrations before listing products.',
        ],
      },
      {
        heading: 'FBN vs direct shipping (FBP)',
        paragraphs: [
          'Fulfilled by Noon (FBN) means Noon stores and ships your stock — faster delivery, noon-express badge, and better visibility. With direct shipping (FBP) you keep stock and ship each order within a strict handling window; late dispatch hurts your seller metrics quickly.',
        ],
        table: {
          headers: ['Factor', 'FBN', 'Direct shipping (FBP)'],
          rows: [
            ['Delivery speed', 'Fast, noon-express badge', 'Your responsibility'],
            ['Stock location', 'Noon warehouse', 'Your warehouse'],
            ['Returns', 'Handled by Noon', 'You handle'],
            ['Best for', 'Proven, steady sellers', 'Testing new products'],
          ],
        },
      },
      {
        heading: 'Content and catalog requirements',
        paragraphs: [
          'Noon has strict content standards: white-background images, Arabic and English titles, accurate attributes, and correct brand mapping. Poor content means suppressed listings. For FBN inbound, every unit needs the correct Noon barcode, and cartons must match the ASN (advance shipping notice) exactly.',
        ],
      },
      {
        heading: 'How Tejaraa helps Noon sellers',
        paragraphs: [
          'We receive your inventory, apply Noon SKU barcodes, build ASN-compliant cartons, and deliver to Noon fulfillment centers — or hold your buffer stock and replenish FBN on a schedule so you never go out of stock during a sales event like Yellow Friday.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is it free to sell on Noon Saudi Arabia?',
        a: 'Registration is free; Noon charges a commission per sale (category-dependent) plus fulfillment fees if you use FBN. There are no listing fees for standard sellers.',
      },
      {
        q: 'What is the difference between FBN and FBP on Noon?',
        a: 'FBN (Fulfilled by Noon) stores and ships your products from Noon warehouses with fast delivery. FBP/direct shipping means you ship orders yourself within Noon\u2019s required handling time.',
      },
      {
        q: 'Can I sell on both Amazon.sa and Noon with the same stock?',
        a: 'Yes — many sellers split inventory across both. Tejaraa can hold your stock centrally and deliver to Amazon FBA and Noon FBN on demand, applying each marketplace\u2019s specific labels.',
      },
      {
        q: 'Why was my Noon shipment rejected?',
        a: 'Common reasons: wrong or missing barcodes, cartons not matching the ASN, damaged packaging, or unapproved products. A prep partner like Tejaraa eliminates these errors before delivery.',
      },
    ],
  },
  {
    slug: 'salla-vs-zid-vs-shopify-saudi-arabia',
    category: 'Selling Channels',
    title: 'Salla vs Zid vs Shopify: Best E-commerce Platform for Saudi Arabia',
    metaTitle: 'Salla vs Zid vs Shopify for Saudi Arabia (2026) — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Salla, Zid or Shopify? An honest comparison for Saudi merchants — pricing, payments, shipping integrations, and who each platform suits best.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'The quick verdict',
        paragraphs: [
          'Salla and Zid are Saudi-built platforms with native Arabic, local payment gateways and courier integrations out of the box — ideal for selling to Saudi customers. Shopify is the global standard with the largest app ecosystem and best international selling tools, but needs more setup for local payments and shipping.',
        ],
        table: {
          headers: ['Factor', 'Salla', 'Zid', 'Shopify'],
          rows: [
            ['Arabic-first experience', 'Excellent', 'Excellent', 'Good (themes/apps)'],
            ['Local payment gateways', 'Built-in (Mada, Apple Pay, COD)', 'Built-in', 'Via integrations'],
            ['Local courier integrations', 'Extensive', 'Extensive', 'Via apps'],
            ['App ecosystem', 'Growing', 'Growing', 'Largest globally'],
            ['International selling', 'Limited', 'Limited', 'Best in class'],
          ],
        },
      },
      {
        heading: 'Salla: the Saudi default',
        paragraphs: [
          'Salla is the most popular platform among Saudi merchants. It offers a free entry plan, native Mada/Apple Pay/STC Pay support, tight integration with Saudi couriers and aggregators, and an Arabic admin that non-technical owners love. Its app market covers most local needs.',
        ],
      },
      {
        heading: 'Zid: the strong local alternative',
        paragraphs: [
          'Zid competes closely with Salla: similar local integrations, a solid theme store, and good B2B features. Some sellers prefer Zid\u2019s pricing structure at higher volumes or its specific courier partnerships. Trial both — migration between them later is painful.',
        ],
      },
      {
        heading: 'Shopify: when global beats local',
        paragraphs: [
          'Choose Shopify if you sell across multiple countries, need advanced apps, or plan heavy customization. Budget for local gateway integration (Tap, HyperPay, Moyasar) and shipping apps. Whatever platform you pick, Tejaraa can fulfil your orders from our Saudi warehouse — fast domestic delivery works with every storefront.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Which is better for beginners in Saudi Arabia: Salla or Shopify?',
        a: 'For a Saudi-only store, Salla is usually easier: native Arabic, local payments and couriers built in. Shopify makes more sense if you plan to sell internationally or need its larger app ecosystem.',
      },
      {
        q: 'Can I connect Mada and Apple Pay on Shopify?',
        a: 'Yes, through local payment gateways like Tap, HyperPay or Moyasar that support Mada and Apple Pay — it requires an extra integration step compared to Salla or Zid where these are built in.',
      },
      {
        q: 'Do Salla and Zid support cash on delivery?',
        a: 'Yes. Both integrate with Saudi couriers and shipping aggregators that offer COD collection, which remains an important payment method for Saudi online shoppers.',
      },
      {
        q: 'Can Tejaraa fulfil orders from any of these platforms?',
        a: 'Yes. Tejaraa holds your stock in Saudi Arabia and can fulfil orders for Salla, Zid or Shopify stores, as well as marketplace orders from Amazon.sa and Noon.',
      },
    ],
  },
  {
    slug: 'what-is-3pl-fulfillment-saudi-arabia',
    category: 'Fulfillment',
    title: 'What Is 3PL Fulfillment? A Saudi Seller\u2019s Guide',
    metaTitle: 'What Is 3PL Fulfillment? Saudi Seller Guide — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Storing stock at home works until it doesn\u2019t. Here is what a 3PL actually does, what it costs in Saudi Arabia, and when to make the switch.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'What a 3PL actually does',
        paragraphs: [
          'A third-party logistics provider (3PL) receives your inventory, stores it in a warehouse, and picks, packs and ships your orders when they come in. Good e-commerce 3PLs in Saudi Arabia also handle COD collection, returns processing, and marketplace prep for Amazon FBA and Noon FBN.',
        ],
        bullets: [
          'Receiving and quality-checking inbound stock',
          'Secure storage with inventory tracking',
          'Pick, pack and dispatch per order',
          'COD handling and courier management',
          'Returns receiving and restocking',
          'FBA/FBN labelling and marketplace delivery',
        ],
      },
      {
        heading: 'When should you switch to a 3PL?',
        paragraphs: [
          'The signals are clear: you spend more time packing than selling, storage at home or a rented shop is overflowing, dispatch errors and late shipments are hurting reviews, or you want to sell on marketplaces that require professional prep. Most sellers switch somewhere between 20 and 100 orders per day.',
        ],
      },
      {
        heading: 'What does 3PL fulfillment cost in Saudi Arabia?',
        paragraphs: [
          'Pricing typically has four parts: receiving (per carton or pallet), storage (per CBM or per unit per month), pick & pack (per order plus per item), and shipping (courier rates, often discounted through the 3PL\u2019s volume). Compare total cost per order, not just the headline pick fee.',
        ],
      },
      {
        heading: 'Tejaraa: 3PL built for marketplace sellers',
        paragraphs: [
          'Tejaraa combines 3PL fulfillment with sourcing support: we can receive goods directly from your supplier in China, store them in KSA, fulfil your store orders, and prep and deliver inventory to Amazon FBA and Noon FBN — all under one account, free to join, paying only for the services you use.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is the difference between a 3PL and a courier?',
        a: 'A courier only transports packages. A 3PL stores your inventory and fulfils orders end-to-end — receiving, storage, picking, packing, shipping via couriers, and returns.',
      },
      {
        q: 'Is a 3PL worth it for a small Saudi store?',
        a: 'If packing orders consumes your day or limits your growth, yes. Modern 3PLs like Tejaraa have no large minimums — you pay per order and per unit stored, so costs scale with your sales.',
      },
      {
        q: 'Can a 3PL deliver to Amazon FBA for me?',
        a: 'Yes. A marketplace-ready 3PL like Tejaraa applies FNSKU labels, preps to Amazon specifications, and delivers cartons to the assigned fulfillment center.',
      },
      {
        q: 'How do returns work with a 3PL?',
        a: 'The courier returns the parcel to the 3PL warehouse, where it is inspected and either restocked, quarantined, or disposed of per your instructions — you see every step in your dashboard.',
      },
    ],
  },
  {
    slug: 'amazon-fba-labeling-requirements-guide',
    category: 'Fulfillment',
    title: 'Amazon FBA Labeling Requirements: The Complete Guide',
    metaTitle: 'Amazon FBA Labeling Requirements Explained — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Wrong labels are the #1 reason FBA shipments get rejected or delayed. Here is every label Amazon requires and how to get it right the first time.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'The FNSKU: one label per unit',
        paragraphs: [
          'Every unit sent to FBA needs a scannable barcode that ties it to your seller account. For most sellers that is the FNSKU (starting with X00...), printed on a white label that fully covers any other scannable barcode on the product. Manufacturer barcodes (UPC/EAN) are only acceptable if your listing is set to commingled/virtually tracked inventory — most private-label sellers should use FNSKU labels.',
        ],
        bullets: [
          'One FNSKU label per unit, flat and scannable',
          'Cover all other barcodes completely',
          'Label on the outside of any poly bag or box',
          'No labels on curves, seams or openings',
          'Print quality must survive handling',
        ],
      },
      {
        heading: 'Carton and shipping labels',
        paragraphs: [
          'Every carton needs the FBA box ID label generated from your shipping plan, and if a pallet is involved, pallet labels on all four sides. Carton contents must match the shipping plan exactly — quantities, SKUs and expiry dates. Saudi sellers shipping from a local warehouse should confirm whether their shipment goes to one FC or is split across several.',
        ],
      },
      {
        heading: 'Prep rules beyond labels',
        paragraphs: [
          'Labels are only half the story. Liquids need sealed caps and poly bags, fragile items need bubble wrap that passes a drop test, sets must be labelled "Sold as set", and products with expiry dates need the date in the correct format on every unit. Each category has its own prep page in Seller Central — read it before your first shipment.',
        ],
      },
      {
        heading: 'Why shipments get rejected — and how to avoid it',
        paragraphs: [
          'The most common rejection reasons: unscannable or missing FNSKU labels, carton contents not matching the plan, missing box ID labels, and non-compliant prep. Amazon may fix issues for a fee, quarantine stock, or refuse the shipment entirely. Tejaraa\u2019s labelling service applies FNSKU and carton labels to spec and photographs the result, so your stock is accepted the first time.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I print FNSKU labels myself?',
        a: 'Yes, with a thermal or laser printer using the PDF from Seller Central — but labels must be crisp, unscratched and correctly placed. For larger volumes a prep service like Tejaraa is faster and error-free.',
      },
      {
        q: 'What label size does Amazon FBA require?',
        a: 'Amazon recommends labels between 1"×2" and 2"×3" (commonly 30mm×50mm or similar) printed clearly enough to scan. The key requirements are scannability and full coverage of any competing barcode.',
      },
      {
        q: 'What happens if my FBA shipment is not labelled correctly?',
        a: 'Amazon may apply labels for a per-unit fee, delay receiving, place units in stranded inventory, or reject the shipment. Repeated problems can affect your account\u2019s shipment privileges.',
      },
      {
        q: 'Does Tejaraa label products for FBA in Saudi Arabia?',
        a: 'Yes. Tejaraa applies FNSKU unit labels, poly-bagging and prep, carton labels, and delivers compliant shipments to Amazon fulfillment centers across KSA.',
      },
    ],
  },
  {
    slug: 'cash-on-delivery-ecommerce-saudi-arabia',
    category: 'Fulfillment',
    title: 'Cash on Delivery in Saudi E-commerce: How to Win with COD',
    metaTitle: 'Cash on Delivery (COD) in Saudi E-commerce — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'COD builds trust with Saudi shoppers — and brings fake orders and returns. Here is how to offer it safely and profitably.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Why COD still matters in Saudi Arabia',
        paragraphs: [
          'Card and wallet payments are growing fast in KSA, but a large share of online shoppers — especially first-time buyers from new stores — still prefer cash on delivery. Stores that do not offer COD routinely lose a meaningful slice of conversions, particularly outside the major cities.',
        ],
      },
      {
        heading: 'The real cost of COD',
        paragraphs: [
          'Couriers charge a COD collection fee per order, remittance cycles delay your cash flow, and refusal at the door turns a sale into a double shipping cost. Industry-wide, COD orders see significantly higher return rates than prepaid orders — fake and impulse orders are the main driver.',
        ],
        table: {
          headers: ['Factor', 'COD orders', 'Prepaid orders'],
          rows: [
            ['Conversion rate', 'Higher, especially new stores', 'Lower for unknown brands'],
            ['Return/refusal rate', 'High', 'Low'],
            ['Cash flow', 'Delayed remittance', 'Immediate'],
            ['Fees', 'Courier COD fee', 'Gateway fee only'],
          ],
        },
      },
      {
        heading: 'How to reduce COD losses',
        paragraphs: [
          'Confirm orders by WhatsApp or SMS before dispatch, require small deposits for high-value items, block repeat refusers, and use address verification. Many stores also nudge prepaid with a small discount or free shipping, gradually shifting their mix without losing conversions.',
        ],
        bullets: [
          'WhatsApp/SMS order confirmation before dispatch',
          'Address validation and phone verification',
          'Blacklist repeat refusers',
          'Prepaid discount incentives',
          'Fast delivery — speed reduces refusals',
        ],
      },
      {
        heading: 'COD with Tejaraa fulfillment',
        paragraphs: [
          'When Tejaraa fulfils your orders, COD is handled by our courier network with consolidated remittance, and refused orders come straight back into your stock for reselling — no lost inventory, and every return is inspected and logged in your dashboard.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do Saudi customers still use cash on delivery?',
        a: 'Yes. While card and wallet adoption is high and growing, COD remains popular, especially with first-time buyers and in smaller cities. Most successful Saudi stores offer both COD and prepaid options.',
      },
      {
        q: 'How much do couriers charge for COD in Saudi Arabia?',
        a: 'COD fees vary by courier and volume, typically a flat fee per COD shipment on top of the delivery rate. Fulfillment providers like Tejaraa negotiate volume rates across multiple couriers.',
      },
      {
        q: 'How can I reduce fake COD orders?',
        a: 'Confirm orders via WhatsApp or SMS before shipping, verify phone numbers, watch for suspicious addresses, and require prepayment or a deposit for expensive items. Blocking repeat refusers is also effective.',
      },
      {
        q: 'What happens to refused COD parcels with Tejaraa?',
        a: 'Refused parcels return to the Tejaraa warehouse, where they are inspected and restocked into your available inventory automatically, ready to be sold again.',
      },
    ],
  },
  {
    slug: 'ecommerce-warehousing-riyadh-jeddah-dammam',
    category: 'Fulfillment',
    title: 'E-commerce Warehousing in Saudi Arabia: Riyadh vs Jeddah vs Dammam',
    metaTitle: 'Warehousing in Riyadh, Jeddah & Dammam Compared — Product sourcing, labelling fulfillment and dropshipping for saudi arabia',
    metaDescription:
      'Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.',
    excerpt:
      'Where your stock sits determines your delivery speed and cost. Compare Riyadh, Jeddah and Dammam as warehousing bases for Saudi e-commerce.',
    date: '2026-08-20',
    sections: [
      {
        heading: 'Why warehouse location matters',
        paragraphs: [
          'Most Saudi e-commerce demand concentrates in three metros: Riyadh, Jeddah/Makkah and the Eastern Province. A warehouse near your customers means next-day delivery at standard courier rates; stock in the wrong city adds days and riyals to every order.',
        ],
      },
      {
        heading: 'The three cities compared',
        paragraphs: [
          'Each city has a distinct logistics advantage: Riyadh is the largest consumer market, Jeddah hosts the main Red Sea port and Amazon/Noon fulfillment centers, and Dammam serves the Eastern Province and sits near King Abdulaziz Port.',
        ],
        table: {
          headers: ['Factor', 'Riyadh', 'Jeddah', 'Dammam'],
          rows: [
            ['Consumer demand', 'Largest single market', 'Second, western region', 'Eastern Province + GCC'],
            ['Port access', 'Dry port, inland', 'Jeddah Islamic Port (main gateway)', 'King Abdulaziz Port'],
            ['Marketplace FCs nearby', 'Yes', 'Yes', 'Yes'],
            ['Best for', 'Nationwide next-day delivery', 'Sea imports from China', 'Eastern region + Bahrain'],
          ],
        },
      },
      {
        heading: 'Renting your own vs using a fulfillment warehouse',
        paragraphs: [
          'Leasing warehouse space means fit-out, staff, WMS software, security and municipality licensing — a heavy fixed cost before the first order ships. A fulfillment warehouse like Tejaraa converts all of that into pay-per-use pricing: storage per CBM and fulfillment per order, with no long leases.',
        ],
      },
      {
        heading: 'A practical strategy for most sellers',
        paragraphs: [
          'Start with one centrally located fulfillment warehouse that can reach all three metros in 1–2 days, and keep buffer stock close to the marketplace FCs you use. Tejaraa\u2019s Saudi warehouse receives directly from your suppliers, stores your stock, and delivers to both customers and marketplace fulfillment centers — so you get national coverage without renting anything.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Which city is best for e-commerce warehousing in Saudi Arabia?',
        a: 'Riyadh offers the best nationwide delivery reach to the largest customer base. Jeddah is ideal if most of your goods arrive by sea from China, and Dammam suits the Eastern Province. A fulfillment partner with good courier coverage often matters more than the exact city.',
      },
      {
        q: 'How much does warehouse storage cost in Saudi Arabia?',
        a: 'Self-leased space varies widely by city and size, plus fit-out and staffing costs. Fulfillment warehouses charge per CBM or per unit stored per month — you pay only for the space your stock actually occupies.',
      },
      {
        q: 'Can a fulfillment warehouse deliver to Amazon FBA and Noon FBN?',
        a: 'Yes. Tejaraa preps and delivers your inventory to Amazon and Noon fulfillment centers, and can split stock between marketplace replenishment and direct-to-customer orders from the same pool.',
      },
      {
        q: 'How fast can orders reach customers from a central KSA warehouse?',
        a: 'From a well-connected warehouse, Riyadh, Jeddah and Dammam are typically 1–2 days by courier, with most other cities reachable in 2–4 days. Same/next-day options exist within the warehouse\u2019s own metro.',
      },
    ],
  },
  {
    slug: 'sourcing-from-china-to-saudi-arabia-guide',
    category: 'Sourcing',
    title: 'Sourcing from China to Saudi Arabia: Seller Guide',
    metaTitle: 'Sourcing from China to Saudi Arabia: A Complete Seller Guide (2026)',
    metaDescription:
      'A practical guide to sourcing products from China to Saudi Arabia: supplier vetting, air vs sea shipping, SABER/SASO customs, and local prep and fulfillment.',
    excerpt:
      'Vetting Alibaba suppliers, air vs sea shipping, SABER/SASO customs, and local prep and fulfillment for Amazon & Noon.',
    date: '2026-07-08',
    sections: [
      {
        heading: 'Why source from China for the Saudi market?',
        paragraphs: [
          'China remains the largest source of products for e-commerce sellers worldwide, and Saudi Arabia is one of the fastest-growing marketplaces in the region. Combining low unit costs from Chinese manufacturers with high demand on Amazon.sa and Noon.com is a proven path for building a profitable catalogue.',
          'The challenge is everything between the factory floor and the marketplace warehouse: finding a reliable supplier, shipping cost-effectively, clearing Saudi customs, and meeting SASO compliance and Arabic labelling rules. This guide walks through each step for the KSA market.',
        ],
      },
      {
        heading: 'Step 1: Vet your suppliers',
        paragraphs: [
          'Most sellers start on Alibaba, 1688 or Global Sources. Before you commit, check Trade Assurance status, years in business, verified/gold-supplier badges, and request the company\u2019s business licence. Always order a paid sample and confirm the factory can produce goods that meet Saudi standards.',
        ],
        bullets: [
          'Confirm Trade Assurance and verified badges',
          'Request business licence and factory audit reports',
          'Order and test a paid sample first',
          'Ask for references from other GCC buyers',
          'Check ability to provide SASO/IEC test reports',
          'Negotiate MOQ, unit price and lead time in writing',
        ],
      },
      {
        heading: 'Step 2: Choose air vs sea freight',
        paragraphs: [
          'Air freight from China to Riyadh, Jeddah or Dammam takes days rather than weeks. It is the right choice for samples, product launches, urgent restocks, and light, high-value items where fast cash flow matters more than the lowest per-unit cost.',
          'Sea freight is dramatically cheaper per unit at volume. Full-container (FCL) loads suit large single-supplier orders, while less-than-container (LCL) lets you share space for medium orders. Plan for 25-45 days plus customs clearance, and keep a buffer of stock in a KSA warehouse so you never run out while the next container is at sea.',
        ],
        table: {
          headers: ['Shipping method', 'Typical speed', 'Cost', 'Best for'],
          rows: [
            ['Air freight', '3-8 days door-to-door', 'Higher per kg — best for light, high-value or urgent stock.', 'Samples, launches, restocks and small first orders.'],
            ['Sea freight (FCL)', '25-40 days port-to-port + clearance', 'Lowest per unit at volume — full container from a single supplier.', 'Large, stable-demand orders where lead time is planned.'],
            ['Sea freight (LCL)', '30-45 days including consolidation', 'Shared container — pay only for the space you use.', 'Medium orders that do not fill a full container.'],
            ['Rail / road (multimodal)', '18-30 days depending on route', 'Middle ground between air and sea for certain lanes.', 'Balancing cost and speed on suitable corridors.'],
          ],
        },
      },
      {
        heading: 'Step 3: Clear Saudi customs (SABER & SASO)',
        paragraphs: [
          'Saudi Arabia enforces product standards through SASO, and importers obtain conformity certificates via the SABER platform. For regulated products you will need a Product Certificate of Conformity (PCoC) and, per shipment, a Shipment Certificate of Conformity (SCoC) before goods can clear customs.',
          'You will also need a Saudi importer of record, a valid commercial registration and VAT number, correct HS codes, and Arabic labelling. Missing documents are the top cause of clearance delays, so confirm your supplier can provide the required test reports before you ship.',
        ],
      },
      {
        heading: 'What you need to get started',
        paragraphs: [
          'Tejaraa receives, quality-checks, labels and stores your goods in our Saudi warehouse, then delivers them to Amazon FBA and Noon FBN — all managed from one dashboard.',
        ],
        bullets: [
          'Vetted supplier with sample approved',
          'KSA commercial registration and VAT number',
          'SABER account and SASO-compliant test reports',
          'Correct HS codes and customs documentation',
          'Arabic-language labels and packaging',
          'Amazon FNSKU or Noon SKU labelling plan',
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I vet a supplier on Alibaba before shipping to Saudi Arabia?',
        a: 'Check trade assurance status, years active, verified/gold badges, and request business licences. Always order a paid sample, confirm the factory can produce SASO/SABER-compliant goods, and ask for references from other GCC buyers. Tejaraa can inspect goods on your behalf before they leave China or when they arrive in KSA.',
      },
      {
        q: 'What is SABER and SASO, and do I need them?',
        a: 'SASO sets Saudi product standards; SABER is the online platform where you obtain a Product Certificate of Conformity (PCoC) and a Shipment Certificate of Conformity (SCoC) before customs clearance. Most regulated products cannot clear Saudi customs without them, so confirm your supplier can provide the required test reports.',
      },
      {
        q: 'Should I ship by air or sea from China to KSA?',
        a: 'Air is faster and better for samples, launches and urgent restocks; sea is far cheaper per unit for large, planned orders. Many sellers air-freight the first batch to start selling, then move to sea freight once demand is proven.',
      },
      {
        q: 'How does Tejaraa help with sourcing from China to Saudi Arabia?',
        a: 'We help you source and vet products, consolidate shipments, handle receiving and quality checks in our KSA warehouse, apply Amazon FBA / Noon FBN labelling, and deliver to the marketplaces — so you manage sourcing and fulfilment from one dashboard.',
      },
    ],
  },
  {
    slug: 'amazon-fba-vs-noon-fbn-saudi-arabia',
    category: 'Fulfillment',
    title: 'Amazon FBA vs Noon FBN in Saudi Arabia',
    metaTitle: 'Amazon FBA vs Noon FBN in Saudi Arabia: A Seller\u2019s Guide (2026)',
    metaDescription:
      'Compare Amazon FBA vs Noon FBN for Saudi sellers: fees, storage, fulfillment speed, and KSA compliance.',
    excerpt:
      'A side-by-side comparison of Amazon FBA and Noon FBN for Saudi sellers: fees, delivery speed, and which to choose.',
    date: '2026-07-08',
    sections: [
      {
        heading: 'Which platform is right for your KSA business?',
        paragraphs: [
          'If you are selling — or planning to sell — in Saudi Arabia, the two fulfilment options you will hear about most are Amazon FBA and Noon FBN. Both let you store inventory in their warehouses and hand off picking, packing, shipping and customer returns to the marketplace. Both can scale from a few units a day to thousands.',
          'The difference is in the details: fee structure, speed, compliance requirements and how strict each platform is about inbound preparation. This guide breaks those details down for the Saudi market so you can choose the right mix for your business.',
        ],
      },
      {
        heading: 'Side-by-side comparison',
        paragraphs: [
          'Fees and rules change regularly, but the structural differences between the two programmes are stable enough to plan around.',
        ],
        table: {
          headers: ['Comparison point', 'Amazon FBA KSA', 'Noon FBN KSA'],
          rows: [
            ['Storage fees', 'Charged monthly based on volume (cubic metres) and time in fulfilment centre. Long-term storage fees apply after 365 days.', 'Storage fees based on occupied space and storage duration. Promotional free-storage windows are common for new sellers.'],
            ['Fulfillment speed', 'Same-day or next-day delivery for Prime-eligible orders in Riyadh, Jeddah, Dammam and other major cities.', 'Noon Express offers next-day delivery in key cities; standard FBN deliveries usually 2-4 days depending on location.'],
            ['KSA compliance requirements', 'Products must meet Saudi Customs, SASO/ECAS standards and have Arabic labels. FNSKU barcoding is mandatory.', 'Noon requires similar SASO compliance, Arabic labelling, and product-specific documentation (brand authorisation, expiry dates, etc.).'],
            ['Inbound requirements', 'Strict shipment quality, pallet/carton sizing and routing rules. Non-compliant shipments can be rejected.', 'Inbound rules are lighter but still require correct carton labels and documentation. Errors can delay receiving.'],
            ['Return handling', 'Customer returns are processed by Amazon; sellers pay return processing fees and may receive unsellable units back.', 'Noon manages returns back to FBN; sellers can request disposal or return to their own warehouse.'],
            ['Customer reach', 'Large, high-intent buyer base on Amazon.sa; strong international brand trust.', 'Fast-growing local marketplace with strong marketing and customer loyalty in Saudi Arabia and UAE.'],
          ],
        },
      },
      {
        heading: 'Storage fees and fulfillment speed',
        paragraphs: [
          'Both Amazon FBA and Noon FBN charge for the space your inventory takes up and how long it stays there. For slow-moving products, Amazon adds long-term storage fees after 12 months; Noon FBN often uses promotional free-storage windows to attract new sellers. The smart approach is to send smaller, more frequent shipments and keep only fast-moving SKUs in the marketplace warehouse.',
          'Amazon FBA in Saudi Arabia offers same-day or next-day delivery in Riyadh, Jeddah, Dammam and other major cities for Prime orders. Noon FBN matches this in key cities with Noon Express, while standard Noon FBN deliveries are typically 2-4 days. Speed matters for conversion and reviews, especially for time-sensitive categories.',
        ],
      },
      {
        heading: 'Compliance, labelling and inbound receiving',
        paragraphs: [
          'Saudi Arabia has strict product and labelling requirements. You will need SASO/ECAS compliance, Arabic product labels, safety warnings where applicable, and correct barcodes. Amazon requires FNSKU labels; Noon requires its own carton and product labels. Incorrect labels are one of the top reasons shipments are rejected.',
          'Amazon FBA is known for tight inbound rules: carton dimensions, pallet requirements and routing notifications. Noon FBN is generally more flexible, but both can delay receiving if labels or documents are wrong. Using a single prep partner that understands both sets of rules gets your products live sooner.',
        ],
      },
      {
        heading: 'What you need to get started',
        paragraphs: [
          'Whether you choose Amazon FBA, Noon FBN, or both, Tejaraa handles sourcing, labelling, storage and delivery in one place — no need to manage multiple warehouses or prep standards yourself.',
        ],
        bullets: [
          'KSA business licence and VAT registration',
          'Active seller account on Amazon.sa and/or Noon.com',
          'Products meeting SASO/ECAS requirements',
          'Arabic-language labels and packaging',
          'Correct FNSKU (Amazon) or Noon SKU labels',
          'Inbound shipping plan and customs documentation',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I sell on both Amazon FBA and Noon FBN at the same time?',
        a: 'Yes. Many successful sellers in KSA run both channels to diversify revenue. The challenge is keeping inventory, labelling and documentation consistent for both platforms. Tejaraa prep and fulfilment handles FBA and FBN requirements from the same stock, so you can scale without running two separate warehouses.',
      },
      {
        q: 'Which platform is cheaper in Saudi Arabia?',
        a: 'Fees change regularly, but Amazon FBA tends to reward higher-volume sellers with lower per-unit fulfilment costs, while Noon FBN often offers attractive storage and promotions for new sellers. The cheaper option depends on your product size, price point and sales velocity. We model both scenarios for Tejaraa customers.',
      },
      {
        q: 'Do I need a Saudi business license to use FBA or FBN?',
        a: 'Both platforms require a legal business entity in KSA (or the GCC, depending on policy) and a valid VAT number. We recommend speaking with a local tax advisor; Tejaraa can help with fulfilment and prep once your entity is set up.',
      },
      {
        q: 'How does Tejaraa simplify FBA/FBN prep and delivery?',
        a: 'We inspect, label, poly-bag, bundle and package your products to each platform\u2019s spec, then deliver directly to Amazon and Noon fulfilment centres across KSA. You manage everything from one dashboard.',
      },
    ],
  },
];

export const getBlogPost = (slug: string) => blogPosts.find((p) => p.slug === slug)!;
