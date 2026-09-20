# Arabic customer portals

## Scope
Translate the complete signed-in customer experience for:
- Dropshipping & Selling portal
- Agencies & VAs portal
- Wholesalers & Suppliers partner portal

Admin and agency-admin portals will remain unchanged.

## Implementation
1. Inventory every portal route, shared sidebar/header, card, form, dialog, table, status, empty state, notification, and validation message.
2. Add complete English/Arabic dictionary entries using the existing locale system, including dynamic values and plural/count labels.
3. Replace hardcoded portal copy with translation keys across all affected pages and shared customer components.
4. Translate portal navigation and ensure Arabic uses right-to-left layout, correct alignment, icon placement, and locale-aware dates/numbers where applicable.
5. Keep the selected language across portal navigation and direct URLs, while preserving the existing first-visit language choice.
6. Add unique page metadata for any customer portal route currently missing required metadata.

## Verification
- Check every non-admin portal route in English and Arabic.
- Verify desktop and mobile layouts, menus, forms, dialogs, tables, pagination, loading/empty/error states, and no raw translation keys.
- Confirm admin portals are unaffected and the app builds without errors.
