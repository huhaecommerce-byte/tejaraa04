# Shopify integration for dropshippers

Push Tejaraa products into a dropshipper's own Shopify store, keep stock and price in step, and pull orders back into Tejaraa automatically. Built to mirror the Noon workspace so the two feel the same.

## How it works for the user

1. **Connect** — Store Integrations page gets a "Shopify" card. The dialog asks for a connection name, the store address (`my-shop.myshopify.com`) and an Admin API access token created in the Shopify admin (step-by-step instructions shown in the dialog, including which permissions to tick). Tejaraa verifies the token and stores it encrypted.
2. **Setup wizard** — After connecting, the workspace stays locked until three steps are done: choose the Shopify location used for stock, choose the currency/market, and set the default profit markup. Same wizard shape as Noon.
3. **Pick products** — Search the Tejaraa catalogue, tick products, and put them in a publishing queue. Each row shows the photo, title (English and Arabic), price after markup, stock and any problems.
4. **Publish** — Products are created in Shopify with title, description, photos, barcode (the product SKU), price and stock. Already-published products are updated instead of duplicated.
5. **Automatic sync** — Whenever a product's stock or price changes in Tejaraa, the change is pushed to Shopify within seconds. A manual "Sync now" button is there as a fallback.
6. **Orders** — An order placed on the Shopify store lands in Tejaraa as a real order, paid from the wallet, fulfilled by Tejaraa. Tracking number and carrier are pushed back to Shopify and the order is marked fulfilled there.

## Screens

- `/dropshipping/integrations` — Shopify card alongside Noon, with connection status and a "Open workspace" button.
- `/dropshipping/integrations/shopify/$connectionId` — workspace with tabs: Products, Orders, Activity log, Settings.
  - Products: catalogue search, publish queue, per-product markup override with Edit button, preview & validate dialog showing the exact payload sent.
  - Orders: Shopify orders with their Tejaraa order link and fulfilment status.
  - Activity: every sync call with status, message and duration.
  - Settings: location, market/currency, markups per market, safety stock, disconnect.

## Pricing and stock rules

- Default markup per market, exactly as Noon does, with a per-product override.
- Quantity sent = Tejaraa stock minus the safety buffer, never below zero.
- When Tejaraa stock hits zero the Shopify listing goes out of stock rather than being deleted.

## Technical details

**Database (one migration, with GRANTs and RLS scoped to `auth.uid()`):**
- `shopify_connections` — user_id, name, shop_domain, encrypted access token (AES-256-GCM, same helper as Noon), api_version, location_id, currency, markup rules, safety_stock, setup_completed_at, health/status, webhook secret hash.
- `shopify_product_links` — connection_id, product_id, shopify_product_id, variant_id, inventory_item_id, content_status, sync_status, last_error, last_synced_at, unique on (connection_id, product_id).
- `shopify_orders` / `shopify_order_items` — mirror of the Noon order tables, linked to the created Tejaraa `orders` row.
- `shopify_sync_jobs` — durable queue (publish, sync_stock, sync_price, fulfil_order) with attempts, run_after, max_attempts.
- `shopify_sync_log` — direction, operation, status, message, detail, duration_ms.
- `shopify_webhook_events` — raw payload + processed flag for idempotency.

**Server code (mirrors `noon.server.ts` / `noon.functions.ts`):**
- `src/lib/shopify.server.ts` — `shopifyRequest()` against `https://{shop}/admin/api/2026-01/graphql.json` with `X-Shopify-Access-Token`, retrying on 429 using Shopify's cost/throttle headers; `verifyShop()` (shop query), `listLocations()`, `buildShopifySubmissions()` (single shared payload builder used by both preview and publish), `publishProducts()` (`productSet` mutation with variant, barcode, media from absolute public URLs), `pushPrice()`, `pushStock()` (`inventorySetQuantities`), `registerWebhooks()`, `fulfilOrder()` (`fulfillmentCreateV2`), `processShopifyJobs()`.
- `src/lib/shopify.functions.ts` — `createServerFn` + `requireSupabaseAuth` wrappers: connect, testConnection, getWorkspace, completeSetup, selectProducts, updateProductSettings, previewSubmission, publishSelected (with `force` resubmit flag), syncNow, updateSettings, disconnect.
- Webhooks: `src/routes/api/public/shopify/webhook.ts` — HMAC-SHA256 verification against the app secret before anything else, handles `orders/create`, `orders/cancelled`, `products/delete`, stores the raw event, enqueues work.
- Cron: `src/routes/api/public/shopify/cron.ts` guarded by the existing cron secret, drains `shopify_sync_jobs`.

**Change-driven sync:** a Postgres trigger on `products` (stock_qty, price, cost) inserts a `sync_stock`/`sync_price` job for every linked Shopify connection; the job runner pushes it on the next drain (seconds), so no polling of the whole catalogue.

**Reused pieces:** encryption helper, markup calculation, absolute image URL helper, category/product pickers, preview-and-validate dialog pattern, and the log/job table shapes from the Noon work.

## Out of scope for this build

- Shopify OAuth "one-click install" public app (needs Shopify review) — can be added later without changing the data model.
- Pushing Shopify collections/categories; products go into a single collection or none.
- Refunds and returns flowing back to Shopify.
