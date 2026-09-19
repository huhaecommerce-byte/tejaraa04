import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { ArrowRight, Briefcase, CheckCircle2, GraduationCap, Laptop, Megaphone, Users, XCircle } from 'lucide-react';

const profiles = [
  { icon: Briefcase, title: 'E-commerce agencies', text: 'You already build and manage online stores for clients. Add Tejaraa fulfilment and earn on everything they sell.' },
  { icon: Laptop, title: 'Virtual assistants', text: 'You support sellers day to day with listings, orders and customer service. Bring them to Tejaraa and earn alongside them.' },
  { icon: GraduationCap, title: 'Coaches & course creators', text: 'You teach dropshipping and e-commerce. Give your students a ready supply chain and earn from their orders.' },
  { icon: Megaphone, title: 'Creators & communities', text: 'You have an audience of aspiring sellers on social media, YouTube or WhatsApp groups.' },
  { icon: Users, title: 'Consultants & freelancers', text: 'You advise retail and online businesses in the Gulf and can introduce them to a sourcing partner.' },
];

const expectations = [
  'Bring genuine, active sellers — not sign-up numbers',
  'Describe Tejaraa services accurately to the people you onboard',
  'Support your sellers in their first orders',
  'Keep one partner account per business',
];

const notAllowed = [
  'Paid ads bidding on the Tejaraa brand name',
  'Spam, misleading claims or fake guarantees',
  'Signing up on behalf of a seller to claim their orders',
  'Creating multiple accounts to self-refer',
];

export default function AgencyWhoCanJoin() {
  return (
    <AgencyPublicShell>
      <section className="border-b border-retail-border bg-retail-card">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">Who can join</p>
          <h1 className="mt-3 text-4xl font-black text-retail-dark-green md:text-5xl">Built for people who already work with sellers</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-retail-muted">
            The programme is free and open worldwide, but every application is reviewed by our
            partnerships team before approval.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Card key={p.title} className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold">{p.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h2 className="text-lg font-black">What we expect</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {expectations.map((item) => (
                  <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h2 className="text-lg font-black">What is not allowed</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {notAllowed.map((item) => (
                  <li key={item} className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg"><Link to="/agency/apply">Apply to join <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </AgencyPublicShell>
  );
}
