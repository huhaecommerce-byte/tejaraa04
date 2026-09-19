# Show "Noon category" as completed once chosen

In the publishing queue row, when a Noon category has been chosen for a product, the red "Missing: Noon category" badge should become a green "Noon category" badge instead of staying red until the next refresh.

## Change

In `src/pages/customer/NoonWorkspace.tsx` (the `ProductRow` component):

- Treat the category as satisfied when the row has a category — either saved on the link or currently picked in the category selector (`categoryCode`).
- Remove "Noon category" from the red missing list in that case, and show a green success badge (e.g. "Noon category" with a check icon) so it reads as completed.
- Same treatment for GTIN: once a value is typed in the GTIN box, the "Missing: GTIN / barcode" badge turns into a green "GTIN / barcode" completed badge (live feedback without saving first).
- "Ready to publish" badge appears only when every requirement is satisfied (saved or currently filled in), keeping the publish checkbox enabled/disabled in sync.

No database or server changes — this is display logic only; saving still works as before.
