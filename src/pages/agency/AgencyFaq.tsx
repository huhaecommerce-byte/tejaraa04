import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyBreadcrumbs, AgencyCTA, AgencyPageHero } from '@/components/agency/sections';
import { ServiceFAQ } from '@/components/seller/service';
import { HelpCircle } from 'lucide-react';

const faqs = [
  { q: 'Does it cost anything to join?', a: 'No. The programme is completely free and there is no minimum number of sellers you have to bring.' },
  { q: 'How are my sellers linked to me?', a: 'Every approved partner gets a unique code and invite link. A dropshipper who signs up through it is permanently linked to your account.' },
  { q: 'How long do I keep earning from a seller?', a: 'For as long as they keep ordering. There is no 30 or 90 day cut-off — the link is for the lifetime of the account.' },
  { q: 'What exactly is the commission calculated on?', a: 'It is a percentage of the profit Tejaraa makes on the order: the sale price minus the cost of the products, line by line.' },
  { q: 'When can I withdraw?', a: 'Commission becomes available once the order is delivered and the return window closes. When your available balance passes the minimum payout, you can request a withdrawal from the portal.' },
  { q: 'What happens if an order is cancelled or returned?', a: 'The matching commission is reversed automatically, so your balance always reflects orders that actually completed.' },
  { q: 'Can I see what my sellers are doing?', a: 'You see the sellers linked to you, their order activity and exactly what each order earned you. Personal contact details stay private.' },
  { q: 'How long does approval take?', a: 'Most applications are reviewed within two working days. You get an email as soon as a decision is made.' },
  { q: 'Can I join from outside Saudi Arabia?', a: 'Yes. Partners can be based anywhere; payouts are made in SAR to the bank details on your partner profile.' },
  { q: 'Is this the same as the customer referral programme?', a: 'No. The customer referral programme gives shoppers credit. The agency programme pays ongoing commission on seller orders and is reviewed and approved separately.' },
];

export default function AgencyFaq() {
  return (
    <AgencyPublicShell>
      <AgencyBreadcrumbs items={[{ label: 'FAQ' }]} />
      <AgencyPageHero
        icon={HelpCircle}
        eyebrow="FAQ"
        title="Questions partners ask"
        lead="Everything about joining, attribution, commission and payouts in one place."
        tags={['Joining', 'Commission', 'Payouts']}
      />

      <ServiceFAQ items={faqs} title="Frequently asked questions" />

      <AgencyCTA
        variant="dark"
        title="Still have a question?"
        text="Apply to the programme and our partnerships team will walk you through everything before you go live."
        primaryLabel="Apply to join"
        primaryTo="/agency/apply"
      />
    </AgencyPublicShell>
  );
}
