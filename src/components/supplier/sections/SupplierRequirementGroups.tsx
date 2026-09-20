import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { SupplierSectionHeading } from '@/components/supplier/common/SupplierSectionHeading';
import { requirementGroups } from '@/data/supplierPages';
import { useLocale } from '@/i18n/LocaleProvider';

/** Business / documentation / product / catalogue / commercial / operational requirements. */
export function SupplierRequirementGroups() {
  const { t } = useLocale();
  return (
    <section className="bg-retail-page py-11 lg:py-14">
      <SupplierContainer>
        <SupplierSectionHeading
          eyebrow={t('supplier.requirementGroupsSection.eyebrow')}
          title={t('supplier.requirementGroupsSection.title')}
          description={t('supplier.requirementGroupsSection.description')}
        />

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {requirementGroups.map((group) => (
            <article key={group.title} className="rounded-2xl border border-retail-border bg-white p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-retail-light-green text-retail-dark-green">
                  <group.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-retail-dark-green">{t(group.title)}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-retail-muted">{t(group.intro)}</p>
                  <ul className="mt-3 space-y-1.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm leading-6 text-retail-text">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-retail-green" />
                        {t(item)}
                      </li>
                    ))}
                  </ul>
                  {group.note ? (
                    <p className="mt-3 rounded-lg bg-retail-page p-3 text-xs leading-5 text-retail-muted">{t(group.note)}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </SupplierContainer>
    </section>
  );
}
