import { Link } from '@/lib/router-compat';
import { ArrowRight, Check, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { servicePageBySlug, sellerExtraPages, sellerTrustStrip } from '@/data/sellerServicePages';
import type { LucideIcon } from 'lucide-react';
import type { FaqItem, IconItem, ProcessStep } from '@/data/sellerServicePages';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';
import { en as enDict, type TranslationKey } from '@/i18n/dictionary';

/* ── What this service is ──────────────────────────────────────── */
export function ServiceOverview({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <section id="overview" className="scroll-mt-24 py-10 lg:py-12">
      <SellerContainer>
        {(() => { const { t } = useLocale(); return <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowOverview')} title={title} />; })()}
        <div className="mt-5 grid max-w-3xl gap-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-base leading-7 text-retail-muted">{paragraph}</p>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}

/* ── Who it is for / use cases ─────────────────────────────────── */
export function SellerUseCases({
  title, items, description, id = 'who-its-for',
}: { title: string; items: IconItem[]; description?: string; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 border-y border-retail-border bg-retail-light-green py-10 lg:py-12">
      <SellerContainer>
        {(() => { const { t } = useLocale(); return <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowUseCases')} title={title} description={description} />; })()}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title: itemTitle, text }) => (
            <li key={itemTitle} className="rounded-xl border border-retail-border bg-white p-5">
              {Icon ? (
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
              ) : null}
              <h3 className="mt-3 text-sm font-bold text-retail-dark-green">{itemTitle}</h3>
              <p className="mt-1.5 text-sm leading-6 text-retail-muted">{text}</p>
            </li>
          ))}
        </ul>
      </SellerContainer>
    </section>
  );
}

/* ── Process: horizontal desktop, vertical mobile ──────────────── */
export function ServiceProcess({
  title, steps, note, id = 'how-it-works',
}: { title: string; steps: ProcessStep[]; note?: string; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 py-10 lg:py-12">
      <SellerContainer>
        {(() => { const { t } = useLocale(); return <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowProcess')} title={title} description={note} />; })()}
        <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-retail-green text-xs font-extrabold text-white">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-bold text-retail-dark-green">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-retail-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </SellerContainer>
    </section>
  );
}

/* ── What Tejaraa handles / what you handle ────────────────────── */
export function ResponsibilitySplit({
  title, tejaraa, you,
}: { title: string; tejaraa: string[]; you: string[] }) {
  const { t } = useLocale();
  const columns: { heading: string; items: string[]; dark: boolean }[] = [
    { heading: t('selling.svc.ui.tejaraaHandles'), items: tejaraa, dark: true },
    { heading: t('selling.svc.ui.youHandle'), items: you, dark: false },
  ];
  return (
    <section id="responsibilities" className="scroll-mt-24 border-y border-retail-border bg-white py-10 lg:py-12">
      <SellerContainer>
        <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowResponsibilities')} title={title} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {columns.map(({ heading, items, dark }) => (
            <div
              key={heading}
              className={cn('rounded-2xl border p-6', dark ? 'border-retail-green/25 bg-retail-light-green' : 'border-retail-border bg-retail-page')}
            >
              <h3 className="text-base font-extrabold text-retail-dark-green">{heading}</h3>
              <ul className="mt-4 grid gap-2.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-retail-text">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', dark ? 'text-retail-green' : 'text-retail-medium-green')} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}

/* ── Benefits ──────────────────────────────────────────────────── */
export function ServiceBenefits({ title, items }: { title: string; items: IconItem[] }) {
  return (
    <section id="benefits" className="scroll-mt-24 py-10 lg:py-12">
      <SellerContainer>
        {(() => { const { t } = useLocale(); return <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowBenefits')} title={title} />; })()}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title: itemTitle, text }) => (
            <li key={itemTitle} className="rounded-xl border border-retail-border bg-white p-5">
              {Icon ? (
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-retail-dark-green text-retail-gold">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
              ) : null}
              <h3 className="mt-3 text-sm font-bold text-retail-dark-green">{itemTitle}</h3>
              <p className="mt-1.5 text-sm leading-6 text-retail-muted">{text}</p>
            </li>
          ))}
        </ul>
      </SellerContainer>
    </section>
  );
}

/* ── Requirements / important notes ────────────────────────────── */
export function ServiceRequirements({
  title, intro, items, note,
}: { title: string; intro?: string; items: string[]; note?: string }) {
  return (
    <section id="requirements" className="scroll-mt-24 border-y border-retail-border bg-retail-light-green py-10 lg:py-12">
      <SellerContainer className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        {(() => { const { t } = useLocale(); return <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowGettingReady')} title={title} description={intro} />; })()}
        <div className="rounded-2xl border border-retail-border bg-white p-6">
          <ul className="grid gap-2.5">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-retail-text">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {note ? (
            <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-retail-page p-3.5 text-xs leading-5 text-retail-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-retail-medium-green" aria-hidden />
              {note}
            </p>
          ) : null}
        </div>
      </SellerContainer>
    </section>
  );
}

/* ── Compact trust strip (kept small on service pages) ─────────── */
export function ServiceTrustStrip() {
  return (
    <section className="border-y border-retail-border bg-white py-8">
      <SellerContainer>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sellerTrustStrip.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              {Icon ? (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
              <span className="min-w-0">
                <span className="block text-sm font-bold text-retail-dark-green">{title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-retail-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </SellerContainer>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────── */
export function ServiceFAQ({ items, title }: { items: { q: string; a: string }[]; title?: string }) {
  const { t } = useLocale();
  const resolve = (value: string) => (value in enDict ? t(value as TranslationKey) : value);
  const resolvedTitle = title ?? t('selling.svc.ui.faqTitle');
  return (
    <section id="faq" className="scroll-mt-24 border-t border-retail-border py-8 lg:py-9">
      <SellerContainer>
        <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowFaq')} title={resolvedTitle} align="center" />
        <div className="mx-auto mt-4 max-w-3xl">
          <Accordion type="single" collapsible className="grid gap-1">
            {items.map((faq, index) => (
              <AccordionItem
                key={resolve(faq.q)}
                value={`faq-${index}`}
                className="overflow-hidden border-b border-retail-border bg-white px-2"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-bold text-retail-dark-green hover:no-underline sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-6 text-retail-muted">{resolve(faq.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SellerContainer>
    </section>
  );
}

/* ── Related services ──────────────────────────────────────────── */
interface RelatedCard {
  path: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

export function RelatedServices({ slugs, currentSlug }: { slugs: string[]; currentSlug?: string }) {
  const { t } = useLocale();
  const cards = slugs
    .filter((slug) => slug !== currentSlug)
    .map<RelatedCard | null>((slug) => {
      if (slug === 'integrations') {
        const extra = sellerExtraPages.integrations;
        return { path: extra.path, icon: extra.icon, title: extra.navLabel, text: extra.blurb };
      }
      if (slug === 'how-it-works') {
        const extra = sellerExtraPages.howItWorks;
        return { path: extra.path, icon: extra.icon, title: extra.navLabel, text: extra.blurb };
      }
      const page = servicePageBySlug[slug];
      return page ? { path: page.path, icon: page.icon, title: page.navLabel, text: page.hero.lead } : null;
    })
    .filter((card): card is RelatedCard => card !== null);

  if (cards.length === 0) return null;

  return (
    <section className="border-t border-retail-border bg-retail-page py-8">
      <SellerContainer>
        <SellerSectionHeading eyebrow={t('selling.svc.ui.eyebrowKeepExploring')} title={t('selling.svc.ui.relatedServices')} />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ path, icon: Icon, title, text }) => (
            <li key={path}>
              <Link
                to={path}
                className="group flex h-full flex-col rounded-md border border-retail-border bg-white p-4 transition-colors hover:border-retail-green/40 hover:bg-retail-light-green/50"
              >
                {Icon ? (
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                ) : null}
                <h3 className="mt-3 text-sm font-bold text-retail-dark-green">{title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-retail-muted">{text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-retail-green">
                  {t('selling.svc.ui.learnMore')}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SellerContainer>
    </section>
  );
}
