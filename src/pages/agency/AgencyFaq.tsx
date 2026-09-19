import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';

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
      <section className="border-b border-retail-border bg-retail-card">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green">FAQ</p>
          <h1 className="mt-3 text-4xl font-black text-retail-dark-green md:text-5xl">Questions partners ask</h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-base font-bold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 rounded-2xl border border-retail-border bg-retail-card p-8 text-center">
          <h2 className="text-xl font-black text-retail-dark-green">Still have a question?</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/agency/contact">Talk to partnerships</Link></Button>
            <Button asChild variant="outline"><Link to="/agency/apply">Apply to join</Link></Button>
          </div>
        </div>
      </section>
    </AgencyPublicShell>
  );
}
