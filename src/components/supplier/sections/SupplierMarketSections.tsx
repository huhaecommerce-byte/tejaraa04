import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { marketChannels, marketRegions, marketNote } from '@/data/supplierPages';
import { useLocale } from '@/i18n/LocaleProvider';

/** Where approved supplier products may be offered, and which regions are supported. */
export function SupplierMarketSections() {
  const { t } = useLocale();
  return (
    <>
      <section className="bg-retail-page py-11 lg:py-14">
        <SupplierContainer>
          <SupplierSectionHeading
            eyebrow={t('supplier.marketSections.channelsEyebrow')}
            title={t('supplier.marketSections.channelsTitle')}
            description={t('supplier.marketSections.channelsDescription')}
          />
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {marketChannels.map((channel) => (
              <article key={channel.title} className="rounded-2xl border border-retail-border bg-white p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-retail-light-green text-retail-dark-green">
                  <channel.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-base font-bold text-retail-dark-green">{t(channel.title)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-retail-muted">{t(channel.text)}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-retail-border bg-white p-5 text-sm leading-6 text-retail-muted">
            {t(marketNote)}
          </p>
        </SupplierContainer>
      </section>

      <section className="border-y border-retail-border bg-white py-11 lg:py-14">
        <SupplierContainer>
          <SupplierSectionHeading
            eyebrow={t('supplier.marketSections.regionsEyebrow')}
            title={t('supplier.marketSections.regionsTitle')}
            description={t('supplier.marketSections.regionsDescription')}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {marketRegions.map((region) => (
              <div key={region.name} className="rounded-xl border border-retail-border bg-retail-page p-5">
                <h3 className="text-base font-bold text-retail-dark-green">{t(region.name)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-retail-muted">{t(region.text)}</p>
              </div>
            ))}
          </div>
        </SupplierContainer>
      </section>
    </>
  );
}
