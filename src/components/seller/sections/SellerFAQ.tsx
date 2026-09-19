import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerFaqs } from '@/data/sellerServices';

export function SellerFAQ() {
  return (
    <section id="faq" className="scroll-mt-28 py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Answers about how Tejaraa Seller Services works today."
          align="center"
        />
        <div className="mx-auto mt-7 max-w-3xl">
          <Accordion type="single" collapsible className="grid gap-3">
            {sellerFaqs.map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${index}`}
                className="overflow-hidden rounded-xl border border-retail-border bg-white px-4 last:border-b"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-bold text-retail-dark-green hover:no-underline sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-6 text-retail-muted">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SellerContainer>
    </section>
  );
}
