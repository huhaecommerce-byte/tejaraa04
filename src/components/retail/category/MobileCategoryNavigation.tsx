import { slugify } from '@/lib/seo/slug';
import type { RetailCategoryGroup } from './categoryTypes';

export function MobileCategoryNavigation({ categories }: { categories: RetailCategoryGroup[] }) {
  return <nav aria-label="Quick categories" className="no-scrollbar flex snap-x gap-2 overflow-x-auto lg:hidden">{categories.map((category) => <a key={category.name} href={`#category-${slugify(category.name)}`} className="min-h-10 shrink-0 snap-start rounded-md border border-retail-border bg-retail-card px-3 py-2 text-xs font-bold text-retail-text hover:border-retail-green hover:text-retail-green">{category.name}</a>)}</nav>;
}