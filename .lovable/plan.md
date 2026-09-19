# Agency / VA Partner Program

A new partner type: agencies and virtual assistants apply to join, get their own invite link, bring dropshippers onto Tejaraa, and earn a share of Tejaraa's profit on every order those dropshippers ever place.

Agreed rules:
- Commission = a percentage of Tejaraa's profit on the order (sale price minus product cost), not of the order total.
- Lifetime: every future order from an onboarded dropshipper earns commission.
- Earnings build into a balance; the agency requests a withdrawal and your team approves and marks it paid.
- Joining is by application with your approval.

## What agencies get

**Public pages**
- `/agency` — landing page explaining the program, earnings example, FAQ (Arabic mirror at `/ar/agency`).
- `/agency/apply` — application form: name, company, country, phone, email, audience/how they will recruit, password.
- `/agency/signin` — sign-in, plus forgot-password.

Applicants see a "pending review" screen until approved. Rejected applicants get an email with the reason.

**Agency portal (after approval)**
- Dashboard — lifetime earnings, unpaid balance, this month's commission, number of dropshippers onboarded, recent orders that earned.
- My link — their unique invite link and code, copy button, QR, share text in English and Arabic.
- My dropshippers — everyone who signed up through their link: join date, order count, total earned from them. No access to the dropshipper's private account, only aggregate figures.
- Earnings — an order-by-order ledger: date, dropshipper, order reference, commission amount, status (pending / approved / paid / reversed).
- Payouts — request a withdrawal above a minimum amount, see status history and bank/transfer details on file.
- Profile — contact and payout details.

## What your team gets

- `/admin/agencies` — applications queue (approve / reject with reason), agency list, per-agency commission rate override, suspend.
- `/admin/agencies/$id` — one agency: their dropshippers, earnings, payout history, manual adjustment (bonus or clawback).
- `/admin/agency-payouts` — withdrawal requests: approve, mark paid with a reference, or decline.
- A default commission rate and minimum payout amount in admin settings.

## How an order turns into commission

1. Dropshipper signs up through the agency's link — the link is recorded permanently on that account (first link wins, can't be changed later, an agency can't refer itself).
2. When an order's payment is confirmed, Tejaraa's profit is calculated line by line from the sale price and the product's cost, then the agency's rate is applied.
3. The commission is recorded as **pending** and becomes **approved** (payable) once the order is delivered and the return window has passed. Refunded or returned orders are **reversed** automatically.
4. Approved commissions add to the agency's withdrawable balance.

Agencies are notified by email when they are approved, when they earn their first commission from a new dropshipper, and when a payout is approved or paid.

## Technical notes

New tables (all with row-level security, grants, timestamps):
- `agency_profiles` — user, company, contact, country, status (pending/approved/rejected/suspended), invite code, commission rate override, payout details.
- `agency_clients` — links an onboarded dropshipper to an agency, with the join date. One agency per dropshipper, enforced.
- `agency_commissions` — one row per earning order: agency, client, order, order total, computed profit base, rate, amount, status, reversal reason.
- `agency_payout_requests` and `agency_payout_items` — withdrawal requests and the commissions they cover, mirroring the existing supplier payout flow.
- `agency_ledger_adjustments` — manual bonuses or clawbacks.

Mechanics:
- Adds an `agency` value to the existing role enum; portal routes are gated on approved status, admin routes on staff/admin.
- Profit base = sum over order lines of `(unit_price_sar - cost_usd × current USD→SAR rate) × qty`, using the same pricing settings the catalogue uses. The rate used is frozen onto the commission row so later cost changes don't rewrite history.
- A database trigger on `shop_orders` creates the commission when payment status turns paid, keyed uniquely on the order so it can never double-pay; status transitions on delivery, return and refund.
- Attribution reuses the existing `?ref=` capture in signup via a new `apply_agency_code` function, kept separate from the existing customer referral rewards so the two programs don't overlap.
- Commission rate, minimum payout and approval-delay days live in `platform_settings` with a per-agency override.
- Emails go through the existing outbox with new templates.

## Out of scope for this build

Automatic bank transfers (payouts are marked paid manually), multi-level/sub-agency commissions, and commission on anything other than confirmed platform orders.
