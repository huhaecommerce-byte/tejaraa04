import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function FilterSection({ value, title, children, defaultOpen = true }: { value: string; title: string; children: ReactNode; defaultOpen?: boolean }) {
  return <Accordion type="single" collapsible defaultValue={defaultOpen ? value : undefined}><AccordionItem value={value} className="border-retail-border"><AccordionTrigger className="py-3 text-sm font-bold text-retail-text hover:no-underline">{title}</AccordionTrigger><AccordionContent className="pb-3">{children}</AccordionContent></AccordionItem></Accordion>;
}