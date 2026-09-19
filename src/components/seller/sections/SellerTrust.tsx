import { ClipboardCheck, Languages, MapPin, SlidersHorizontal } from 'lucide-react';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

/** Factual strengths only — no seller counts, order volumes or success rates. */
const trustItems: { icon: typeof MapPin; titleKey: TranslationKey; textKey: TranslationKey }[] = [
  { icon: MapPin, titleKey: 'selling.trust.1.title', textKey: 'selling.trust.1.text' },
  { icon: ClipboardCheck, titleKey: 'selling.trust.2.title', textKey: 'selling.trust.2.text' },
  { icon: SlidersHorizontal, titleKey: 'selling.trust.3.title', textKey: 'selling.trust.3.text' },
  { icon: Languages, titleKey: 'selling.trust.4.title', textKey: 'selling.trust.4.text' },
];

export function SellerTrust() {
  const { t } = useLocale();
  return (
    <section className="bg-retail-dark-green py-11 lg:py-14">
      <SellerContainer>
        <SellerSectionHeading
          onDark
          eyebrow={t('selling.trust.eyebrow')}
          title={t('selling.trust.title')}
          description={t('selling.trust.desc')}
          align="center"
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.titleKey} className="flex h-full flex-col rounded-xl border border-white/12 bg-white/[0.06] p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-retail-gold">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{t(item.titleKey)}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{t(item.textKey)}</p>
            </div>
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}
