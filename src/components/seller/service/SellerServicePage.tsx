import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { SellerBreadcrumbs } from './SellerBreadcrumbs';
import { ServiceHero } from './ServiceHero';
import { RelatedServices, ServiceFAQ } from './ServiceBlocks';
import { ServiceInquiryCTA } from './ServiceInquiryCTA';
import type { ServicePageConfig } from '@/data/sellerServicePages';
import { Check, Info } from 'lucide-react';

/** One shared page system for every public Seller Service page. */
export function SellerServicePage({ config }: { config: ServicePageConfig }) {
  return (
    <SellerPublicShell>
      <SellerBreadcrumbs items={[{ label: config.navLabel }]} />
      <ServiceHero
        icon={config.icon}
        title={config.hero.title}
        lead={config.hero.lead}
        tags={config.hero.tags}
        flow={config.process.steps.map((step) => step.title)}
        flowCaption={config.process.note}
        secondaryLabel={config.cta.secondaryLabel}
      />
      <section className="py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SellerSectionHeading eyebrow="Overview" title={config.overview.title} />
            <div className="mt-4 grid gap-3">
              {config.overview.paragraphs.map((text) => <p key={text} className="text-sm leading-6 text-retail-muted">{text}</p>)}
            </div>
          </div>
          <div>
            <SellerSectionHeading eyebrow="Best for" title={config.audience.title} />
            <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {config.audience.items.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3 border-t border-retail-border pt-3">
                  {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" aria-hidden /> : null}
                  <span><strong className="block text-sm text-retail-dark-green">{title}</strong><span className="mt-1 block text-sm leading-5 text-retail-muted">{text}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading eyebrow="Process" title={config.process.title} description={config.process.note} />
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {config.process.steps.map((step, index) => (
              <li key={step.title} className="border-l-2 border-retail-green pl-3">
                <span className="text-xs font-extrabold text-retail-medium-green">0{index + 1}</span>
                <h3 className="mt-1 text-sm font-bold text-retail-dark-green">{step.title}</h3>
                <p className="mt-1 text-xs leading-5 text-retail-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          {config.split ? (
            <div className="mt-7 grid gap-5 border-t border-retail-border pt-6 md:grid-cols-2">
              {[['Tejaraa handles', config.split.tejaraa], ['You handle', config.split.you]].map(([heading, items]) => (
                <div key={heading as string}>
                  <h3 className="text-sm font-extrabold text-retail-dark-green">{heading as string}</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(items as string[]).map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-retail-text"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-retail-green" />{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </SellerContainer>
      </section>

      <section className="py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SellerSectionHeading eyebrow="Value" title={config.benefits.title} />
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {config.benefits.items.map(({ icon: Icon, title, text }) => (
                <li key={title} className="border-t-2 border-retail-gold pt-3">
                  <div className="flex items-center gap-2">{Icon ? <Icon className="h-4 w-4 text-retail-green" /> : null}<h3 className="text-sm font-bold text-retail-dark-green">{title}</h3></div>
                  <p className="mt-1.5 text-xs leading-5 text-retail-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
          {config.requirements ? (
            <div className="border-l border-retail-border lg:pl-7">
              <SellerSectionHeading eyebrow="Getting ready" title={config.requirements.title} description={config.requirements.intro} />
              <ul className="mt-4 grid gap-2">
                {config.requirements.items.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-retail-text"><Check className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" />{item}</li>)}
              </ul>
              {config.requirements.note ? <p className="mt-4 flex gap-2 text-xs leading-5 text-retail-muted"><Info className="h-4 w-4 shrink-0" />{config.requirements.note}</p> : null}
            </div>
          ) : null}
        </SellerContainer>
      </section>
      <ServiceFAQ items={config.faqs} />
      <ServiceInquiryCTA
        title={config.cta.title}
        text={config.cta.text}
        primaryLabel={config.cta.primaryLabel}
        defaultService={config.navLabel}
      />
      <RelatedServices slugs={config.related} currentSlug={config.slug} />
    </SellerPublicShell>
  );
}
