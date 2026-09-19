# Noon publishing queue — requirements and readiness

## What Noon needs before a product can be queued for publishing

Your question, answered from the current publishing code (`src/lib/noon.server.ts`):

1. **Product selected** — the item must be in your Noon list (a `noon_product_links` row exists).
2. **Noon category chosen** — each product must be mapped to a Noon category, or publishing fails with "Choose a Noon category before publishing".
3. **GTIN / barcode** — Noon requires a barcode; without it the publish call fails.
4. **At least one image** — required by Noon content rules.
5. **Title and description** — sent in English, plus Arabic automatically when the product has Arabic fields filled.
6. **Price per market** — comes from your markup rules / overrides in Settings; today this is only stored, not pushed to Noon.
7. **Stock per warehouse** — FBPI needs an absolute stock quantity per warehouse; currently not pushed either.
8. **Working connection** — key ID + private key verified, and at least one warehouse configured for the market.

## Gaps found

- The publishing queue sends content only (title, description, GTIN, images, category). Price and stock are never sent, so even a successful publish leaves products unpurchasable on Noon.
- The queue UI doesn't tell you *before* publishing which products are missing category, GTIN, or images — you only find out after a failure.

## Proposed work

1. **Readiness check per product in the queue** — before publishing, validate category / GTIN / images / price / stock and show a per-row status chip (Ready / Missing X) instead of failing after the fact.
2. **Price push** — after content publish succeeds, send each market's price (markup rule or manual override, respecting minimum margin) to Noon's price endpoint.
3. **Stock push** — send absolute quantity per configured warehouse, with the safety-stock buffer from Settings.
4. **Clearer failure list** — publish results show exactly which item failed and why, with a "Retry failed only" button.

## Technical details

- `src/lib/noon.server.ts`: extend `publishNoonProducts` with `validateReadiness`, add price/stock API calls after content upsert.
- `src/pages/customer/NoonWorkspace.tsx`: per-row readiness chips, missing-field hints, retry-failed button.
- Uses existing `noon_product_market_settings` and `noon_warehouses` tables; no schema change expected.
