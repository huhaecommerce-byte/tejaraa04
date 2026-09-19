import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import {
  Handshake, Users, Coins, Repeat, ShieldCheck, LineChart, ArrowRight,
} from 'lucide-react';

const steps = [
  { icon: Handshake, title: 'Apply in two minutes', text: 'Tell us who you are and how you plan to bring sellers to Tejaraa. Our team reviews every application.' },
  { icon: Users, title: 'Onboard dropshippers', text: 'Once approved you get a personal invite link. Anyone who signs up through it is permanently linked to you.' },
  { icon: Coins, title: 'Earn on every order', text: 'You earn a share of Tejaraa profit on every single order your sellers place — not just their first one.' },
  { icon: Repeat, title: 'Get paid monthly', text: 'Earnings build up in your partner balance. Request a withdrawal any time you pass the minimum.' },
];

const benefits = [
  { icon: Repeat, title: 'Lifetime commission', text: 'No cut-off after 30 or 90 days. As long as your seller keeps ordering, you keep earning.' },
  { icon: LineChart, title: 'Full transparency', text: 'See every order, the profit it made and exactly what you earned, in real time.' },
  { icon: ShieldCheck, title: 'We do the heavy lifting', text: 'Sourcing, warehousing, labelling, shipping and support are all handled by Tejaraa.' },
];

export default function AgencyLanding() {
  return (
    <AgencyPublicShell>
      <section className="hero-surface relative overflow-hidden text-white">
        <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
        <SellerContainer className="relative py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-retail-gold" />
              Agency &amp; VA programme in Saudi Arabia
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Grow your income every time <span className="text-retail-gold">your sellers sell.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              Earn a share of our profit on every order your sellers ever place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-retail-gold font-bold text-retail-dark-green hover:bg-retail-gold/90">
                <Link to="/agency/apply">
                  Apply to join
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                <Link to="/agency/signin">Partner sign in</Link>
              </Button>
            </div>
          </div>
        </SellerContainer>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black md:text-4xl">How the programme works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {i + 1}</div>
                <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-black md:text-4xl">An example month</h2>
              <p className="mt-3 text-muted-foreground">
                Say you onboard 10 dropshippers and each places 40 orders in a month. Tejaraa makes
                an average profit of SAR 25 per order, and your share is 10%.
              </p>
              <div className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
                {[
                  ['Orders placed by your sellers', '400'],
                  ['Tejaraa profit on those orders', 'SAR 10,000'],
                  ['Your commission (10%)', 'SAR 1,000'],
                ].map(([k, v], i) => (
                  <div key={k} className={`flex items-center justify-between gap-4 ${i === 2 ? 'border-t pt-3 text-lg font-bold' : 'text-sm'}`}>
                    <span className={i === 2 ? '' : 'text-muted-foreground'}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Illustrative figures. Your actual rate is confirmed when your application is approved.
              </p>
            </div>
            <div className="grid gap-4">
              {benefits.map((b) => (
                <Card key={b.title} className="border-border/60">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{b.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center text-3xl font-black">Common questions</h2>
        <div className="mt-8 space-y-4">
          {[
            ['Who can join?', 'Marketing agencies, virtual assistants, community managers, coaches and anyone with an audience of e-commerce sellers in Saudi Arabia and the Gulf.'],
            ['How long do I earn for?', 'For as long as the seller stays with Tejaraa. Every order they place earns you commission — there is no expiry.'],
            ['When can I withdraw?', 'Earnings unlock once the order is delivered and the return window has closed. After that you can request a withdrawal whenever you are above the minimum amount.'],
            ['Does it cost anything?', 'No. Joining is free and there are no targets or fees.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-xl border bg-card p-5">
              <h3 className="font-bold">{q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link to="/agency/apply">Start my application <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </AgencyPublicShell>
  );
}
