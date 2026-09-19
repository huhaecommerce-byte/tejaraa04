import { ClipboardCheck, Languages, MapPin, SlidersHorizontal } from 'lucide-react';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';

/** Factual strengths only — no seller counts, order volumes or success rates. */
const trustItems = [
  { icon: MapPin, title: 'Saudi-based operations', text: 'Warehousing and delivery inside the Kingdom, with sourcing from local and overseas suppliers.' },
  { icon: ClipboardCheck, title: 'Marketplace experience', text: 'Inventory prepared for supported marketplace fulfilment requirements.' },
  { icon: SlidersHorizontal, title: 'Flexible service model', text: 'Use one service or several, and change the mix as your business changes.' },
  { icon: Languages, title: 'Arabic & English support', text: 'Work with a team that speaks your customers’ language.' },
];

export function SellerTrust() {
  return (
    <section className="bg-retail-dark-green py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          onDark
          eyebrow="Why it's dependable"
          title="A seller-focused operation, not a marketplace listing"
          description="Tejaraa is built around seller operations in Saudi Arabia. Here is what that means in practice."
          align="center"
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex h-full flex-col rounded-xl border border-white/12 bg-white/[0.06] p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-retail-gold">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{item.text}</p>
            </div>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}
