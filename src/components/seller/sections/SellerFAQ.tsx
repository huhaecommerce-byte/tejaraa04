import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

const faqKeys: { qKey: TranslationKey; aKey: TranslationKey }[] = Array.from({ length: 8 }, (_, i) => ({
  qKey: `selling.faq.${i + 1}.q` as TranslationKey,
  aKey: `selling.faq.${i + 1}.a` as TranslationKey,
}));

export function SellerFAQ() {
  const { t } = useLocale();
  return (
    <section id="faq" className="scroll-mt-28 py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          eyebrow={t('selling.faqSection.eyebrow')}
          title={t('selling.faqSection.title')}
          description={t('selling.faqSection.desc')}
          align="center"
        />
        <div className="mx-auto mt-7 max-w-3xl">
          <Accordion type="single" collapsible className="grid gap-3">
            {faqKeys.map((faq, index) => (
              <AccordionItem
                key={faq.qKey}
                value={`faq-${index}`}
                className="overflow-hidden rounded-xl border border-retail-border bg-white px-4 last:border-b"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-bold text-retail-dark-green hover:no-underline sm:text-base">
                  {t(faq.qKey)}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-6 text-retail-muted">
                  {t(faq.aKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SellerContainer>
    </section>
  );
}
