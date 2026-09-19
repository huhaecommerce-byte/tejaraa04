import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyFeatureList, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { Briefcase, CheckCircle2, GraduationCap, Laptop, Megaphone, Users, XCircle } from 'lucide-react';

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

const faqs = [
  { q: 'Can I join from outside Saudi Arabia?', a: 'Yes. Partners can be based anywhere; payouts are made in SAR to the bank details on your partner profile.' },
  { q: 'Do I need a registered company?', a: 'No, individuals such as virtual assistants and freelancers are welcome. Registered agencies simply add their company details on the application.' },
  { q: 'Can I run both a seller account and a partner account?', a: 'Yes, but you cannot use your partner link to claim commission on your own seller account.' },
  { q: 'What happens if an application is rejected?', a: 'You receive an email explaining the decision and you are welcome to apply again with more detail about your seller network.' },
];

export default function AgencyWhoCanJoin() {
  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: 'Who Can Join' }]} />
      <AgencyPageHero
        icon={Users}
        eyebrow="Who can join"
        title="Built for people who already work with sellers"
        lead="The programme is free and open worldwide, but every application is reviewed by our partnerships team before approval."
        tags={['Free to join', 'Reviewed applications', 'Open worldwide']}
      />

      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Partner profiles" title="Who the programme is for" description="If you already talk to e-commerce sellers, the programme fits your business." />
          <div className="mt-5">
            <AgencyFeatureList items={profiles} columns={3} />
          </div>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Ground rules" title="What we expect, what is not allowed" />
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="border-t-2 border-retail-green bg-white p-4">
              <h3 className="font-extrabold text-retail-dark-green">What we expect</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-retail-muted">
                {expectations.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-retail-green" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t-2 border-destructive bg-white p-4">
              <h3 className="font-extrabold text-retail-dark-green">What is not allowed</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-retail-muted">
                {notAllowed.map((item) => (
                  <li key={item} className="flex gap-2">
                    <XCircle className="mt-1 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} />

      <AgencyCTA
        variant="dark"
        title="Think you are a fit?"
        text="Send your application and our partnerships team will come back to you within two working days."
      />
    </AgencyPublicShell>
  );
}
