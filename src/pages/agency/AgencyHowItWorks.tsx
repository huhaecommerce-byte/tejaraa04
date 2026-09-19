import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { ArrowRight, ClipboardCheck, Link2, ShoppingBag, Coins, Wallet, LineChart } from 'lucide-react';

const journey = [
  {
    icon: ClipboardCheck,
    title: '1. Apply and get approved',
    text: 'Tell us about your agency or VA business and how you plan to bring sellers to Tejaraa. Our partnerships team reviews every application, usually within two working days.',
  },
  {
    icon: Link2,
    title: '2. Share your invite link',
    text: 'Approved partners get a personal code and invite link inside the partner portal. Any dropshipper who signs up through it is permanently attached to your account.',
  },
  {
    icon: ShoppingBag,
    title: '3. Your sellers start ordering',
    text: 'Your sellers source, list and sell. Tejaraa handles sourcing, warehousing, labelling, shipping and support, so you can focus on bringing in and coaching sellers.',
  },
  {
    icon: Coins,
    title: '4. Commission is recorded',
    text: 'Every paid order creates a commission line for you, calculated on Tejaraa profit for that order. It starts as pending while the order is on its way.',
  },
  {
    icon: LineChart,
    title: '5. Commission is approved',
    text: 'Once the order is delivered and the return window closes, the commission becomes available. Cancelled, returned or refunded orders reverse automatically.',
  },
  {
    icon: Wallet,
    title: '6. Request your payout',
    text: 'When your available balance passes the minimum, request a withdrawal from the portal. Our finance team approves it and marks it paid to your bank account.',
  },
];

export default function AgencyHowItWorks() {
  return (
    <AgencyPublicShell>
      <section className="border-b border-retail-border bg-retail-card">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">How it works</p>
          <h1 className="mt-3 text-4xl font-black text-retail-dark-green md:text-5xl">From application to payout</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-retail-muted">
            Six simple steps. No fees, no targets to unlock payment, and no cut-off date on your earnings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {journey.map((step) => (
            <Card key={step.title} className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-retail-border bg-retail-card p-8 text-center">
          <h2 className="text-2xl font-black text-retail-dark-green">Ready to start onboarding sellers?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-retail-muted">
            Applying takes about two minutes and costs nothing.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/agency/apply">Apply to join <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/agency/commission">See how commission works</Link></Button>
          </div>
        </div>
      </section>
    </AgencyPublicShell>
  );
}
