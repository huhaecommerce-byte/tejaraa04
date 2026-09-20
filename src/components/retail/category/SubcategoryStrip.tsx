import { ArrowRight, Grid2X2 } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { categoryPath } from '@/lib/seo/slug';
import { categoryImageFor, formatCategoryCount, type RetailCategoryGroup } from './categoryTypes';
import { RetailSectionHeader } from '@/components/retail/common';
import { useLocale } from '@/i18n/LocaleProvider';

export function SubcategoryStrip({ category }: { category: RetailCategoryGroup }) {
  const { t } = useLocale();
  if (!category.subs.length) return null;
  return (
    <section className="rounded-lg border border-retail-border bg-retail-card p-3 sm:p-4">
      <RetailSectionHeader title={t('shopx.category.exploreDepartment', { name: category.name })} actionLabel={t('shopx.category.viewAllShort')} actionHref={categoryPath(category.name)} />
      <div className="no-scrollbar mt-3 flex snap-x gap-2 overflow-x-auto pb-1 sm:gap-3">
        {category.subs.slice(0, 10).map((subcategory) => (
          <Link key={subcategory.name} to={categoryPath(category.name, subcategory.name)} className="group grid w-[132px] shrink-0 snap-start grid-rows-[84px_auto] overflow-hidden rounded-md border border-retail-border bg-retail-page sm:w-[156px]">
            <span className="relative overflow-hidden bg-retail-light-green"><img src={categoryImageFor(subcategory.name)} alt="" loading="lazy" width={312} height={168} className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-retail-dark-green/20 to-transparent" /></span>
            <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1 p-2"><span className="min-w-0"><span className="line-clamp-2 block text-xs font-bold leading-tight text-retail-text group-hover:text-retail-green">{subcategory.name}</span>{subcategory.cnt > 0 && <span className="mt-0.5 block text-[10px] text-retail-muted">{formatCategoryCount(subcategory.cnt)}</span>}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-retail-green" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
