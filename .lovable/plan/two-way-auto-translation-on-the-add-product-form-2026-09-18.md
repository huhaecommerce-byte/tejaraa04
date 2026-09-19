# Two-way auto translation on the Add Product form

Suppliers fill in either the English or the Arabic column, and the other side fills itself automatically a moment later. Nothing else in the app changes.

## What the supplier sees

- Types an English title, brand or description → the matching Arabic field fills in on its own about a second after they stop typing.
- Types Arabic first → the English field fills in the same way.
- A small "Translating…" hint appears on the field being filled, then a quiet "auto-translated" note the supplier can ignore.
- Any field the supplier edits by hand is treated as final: it is never overwritten afterwards, so corrected wording stays.
- Empty source field → the translated side is left alone.
- If translation is unavailable at that moment, a short inline note says so and the supplier can still type both sides manually and save.

## Fields covered

Title, Brand and Description, in both directions. SKU, warehouse, category, prices and images are untouched.

## Technical notes

- Reuse the existing `translateText` server function (`src/lib/translate.functions.ts`), the free engine, with `from`/`to` set to `en`/`ar` per direction. No new service and no keys.
- Add a small client hook (e.g. `src/hooks/partners/useAutoTranslate.ts`):
  - 800 ms debounce per field, request cancelled/ignored if the source changed again (keep a request counter so a stale response never lands).
  - Per-field `dirty` flags: writing into a target field manually marks it dirty and stops auto-fill for that field; clearing it re-enables.
  - Skips when the source is under 2 characters or unchanged since the last successful translation.
  - Description is HTML from the rich text editor — translate the text nodes and re-apply them into the same markup so tags/lists survive, then run the existing `sanitizeRichText` before storing.
- Wire the hook into `ProductForm.tsx` over the existing `values.name`/`nameAr`, `brand`/`brandAr`, `description`/`descriptionAr` state. No schema change: the Arabic columns (`name_ar`, `brand_ar`, `description_ar`) already exist and already save.
- Guard against loops: translation writes set a flag so a filled target never triggers a reverse translation.
- Verify with `bunx tsgo --noEmit` and a browser pass on `/partners/products/new` in both directions.
