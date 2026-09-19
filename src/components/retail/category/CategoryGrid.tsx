import { CategoryCard } from './CategoryCard';
import type { RetailCategoryGroup } from './categoryTypes';

export function CategoryGrid({ categories }: { categories: RetailCategoryGroup[] }) {
  return <section aria-label="All departments" className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">{categories.map((category, index) => <CategoryCard key={category.name} category={category} priority={index < 4} />)}</section>;
}