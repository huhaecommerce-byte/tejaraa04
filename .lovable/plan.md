# Agency admin — complete the back office

## What already exists (no work needed)

- **Agencies list** at `/admin/agencies` — search, status filter (pending / approved / rejected / suspended), client counts and earnings per partner, approve / reject.
- **Agency detail** at `/admin/agencies/:id` — full profile, invite code, approve / reject / suspend, custom commission-rate override per agency.
- **Agency payouts** at `/admin/agency-payouts` — approve, decline with reason, mark paid with transfer reference.
- All three are already linked in the admin menu under "Agencies & VAs".

## What this plan adds (the gaps)

1. **Agency clients view (admin)** — on the agency detail page, list the dropshippers that partner brought in (name, store, orders, commission earned) so staff can audit attribution without running SQL.

2. **Agency commission ledger (admin)** — on the agency detail page, show every commission entry (order, amount, status: pending / available / reversed / paid) so staff can explain any balance to a partner.

3. **Agency programme settings page** at `/admin/agency-settings` — edit the programme-wide values without touching the database:
   - Default commission rate (applies when an agency has no custom rate)
   - Minimum payout amount
   - Payout hold period (days after delivery before commission becomes available)
   - Auto-approve new applications on/off

4. **Agency email templates** — surface the agency welcome / payout-status email templates in the existing admin emails page so staff can preview and edit wording.

## Technical notes

- Reuse the existing RPC pattern (`admin_list_agencies`, `agency_admin_set_status`, `agency_admin_decide_payout`); add two read-only RPCs for clients + ledger and one settings read/update RPC, all guarded by the existing admin role check.
- Settings stored in the existing `agency_settings` table created in the partner-programme migration.
- Admin area stays English-only (matching the rest of the admin).

## Out of scope

- Automatic bank transfers to agencies (manual "mark as paid" stays).
- Multi-level commissions.
