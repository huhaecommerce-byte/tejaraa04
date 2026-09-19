import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { supplierFaqs } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

export function SupplierFAQ() {
  const { t } = useLocale();
  return (
    <section id="faq" className="scroll-mt-28 border-y border-retail-border bg-white py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          align="center"
          eyebrow={t('supplier.faq.eyebrow')}
          title={t('supplier.faq.title')}
          description={t('supplier.faq.description')}
        />
        <Accordion type="single" collapsible className="mx-auto mt-6 max-w-3xl">
          {supplierFaqs.map((faq, index) => (
            <AccordionItem key={faq.q} value={`supplier-faq-${index}`} className="border-retail-border">
              <AccordionTrigger className="py-4 text-left text-sm font-bold text-retail-dark-green hover:no-underline sm:text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-6 text-retail-muted">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SupplierContainer>
    </section>
  );
}
