import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { ArrowRight, CheckCircle2, Clock, RotateCcw, Wallet } from 'lucide-react';

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

export default function AgencyCommission() {
  return (
    <AgencyPublicShell>
      <section className="border-b border-retail-border bg-retail-card">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">Commission &amp; payouts</p>
          <h1 className="mt-3 text-4xl font-black text-retail-dark-green md:text-5xl">You earn every time they order</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-retail-muted">
            Not just the first order, not only for the first 90 days. For as long as your seller keeps
            buying through Tejaraa, you keep earning.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {rules.map((rule) => (
            <Card key={rule.title} className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <rule.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">{rule.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{rule.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">A worked example</h2>
              <dl className="mt-5 divide-y divide-border/60">
                {example.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm font-bold">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Rates shown are the standard programme rate. Your own rate is confirmed on approval and
                shown in your partner portal.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Ten sellers, every month</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                If you onboard 10 dropshippers and each places around SAR 20,000 of orders a month at a
                similar margin, your monthly commission would be in the region of SAR 7,000 — and it
                repeats every month those sellers stay active.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {['No cost to join', 'No cap on the number of sellers', 'No cut-off on earnings', 'Live reporting in your portal'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {item}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full"><Link to="/agency/apply">Apply to join <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgencyPublicShell>
  );
}
