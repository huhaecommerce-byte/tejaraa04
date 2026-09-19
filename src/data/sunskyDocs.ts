// Static snapshot of the SunSky Open API documentation for in-app reference.
// Source: https://doc.sunsky-online.com — see `href` on each section for the canonical page.
// Keep concise and focused on what Tejaraa actually uses.

export interface SunskyDocSection {
  id: string;
  title: string;
  group: string;
  href: string;
  markdown: string;
}

export const SUNSKY_DOC_GROUPS = [
  'Intro',
  'Category',
  'Product',
  'Order',
  'Account',
  'Stats',
  'Coupon',
] as const;

export const SUNSKY_DOCS: SunskyDocSection[] = [
  {
    id: 'common',
    title: 'Common Calling Convention',
    group: 'Intro',
    href: 'https://doc.sunsky-online.com/common-calling-convention-8292170m0',
    markdown: `### Authentication
Every request must include two parameters:

- **key** — your API key (set in Settings → SunSky)
- **signature** — MD5 of the signed parameter string

### Signature algorithm
1. Concatenate the **key** + every other parameter value, **sorted by parameter name** (whitespace preserved).
2. Append \`@\` then your **secret**.
3. \`signature = MD5(<concatenated string>)\`

> Never put the secret itself in the request parameters.

### Response shape
**Success**
\`\`\`json
{ "result": "success", "data": { ... } }
\`\`\`

**Error**
\`\`\`json
{ "result": "error", "messages": ["message1"] }
\`\`\`

Tejaraa wraps every call through the \`sunsky-proxy\` Edge Function so the secret stays server-side.`,
  },
  {
    id: 'callbacks',
    title: 'Callback Hooks',
    group: 'Intro',
    href: 'https://doc.sunsky-online.com/callback-hooks-8295178m0',
    markdown: `SunSky pushes events (order updates, balance changes, image changelist) to a webhook URL you register.

In Tejaraa, configure the URL under **Settings → Webhook URL**. Incoming events are validated by signature and shown in the **Webhooks** tab.`,
  },
  {
    id: 'appendixes',
    title: 'Appendixes — Status, Lead time, Languages',
    group: 'Intro',
    href: 'https://doc.sunsky-online.com/appendixes-8295235m0',
    markdown: `### Appendix A — Category Status
| Code | Meaning |
|------|---------|
| 1 | Valid |
| 2 | Deleted |

### Appendix B — Product Status (used by bulk import)
| Code | Meaning | Tejaraa treatment |
|------|---------|-------------------|
| 1 | Valid | Active — imported |
| 2 | Deleted | Skipped by default |
| 3 | Out of stock | Imported, marked OOS |
| 4 | Hidden (too old) | Skipped by default |

### Appendix C — Order Status
1 Unpaid · 2 Paid · 3 Shipped · 4 Cancelled · 5 Delivered

### Appendix D — Lead Time Level
| Level | Meaning |
|-------|---------|
| 5 | Same-day shipping |
| 4 | Ships in 2 days |
| 3 | Ships in 2–3 days |
| 2 | Ships in 3–5 days |
| 1 | Out of stock |

### Appendix E — Languages
\`en\`, \`ru\`, \`fr\`, \`es\`, \`pt\`, \`de\`, \`it\`, \`nl\`, \`ar\`, \`vi\`, \`th\`, \`ko\`, \`ja\`, \`zh_CN\`, \`zh_TW\`.`,
  },
  {
    id: 'cat-children',
    title: 'Get the children of the category',
    group: 'Category',
    href: 'https://doc.sunsky-online.com/get-the-children-of-the-category-425439175e0',
    markdown: `**POST** \`category!getChildren.do\`

Params: \`parentId\` (0 = top-level), \`lang\`.

Returns the immediate children only — call recursively to walk the full tree (Top → Sub → Detail).
Tejaraa caches results in \`sunsky_categories\` and exposes the tree in the Catalog sidebar.`,
  },
  {
    id: 'prod-search',
    title: 'Search products',
    group: 'Product',
    href: 'https://doc.sunsky-online.com/search-products-425439176e0',
    markdown: `**POST** \`product!search.do\`

### Useful params
- \`categoryId\` — restrict to a category and its descendants
- \`pageSize\` (max **100**, default 40), \`page\`
- \`status\` — \`-1\` for ALL statuses, \`1\` for valid only (default), see Appendix B
- \`leadTimeLevel\` — 1–5, see Appendix D
- \`brandName\`, \`gmtModifiedStart\` (\`MM/dd/yyyy HH:mm:ss\`)

### Important fields per item
- \`itemNo\` — unique SKU
- \`status\` — see Appendix B (Valid / Deleted / OOS / Hidden)
- \`stock\` — current units (0 = OOS)
- \`leadTimeLevel\` — see Appendix D
- \`price\`, \`priceList\` (qty → unit-price tiers)
- \`unitWeight\`, \`unitLength/Width/Height\`, \`packQty\`, \`warehouse\`
- \`barcode\`, \`brandName\`, \`groupItemNo\`, \`modelList\`, \`videoUrl\`

Tejaraa's bulk importer always sends \`status=-1\` so we can capture every state and let the admin filter later.`,
  },
  {
    id: 'prod-detail',
    title: 'Get the product details',
    group: 'Product',
    href: 'https://doc.sunsky-online.com/get-the-product-details-425439177e0',
    markdown: `**POST** \`product!detail.do\`

Param: \`itemNo\`. Returns the full payload including HTML \`description\`, \`paramsTable\`, model variants, dimensions, package info, certifications, and full image list.`,
  },
  {
    id: 'prod-images',
    title: 'Download the product images',
    group: 'Product',
    href: 'https://doc.sunsky-online.com/download-the-product-images-425439178e0',
    markdown: `**POST** \`product!downloadImages.do\`

Returns a ZIP URL with all base + detail images for the SKU. Tejaraa uses this when promoting an imported SunSky item to the live \`products\` table.`,
  },
  {
    id: 'prod-changelist',
    title: 'Get the image changelist',
    group: 'Product',
    href: 'https://doc.sunsky-online.com/get-the-image-changelist-425439179e0',
    markdown: `**POST** \`product!imageChangelist.do\`

Pass \`gmtModifiedStart\`. Returns SKUs whose images changed since that timestamp — used to refresh promoted products.`,
  },
  {
    id: 'order-countries',
    title: 'Country list for shipping',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/get-the-country-list-for-shipping-425439180e0',
    markdown: `**POST** \`order!countries.do\` — returns shipping destinations and their codes. Saudi Arabia is \`SA\`.`,
  },
  {
    id: 'order-shipping',
    title: 'Get prices and shipping costs for items',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/get-the-prices-and-the-shipping-costs-for-the-items-425439181e0',
    markdown: `**POST** \`order!shippingCost.do\`

Pass \`country\` + array of \`{ itemNo, qty }\`. Returns per-item unit price, plus shipping options (carrier, lead time, total).`,
  },
  {
    id: 'order-create',
    title: 'Create an order',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/create-an-order-425439182e0',
    markdown: `**POST** \`order!create.do\`

Pass shipping address, items array, carrier code from the previous shipping-cost call. Returns the \`orderNo\`. Payment is debited from your SunSky balance.`,
  },
  {
    id: 'order-detail',
    title: 'Get order details',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/get-the-order-details-425439184e0',
    markdown: `**POST** \`order!detail.do\` — pass \`orderNo\`. Returns full status, tracking #, and per-item state.`,
  },
  {
    id: 'order-search',
    title: 'Search orders',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/search-orders-425439183e0',
    markdown: `**POST** \`order!search.do\` — paged. Filters: status (Appendix C), date range.`,
  },
  {
    id: 'order-add-labels',
    title: 'Add labels to the order',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/add-labels-to-the-order-425439185e0',
    markdown: `**POST** \`order!addLabels.do\` — attach FBA / FBN / custom shipping labels (one per SKU) before SunSky ships.`,
  },
  {
    id: 'order-get-labels',
    title: 'Get the labels for the order',
    group: 'Order',
    href: 'https://doc.sunsky-online.com/get-the-labels-for-the-order-425439186e0',
    markdown: `**POST** \`order!getLabels.do\` — retrieve the labels currently attached to an order.`,
  },
  {
    id: 'account-balance',
    title: 'Check your balance',
    group: 'Account',
    href: 'https://doc.sunsky-online.com/check-your-balance-on-sunsky-425439187e0',
    markdown: `**POST** \`account!balance.do\` — returns your current SunSky wallet balance. Surfaced in the Overview KPI strip.`,
  },
  {
    id: 'account-history',
    title: 'Balance history',
    group: 'Account',
    href: 'https://doc.sunsky-online.com/get-your-balance-history-425439188e0',
    markdown: `**POST** \`account!balanceHistory.do\` — paged ledger of credits/debits.`,
  },
  {
    id: 'stats-hot',
    title: 'Get the hot items',
    group: 'Stats',
    href: 'https://doc.sunsky-online.com/get-the-hot-items-425439189e0',
    markdown: `**POST** \`stats!hotItems.do\` — currently trending SKUs. Useful as a curated "what to import next" feed.`,
  },
  {
    id: 'coupon-list',
    title: 'Get the coupon list',
    group: 'Coupon',
    href: 'https://doc.sunsky-online.com/get-the-coupon-list-425439190e0',
    markdown: `**POST** \`coupon!list.do\` — your available SunSky coupons (apply at order creation).`,
  },
];

// --- Status helpers used across the admin ---

export const SUNSKY_PRODUCT_STATUS: Record<number, { label: string; tone: 'active' | 'oos' | 'deleted' | 'hidden' }> = {
  1: { label: 'Active',       tone: 'active' },
  2: { label: 'Deleted',      tone: 'deleted' },
  3: { label: 'Out of stock', tone: 'oos' },
  4: { label: 'Hidden',       tone: 'hidden' },
};

export function statusLabel(code: number | null | undefined): string {
  if (code == null) return 'Unknown';
  return SUNSKY_PRODUCT_STATUS[code]?.label ?? `Status ${code}`;
}

export const SUNSKY_LEAD_TIME: Record<number, string> = {
  5: 'Ships same-day',
  4: 'Ships in 2 days',
  3: 'Ships in 2–3 days',
  2: 'Ships in 3–5 days',
  1: 'Out of stock',
};
