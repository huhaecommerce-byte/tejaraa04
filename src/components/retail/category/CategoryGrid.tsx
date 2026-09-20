import { CategoryCard } from './CategoryCard';
import type { RetailCategoryGroup } from './categoryTypes';
import { useLocale } from '@/i18n/LocaleProvider';

export function CategoryGrid({ categories }: { categories: RetailCategoryGroup[] }) {
  const { t } = useLocale();
  return <section aria-label={t('shopx.category.allDepartmentsAria')} className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">{categories.map((category, index) => <CategoryCard key={category.name} category={category} priority={index < 4} />)}</section>;
}
