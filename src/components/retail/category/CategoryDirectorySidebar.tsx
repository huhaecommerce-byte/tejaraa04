import { Grid2X2 } from 'lucide-react';
import { slugify } from '@/lib/seo/slug';
import type { RetailCategoryGroup } from './categoryTypes';
import { useLocale } from '@/i18n/LocaleProvider';

export function CategoryDirectorySidebar({ categories }: { categories: RetailCategoryGroup[] }) {
  const { t } = useLocale();
  return (
    <aside className="hidden lg:block">
      <nav aria-label="Category directory" className="sticky top-32 overflow-hidden rounded-lg border border-retail-border bg-retail-card">
        <div className="flex items-center gap-2 border-b border-retail-border bg-retail-light-green px-4 py-3 text-sm font-bold text-retail-dark-green"><Grid2X2 className="h-4 w-4" />{t('shopx.category.browseCategoriesNav')}</div>
        <div className="max-h-[calc(100vh-190px)] overflow-y-auto p-2">
          {categories.map((category) => <a key={category.name} href={`#category-${slugify(category.name)}`} className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-3 py-2 text-sm text-retail-text hover:bg-retail-light-green hover:text-retail-green"><span className="truncate">{category.name}</span>{category.cnt > 0 && <span className="shrink-0 text-[10px] text-retail-muted">{category.cnt.toLocaleString()}</span>}</a>)}
        </div>
      </nav>
    </aside>
  );
}
