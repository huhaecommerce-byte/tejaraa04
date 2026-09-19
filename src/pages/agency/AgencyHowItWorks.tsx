import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyPageHero } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import { ClipboardCheck, Link2, ShoppingBag, Coins, Wallet, LineChart, ListChecks } from 'lucide-react';

const journey = [
  { icon: ClipboardCheck, title: 'Apply and get approved', text: 'Tell us about your agency or VA business and how you plan to bring sellers to Tejaraa. Our partnerships team reviews every application, usually within two working days.' },
  { icon: Link2, title: 'Share your invite link', text: 'Approved partners get a personal code and invite link inside the partner portal. Any dropshipper who signs up through it is permanently attached to your account.' },
  { icon: ShoppingBag, title: 'Your sellers start ordering', text: 'Your sellers source, list and sell. Tejaraa handles sourcing, warehousing, labelling, shipping and support, so you can focus on bringing in and coaching sellers.' },
  { icon: Coins, title: 'Commission is recorded', text: 'Every paid order creates a commission line for you, calculated on Tejaraa profit for that order. It starts as pending while the order is on its way.' },
  { icon: LineChart, title: 'Commission is approved', text: 'Once the order is delivered and the return window closes, the commission becomes available. Cancelled, returned or refunded orders reverse automatically.' },
  { icon: Wallet, title: 'Request your payout', text: 'When your available balance passes the minimum, request a withdrawal from the portal. Our finance team approves it and marks it paid to your bank account.' },
];

const responsibilities = [
  { who: 'Tejaraa', items: ['Sourcing, storage and quality checks', 'Packing, labelling and dispatch', 'Seller support and order tracking', 'Commission tracking and payouts'] },
  { who: 'You', items: ['Finding and onboarding sellers', 'Sharing your invite link correctly', 'Helping sellers place their first orders', 'Keeping your payout details current'] },
];

const faqs = [
  { q: 'How long does approval take?', a: 'Most applications are reviewed within two working days and you get an email with the decision.' },
  { q: 'Is there a minimum number of sellers?', a: 'No. There are no targets and no fees — you earn on whatever your sellers order.' },
  { q: 'What if a seller signs up without my link?', a: 'Attribution happens at signup, so ask your sellers to use your link or enter your partner code on the signup form.' },
  { q: 'Can I see my sellers activity?', a: 'Yes. Your portal lists every linked seller, their order activity and the commission each order produced.' },
];

export default function AgencyHowItWorks() {
  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: 'How It Works' }]} />
      <AgencyPageHero
        icon={ListChecks}
        eyebrow="How it works"
        title="From application to payout"
        lead="Six simple steps. No fees, no targets to unlock payment, and no cut-off date on your earnings."
        tags={['Apply', 'Onboard sellers', 'Earn', 'Withdraw']}
        flow={['Apply', 'Get approved', 'Share your link', 'Sellers order', 'Get paid']}
        flowCaption="Your sellers stay linked to you for the life of their account."
      />

      <section className="py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Journey" title="Six steps, one clear flow" />
          <ol className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((step, index) => (
              <li key={step.title} className="border-t-2 border-retail-green pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-green text-xs font-bold text-retail-card">
                    {index + 1}
                  </span>
                  <h2 className="text-sm font-bold text-retail-dark-green">{step.title}</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-retail-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Split" title="Who does what" description="You bring the sellers; Tejaraa runs the operation behind them." />
          <ul className="mt-5 grid gap-5 lg:grid-cols-2">
            {responsibilities.map((block) => (
              <li key={block.who} className="border-t-2 border-retail-green bg-white p-4">
                <h3 className="font-extrabold text-retail-dark-green">{block.who}</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-retail-muted">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} />

      <AgencyCTA
        variant="dark"
        title="Ready to start onboarding sellers?"
        text="Applying takes about two minutes and costs nothing."
        secondaryLabel="See how commission works"
        secondaryTo="/agency/commission"
      />
    </AgencyPublicShell>
  );
}
