import { slugify } from '@/lib/seo/slug';
import type { RetailCategoryGroup } from './categoryTypes';
import { useLocale } from '@/i18n/LocaleProvider';

export function MobileCategoryNavigation({ categories }: { categories: RetailCategoryGroup[] }) {
  const { t } = useLocale();
  return <nav aria-label={t('shopx.category.quickCategoriesAria')} className="no-scrollbar flex snap-x gap-2 overflow-x-auto lg:hidden">{categories.map((category) => <a key={category.name} href={`#category-${slugify(category.name)}`} className="min-h-10 shrink-0 snap-start rounded-md border border-retail-border bg-retail-card px-3 py-2 text-xs font-bold text-retail-text hover:border-retail-green hover:text-retail-green">{category.name}</a>)}</nav>;
}
