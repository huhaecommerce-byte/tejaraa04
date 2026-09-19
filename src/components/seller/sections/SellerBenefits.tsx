import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { sellerBenefits } from '@/data/sellerServices';
import { useLocale } from '@/i18n/LocaleProvider';

export function SellerBenefits() {
  const { t } = useLocale();
  return (
    <section id="why-tejaraa" className="scroll-mt-28 py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          eyebrow={t('selling.benefits.eyebrow')}
          title={t('selling.benefits.title')}
          description={t('selling.benefits.desc')}
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellerBenefits.map((benefit) => (
            <div key={benefit.id} className="flex h-full gap-4 rounded-xl border border-retail-border bg-white p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <benefit.icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-retail-dark-green">{t(benefit.titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-retail-muted">{t(benefit.textKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}
