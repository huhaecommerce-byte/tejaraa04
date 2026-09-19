import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerProcess } from '@/data/sellerServices';
import { useLocale } from '@/i18n/LocaleProvider';

export function SellerProcess() {
  const { t } = useLocale();
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-retail-dark-green py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          onDark
          eyebrow={t('selling.process.eyebrow')}
          title={t('selling.process.title')}
          description={t('selling.process.desc')}
          align="center"
        />

        {/* Desktop: horizontal flow. Mobile: vertical timeline. */}
        <ol className="mt-7 grid gap-4 lg:grid-cols-5">
          {sellerProcess.map((step, index) => (
            <li
              key={step.id}
              className="relative flex gap-4 rounded-xl border border-white/12 bg-white/[0.06] p-5 lg:flex-col lg:gap-3"
            >
              <div className="flex flex-col items-center lg:flex-row lg:gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-gold text-retail-dark-green">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span aria-hidden className="mt-2 w-px flex-1 bg-white/15 lg:mt-0 lg:hidden" />
                <span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-white/50 lg:inline">
                  {t('selling.process.step')} {index + 1}
                </span>
              </div>
              <div className="min-w-0 pb-1">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/50 lg:hidden">{t('selling.process.step')} {index + 1}</span>
                <h3 className="mt-1 text-base font-bold text-white lg:mt-0">{t(step.titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/70">{t(step.textKey)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link
            to="/selling/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-retail-gold hover:underline"
          >
            {t('selling.process.seeJourney')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </SellerContainer>
    </section>
  );
}
