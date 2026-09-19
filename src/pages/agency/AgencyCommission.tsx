import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyFeatureList, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { CheckCircle2, Clock, Coins, RotateCcw, Wallet } from 'lucide-react';

const rules = [
  { icon: CheckCircle2, title: 'Paid on profit, not on price', text: 'Your commission is a share of the profit Tejaraa makes on the order — the selling price minus the product cost, line by line.' },
  { icon: Clock, title: 'Pending until delivered', text: 'A new commission is pending while the order is in transit. It becomes available after delivery and the return window has passed.' },
  { icon: RotateCcw, title: 'Reversed if the order fails', text: 'If an order is cancelled, returned or refunded, the matching commission is reversed automatically — so the numbers you see are real.' },
  { icon: Wallet, title: 'Withdraw in SAR', text: 'Once your available balance passes the minimum payout, request a withdrawal to your bank account from the partner portal.' },
];

const example = [
  { label: 'Seller order value', value: 'SAR 1,200' },
  { label: 'Product cost to Tejaraa', value: 'SAR 775' },
  { label: 'Tejaraa profit on the order', value: 'SAR 425' },
  { label: 'Your share of the profit', value: '10%' },
  { label: 'You earn on this single order', value: 'SAR 42.50' },
];

const guarantees = [
  'No cost to join',
  'No cap on the number of sellers',
  'No cut-off on earnings',
  'Live reporting in your portal',
];

const faqs = [
  { q: 'Is the rate the same for everyone?', a: 'The standard programme rate applies by default. Larger agencies can agree a custom rate with the partnerships team; your rate is always shown in your portal.' },
  { q: 'When does a commission become available?', a: 'After the order is delivered and the return window closes. Until then it stays pending in your balance.' },
  { q: 'What is the minimum payout?', a: 'A minimum balance applies before a withdrawal can be requested; the current figure is shown on your payouts page.' },
  { q: 'Which currency are payouts made in?', a: 'Payouts are made in SAR to the bank details on your partner profile.' },
];

export default function AgencyCommission() {
  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: 'Commission' }]} />
      <AgencyPageHero
        icon={Coins}
        eyebrow="Commission & payouts"
        title="You earn every time they order"
        lead="Not just the first order, not only for the first 90 days. For as long as your seller keeps buying through Tejaraa, you keep earning."
        tags={['Share of profit', 'Lifetime', 'Paid in SAR']}
        flow={['Order paid', 'Commission pending', 'Order delivered', 'Commission available', 'Payout requested']}
        flowCaption="Cancelled, returned or refunded orders reverse automatically."
      />

      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="The rules" title="How commission is calculated" description="Four rules that decide what you earn and when you can take it out." />
          <div className="mt-5">
            <AgencyFeatureList items={rules} columns={4} />
          </div>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <SellerSectionHeading eyebrow="Worked example" title="One order, step by step" as="h2" />
            <dl className="mt-5 divide-y divide-retail-border border-t border-retail-border bg-white">
              {example.map((row, index) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${index === example.length - 1 ? 'text-base font-extrabold text-retail-dark-green' : 'text-sm'}`}
                >
                  <dt className={index === example.length - 1 ? '' : 'text-retail-muted'}>{row.label}</dt>
                  <dd className="font-bold text-retail-dark-green">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-5 text-retail-muted">
              Rates shown are the standard programme rate. Your own rate is confirmed on approval and shown in your partner portal.
            </p>
          </div>

          <div className="min-w-0">
            <SellerSectionHeading eyebrow="At scale" title="Ten sellers, every month" as="h2" />
            <p className="mt-3 text-sm leading-6 text-retail-muted">
              If you onboard 10 dropshippers and each places around SAR 20,000 of orders a month at a similar
              margin, your monthly commission would be in the region of SAR 7,000 — and it repeats every month
              those sellers stay active.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-retail-dark-green">
              {guarantees.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-retail-green" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} />

      <AgencyCTA
        variant="dark"
        title="Turn your seller network into monthly income"
        text="Apply now and start sharing your invite link as soon as you are approved."
      />
    </AgencyPublicShell>
  );
}
