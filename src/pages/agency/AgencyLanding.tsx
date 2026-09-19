import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyCTA, AgencyFeatureList } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
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

const faqs = [
  { q: 'Who can join?', a: 'Marketing agencies, virtual assistants, community managers, coaches and anyone with an audience of e-commerce sellers in Saudi Arabia and the Gulf.' },
  { q: 'How long do I earn for?', a: 'For as long as the seller stays with Tejaraa. Every order they place earns you commission — there is no expiry.' },
  { q: 'When can I withdraw?', a: 'Earnings unlock once the order is delivered and the return window has closed. After that you can request a withdrawal whenever you are above the minimum amount.' },
  { q: 'Does it cost anything?', a: 'No. Joining is free and there are no targets or fees.' },
];

const exampleRows: Array<[string, string]> = [
  ['Orders placed by your sellers', '400'],
  ['Tejaraa profit on those orders', 'SAR 10,000'],
  ['Your commission (10%)', 'SAR 1,000'],
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

      <section id="how" className="scroll-mt-28 py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading
            eyebrow="Programme"
            title="How the programme works"
            description="Four steps from application to your first payout."
          />
          <ol className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-retail-green pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-green text-xs font-bold text-retail-card">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-retail-dark-green">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-retail-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <SellerSectionHeading
              eyebrow="Example"
              title="An example month"
              description="Onboard 10 dropshippers who each place 40 orders a month, at an average Tejaraa profit of SAR 25 per order and a 10% share."
            />
            <dl className="mt-5 divide-y divide-retail-border border-t border-retail-border bg-white">
              {exampleRows.map(([label, value], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${index === 2 ? 'text-base font-extrabold text-retail-dark-green' : 'text-sm'}`}
                >
                  <dt className={index === 2 ? '' : 'text-retail-muted'}>{label}</dt>
                  <dd className="font-bold text-retail-dark-green">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-5 text-retail-muted">
              Illustrative figures. Your actual rate is confirmed when your application is approved.
            </p>
          </div>
          <div className="min-w-0">
            <SellerSectionHeading eyebrow="Why partners join" title="Built to keep paying you" />
            <div className="mt-5">
              <AgencyFeatureList items={benefits} columns={2} />
            </div>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} title="Common questions" />

      <AgencyCTA
        variant="dark"
        title="Start onboarding sellers with Tejaraa"
        text="Applying is free and takes about two minutes."
        primaryLabel="Start my application"
      />
    </AgencyPublicShell>
  );
}
