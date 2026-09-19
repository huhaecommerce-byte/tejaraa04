# Noon Seller Integration for Dropshippers

## Goal
Add a functional Noon marketplace workspace under **Dropshipping → Fulfillment → Store Integrations**. A signed-in dropshipper can connect one or more Noon seller projects, select Tejaraa products, prepare bilingual Noon listings, publish them to **Saudi Arabia and UAE**, sync prices and inventory, receive **Fulfilled by Partner (FBPI)** orders, create shipments, and monitor every sync.

This first release supports:
- Saudi Arabia (`sa`, SAR) and UAE (`ae`, AED)
- FBPI only
- Explicit product selection, not automatic catalog publishing
- Markup rules plus per-product manual price overrides and minimum-margin protection
- English and Arabic content
- Sandbox testing before production activation

## Customer experience

### 1. Integrations overview
Keep the existing platform grid, but Noon becomes a real integration rather than a saved URL.

```text
Fulfillment  /  Store Integrations

[ Shopify ] [ Amazon ] [ Noon — Connected ] [ WooCommerce ]

Noon stores
┌──────────────────────────────────────────────────────────────────────┐
│ Noon KSA + UAE        Production        Healthy                     │
│ Last inventory sync 4m ago  •  Last order sync 2m ago               │
│ [Manage] [Sync now] [••• Disconnect]                                │
└──────────────────────────────────────────────────────────────────────┘
```

Connection wizard:
1. **Account** — upload the Noon service-account JSON credential or enter `key_id`, private key, and project code.
2. **Markets** — enable Saudi Arabia and/or UAE and map each market to a Noon warehouse code.
3. **Pricing** — percentage/fixed markup, optional rounding, minimum margin, VAT handling, and per-market defaults.
4. **Orders** — confirm FBPI warehouse and webhook readiness.
5. **Test** — authenticate, verify project access, load categories, test warehouse access, then save.

Raw credentials are never displayed after saving. The UI only returns masked key information and connection health.

### 2. Dedicated Noon workspace
Opening **Manage** shows a full-page Noon workspace with these tabs:

- **Overview** — connection health, listing counts, live offers, failed products, stock alerts, new orders, last syncs.
- **Products** — eligible Tejaraa products, selected products, Noon readiness, publish/update/unpublish actions.
- **Categories & attributes** — Noon category search, saved category mappings, required-attribute completion.
- **Pricing & inventory** — Saudi/UAE prices, markup rules, overrides, warehouses, available quantity, processing time.
- **Orders** — FBPI orders, exceptions, shipment/AWB actions, status history.
- **Activity** — searchable sync attempts, provider request IDs, warnings, retries, and downloadable CSV.
- **Settings** — credentials, markets, warehouses, schedules, safety stock, alerts, sandbox/production mode.
- **Documentation** — concise setup checklist, webhook address, Noon portal steps, and limitations.

### 3. Product publishing workflow

```text
Products
[Search] [Readiness: All ▼] [Market: KSA + UAE ▼] [Selected: 12]

☑ Product             Noon readiness      KSA price   UAE price   Status
☑ Wireless Camera     8/8 Ready            149 SAR     149 AED     Draft
☐ Phone Case          Missing GTIN         —           —           Blocked
☑ Smart Watch         Image review pending 219 SAR     219 AED     Submitted

[Review 12 products] → [Publish to Noon]
```

For each selected product:
1. Match or choose a Noon category.
2. Fetch Noon's mandatory and optional attributes for that category.
3. Map existing English/Arabic title, description, brand, images, SKU, GTIN/barcode, and attributes.
4. Block publishing until all required fields are complete.
5. Preview the exact KSA and UAE listing data.
6. Submit through Noon `UpsertProduct`.
7. Save Noon parent/variant identifiers and poll `GetContent` for completeness, image review, and QC status.
8. Push market pricing and warehouse stock only after the product exists on Noon.
9. Check the Offer API to confirm the offer is actually live and sellable.

Bulk actions support category assignment, markup, processing time, safety stock, publish, retry, pause, and CSV export. Every operation is idempotent by integration + Tejaraa product + partner SKU + market.

### 4. Pricing and inventory
- Global connection defaults: percentage markup, fixed markup, price rounding, minimum margin, and safety-stock buffer.
- Per-market rules for SAR and AED.
- Per-product overrides take priority over defaults.
- A price preview shows source cost, fees/adjustments, minimum safe price, final Noon price, and margin.
- Never send a price below the configured minimum margin; show the product as blocked instead.
- Inventory updates are absolute quantities, per Noon warehouse and partner SKU.
- Sellable quantity is `max(Tejaraa available stock - safety stock, 0)`.
- Setting a listing to paused sends stock `0` and deactivates pricing where supported.
- Respect the customer's plan: manual, hourly, or near-real-time inventory sync.

### 5. FBPI order workflow

```text
Noon webhook → acknowledge immediately → queue order number
             → fetch full order with retry → idempotent import
             → reserve stock → notify seller → fulfil
             → get/attach AWB → create shipment → reconcile status
```

Order features:
- Accept `FBPI::ORDER_SYNC` notifications at a stable public endpoint and return HTTP 200 before processing.
- Deduplicate notifications by Noon message ID and orders by integration + Noon order number.
- Fetch full order details asynchronously because webhook payloads only contain the order reference.
- Retry with exponential backoff when the order is not immediately available.
- Import lines, prices, currency, status, warehouse, and only the minimum customer information needed for fulfilment.
- Map Noon statuses to Tejaraa statuses while retaining the original Noon value and raw payload.
- If stock is unavailable, let the seller mark affected items unavailable before shipment creation.
- Generate Noon logistics AWBs or record an approved own-courier AWB, then create the shipment.
- Clearly show that manifest creation/pickup scheduling remains a manual Noon portal step because Noon does not expose a manifest API.
- Poll `ListFbpiOrders` as a recovery/reconciliation path using fixed pages of up to 50 and `next_token` pagination.
- Detect Pending/Killed delivery states and raise prominent alerts.

### 6. Sandbox and go-live
Each connection has `sandbox` or `production` mode.

Sandbox checklist:
- Login uses the production identity host; test API calls use Noon's sandbox host.
- Validate auth, project, categories, attributes, pricing, stock, and error handling.
- Use Noon's sandbox-order endpoint to verify webhook → import → exception → shipment flow.
- Record test evidence and require all critical checks to pass before enabling production.

Production activation requires an explicit confirmation summarizing enabled markets, warehouses, pricing rules, and sync schedules.

## Data model
Create dedicated user-owned tables rather than overloading the generic URL-only integration record:

- **`noon_connections`** — owner, linked `store_integrations` row, mode, key ID, encrypted private key, project code, masked credential label, enabled markets, connection status, last successful auth, last error.
- **`noon_warehouses`** — connection, market, warehouse code/name, processing time, safety stock, enabled state.
- **`noon_category_mappings`** — Tejaraa category/product scope, Noon category code/name, cached attribute schema/version, review state.
- **`noon_product_links`** — connection, product, partner SKU, Noon parent/variant IDs, content/QC/image/offer status, selected markets, timestamps, last error.
- **`noon_product_market_settings`** — product link + market, markup method/value, override price, minimum margin, calculated/published price, active state.
- **`noon_orders`** and **`noon_order_items`** — user-owned normalized Noon order data, unique external references, shipment/AWB state, raw provider payloads.
- **`noon_webhook_events`** — message ID, event type, connection resolution, receipt/processing status, attempt count, raw payload; unique message ID for deduplication.
- **`noon_sync_jobs`** — durable jobs for catalog, content checks, pricing, stock, order fetch, shipment, and reconciliation with retry scheduling.
- **`noon_sync_log`** — operation, direction, entity, market, result, provider request ID, safe error summary, counts, duration.
- **`noon_category_cache`** and **`noon_attribute_cache`** — Noon taxonomy and category contracts, refreshed periodically.

Extend Tejaraa products with GTIN/barcode and any missing structured commerce attributes needed by Noon. Add explicit grants, enable row-level security, and create owner-only policies on every new user-facing table. Server jobs may use privileged access only after validating the caller or scheduled-job secret.

## Security and credentials
- Noon service credentials are obtained by the seller from Noon and entered through a secure connection form.
- Encrypt each private key with authenticated encryption using an app-generated server encryption secret; never store plaintext, return it to the browser, or place it in logs.
- Generate RS256 login JWTs with `sub = key_id`, current `iat`, and unique `jti`; send `default_project_code`, preserve the returned session cookie, and refresh the session before expiry.
- Set a stable Tejaraa `User-Agent` on every Noon request.
- Scope every server action to the signed-in owner and enforce `marketplace_api`, store count, and sync-frequency plan limits on the server, not only in the interface.
- Validate all inputs with bounded schemas, redact provider payloads, and avoid storing unnecessary customer data.
- The webhook route resolves the Noon project/connection from trusted event metadata, accepts only supported event types, deduplicates before processing, and never trusts a user ID from the request body.
- Noon documentation lists source IPs, but IP allowlisting is defense-in-depth only; because the available webhook authenticity contract is not fully documented, reconcile every notification by fetching the referenced order through the authenticated Noon API before accepting its contents.

## Backend structure
- **Authenticated server functions** for connect/test/disconnect, connection settings, selected products, category mapping, publish/retry, price preview, manual sync, order actions, and logs.
- **Server-only Noon client** for JWT login, cookie handling, common headers, typed requests, timeouts, redaction, retries, and normalized errors.
- **Public webhook route** under `/api/public/noon/events` for Noon notifications.
- **Protected scheduled route** under `/api/public/noon/run-jobs`, authenticated with the existing cron secret pattern.
- **Durable database queue**, claimed in bounded batches, rather than long browser requests or in-memory state.
- Retry only safe/idempotent reads and upserts; use exponential backoff with jitter for 429 and transient 5xx responses, honor provider retry headers when available, and dead-letter repeated failures for manual retry.
- Capture Noon request IDs in logs and support views without exposing credentials or full sensitive payloads.

## Sync schedule
- Webhooks: immediate order notification intake.
- Order job worker: every minute, bounded queue drain.
- Order reconciliation: every 15 minutes using the last successful cursor/window with overlap for safety.
- Inventory: manual/hourly/near-real-time based on plan; coalesce repeated changes per SKU and warehouse.
- Pricing: on manual publish/change and scheduled reconciliation.
- Content/QC polling: progressively back off while Noon reviews a listing; stop once live or definitively rejected.
- Categories/attribute contracts: daily refresh plus manual refresh.
- Connection health: daily auth and access check.

Every schedule is resumable, records a cursor, avoids overlapping runs, and uses connection-level locking.

## Notifications and admin visibility
Seller notifications:
- New Noon order
- Product published/live
- Listing rejected or missing required content
- Inventory/price sync failure
- Connection expired or unauthorized
- Pending/Killed order delivery warning

Admin visibility:
- Connections and health without secret access
- Job backlog, failure rate, rate-limit pressure, and webhook delivery status
- Requeue/reconcile controls with audit logging
- No ability for ordinary staff to reveal seller credentials

## API coverage
Documented Noon capabilities used in the first release:
- Login: `/identity/public/v1/api/login`
- Categories and attributes
- Product create/update and content/QC retrieval
- Batch pricing read/write for `sa` and `ae`
- Stock read/write per warehouse
- Offer/live-status lookup
- FBPI order get/list/update
- Sandbox order creation
- Noon AWB retrieval and shipment creation
- HTTPS event destinations and `FBPI::ORDER_SYNC`

Before coding each adapter, capture and lock the current official request/response schema for shipment creation, shipment cancellation/read, courier AWBs, customer-data access, complete FBPI status enums, and webhook credential/signature behavior. Where Noon does not document a capability, the UI must not imply it is automated.

## Delivery phases

### Phase 1 — Secure connection and foundation
- Migrations, grants, owner policies, encryption secret, Noon client, connection wizard, health test, sandbox/production modes, activity log.
- Outcome: seller can securely connect a Noon project and validate KSA/UAE warehouses.

### Phase 2 — Selected product publishing
- Category/attribute cache, mapping UI, readiness validation, bilingual content, images, publish/update, QC/content tracking, saved Noon IDs.
- Outcome: selected Tejaraa products can be submitted and monitored.

### Phase 3 — Market offers, pricing, and stock
- KSA/UAE markup defaults, overrides, minimum margins, warehouses, safety stock, batch updates, live-offer verification.
- Outcome: approved products become sellable with controlled prices and inventory.

### Phase 4 — FBPI orders and shipments
- Webhook intake, job queue, full-order fetch, idempotent import, stock exceptions, AWB/shipment actions, reconciliation, notifications.
- Outcome: Noon orders flow into Tejaraa and can be fulfilled through the supported API steps.

### Phase 5 — Hardening and launch
- Sandbox test suite, failure simulations, rate-limit handling, recovery tools, admin operations view, audit/security review, production activation checklist.
- Outcome: monitored production launch for Saudi Arabia and UAE.

## Acceptance checks
- Credentials never appear in browser responses, logs, or client storage.
- A user cannot read, modify, sync, or disconnect another user's Noon account.
- Store and feature limits cannot be bypassed by calling server functions directly.
- A selected bilingual product can pass readiness, publish, retain Noon IDs, and show content/QC/image/offer status.
- KSA and UAE prices calculate correctly from defaults and overrides and never violate the minimum margin.
- Stock updates are absolute, warehouse-specific, coalesced, and safely retryable.
- Duplicate webhook deliveries and reconciliation windows create exactly one order.
- Webhooks respond quickly while processing continues durably.
- Failed jobs retry, then surface in the activity view with a safe actionable reason.
- Sandbox order flow completes through shipment creation before production can be enabled.
- Mobile and desktop layouts remain usable, with no changes to the public partner-home redesign task already queued separately.

## Known limitation
Noon requires sellers to complete manifestation and pickup scheduling manually in its portal; the integration will display that handoff clearly rather than claim full automation.
