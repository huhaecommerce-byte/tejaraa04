import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { SupplierSectionLink } from '@/components/supplier/common/SupplierSectionLink';
import { supplierChannels } from '@/data/supplierPartners';
import { useLocale } from '@/i18n/LocaleProvider';

export function SupplierChannels() {
  const { t } = useLocale();
  return (
    <section id="channels" className="scroll-mt-28 border-y border-retail-border bg-white py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          eyebrow={t('supplier.channels.eyebrow')}
          title={t('supplier.channels.title')}
          description={t('supplier.channels.description')}
        />
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {supplierChannels.map((channel) => (
            <article key={channel.title} className="flex h-full flex-col rounded-xl border border-retail-border bg-retail-page/70 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-retail-light-green text-retail-green">
                <channel.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-retail-dark-green">{channel.title}</h3>
              <p className="mt-2 text-sm leading-6 text-retail-muted">{channel.text}</p>
            </article>
          ))}
        </div>
        <SupplierSectionLink align="left" to="/partners/markets" label={t('supplier.channels.sectionLink')} />
      </SupplierContainer>
    </section>
  );
}
