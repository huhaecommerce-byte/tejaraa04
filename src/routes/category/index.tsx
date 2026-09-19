import { createFileRoute } from '@tanstack/react-router';
import { FolderSearch, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailBreadcrumbs, RetailContainer, RetailEmptyState, RetailErrorState, RetailTrustBar } from '@/components/retail/common';
import { CategoryDirectorySidebar, CategoryGrid, CategoryHero, CategoryPageSkeleton, MobileCategoryNavigation, SubcategoryStrip } from '@/components/retail/category';
import type { RetailCategoryGroup } from '@/components/retail/category';
import { getCategoryTree } from '@/lib/catalogSeo.functions';

const title = 'All Categories — Shop Departments on Tejaraa Saudi Arabia';
const description = 'Browse every shopping department on Tejaraa, explore real product categories, and find products available across Saudi Arabia.';

const trustItems = [
  { icon: Truck, title: 'Delivery across KSA', description: 'Local and imported products' },
  { icon: ShieldCheck, title: 'Secure checkout', description: 'Protected payment experience' },
  { icon: RotateCcw, title: 'Returns support', description: 'Clear support process' },
  { icon: Headphones, title: 'Customer support', description: 'Arabic and English assistance' },
];

export const Route = createFileRoute('/category/')({
  loader: async () => {
    const tree = await getCategoryTree();
    const tops = new Map<string, { cnt: number; subs: Map<string, number> }>();
    for (const node of tree) {
      const top = tops.get(node.top) ?? { cnt: 0, subs: new Map<string, number>() };
      top.cnt += node.cnt;
      if (node.sub) top.subs.set(node.sub, (top.subs.get(node.sub) ?? 0) + node.cnt);
      tops.set(node.top, top);
    }
    return [...tops.entries()].map(([name, value]) => ({ name, cnt: value.cnt, subs: [...value.subs.entries()].map(([subName, cnt]) => ({ name: subName, cnt })).sort((a, b) => b.cnt - a.cnt) })).filter((category) => category.cnt > 0 || category.subs.length > 0).sort((a, b) => b.cnt - a.cnt);
  },
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: 'https://tejaraa.com/category' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'canonical', href: 'https://tejaraa.com/category' },
      { rel: 'alternate', hrefLang: 'en-sa', href: 'https://tejaraa.com/category' },
      { rel: 'alternate', hrefLang: 'ar-sa', href: 'https://tejaraa.com/ar/category' },
      { rel: 'alternate', hrefLang: 'x-default', href: 'https://tejaraa.com/category' },
    ],
  }),
  pendingComponent: CategoryPending,
  errorComponent: CategoryError,
  component: CategoryIndex,
});

function CategoryIndex() {
  const categories = Route.useLoaderData() as RetailCategoryGroup[];
  const total = categories.reduce((sum, category) => sum + category.cnt, 0);
  return (
    <RetailPublicShell>
      <main><RetailContainer className="space-y-4 py-3 sm:space-y-5 sm:py-4">
        <RetailBreadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'All Categories' }]} />
        <CategoryHero categoryCount={categories.length} productCount={total} />
        {categories.length ? <>
          <MobileCategoryNavigation categories={categories} />
          <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <CategoryDirectorySidebar categories={categories} />
            <CategoryGrid categories={categories} />
          </div>
          <div className="space-y-4">{categories.filter((category) => category.subs.length).slice(0, 4).map((category) => <SubcategoryStrip key={category.name} category={category} />)}</div>
        </> : <section className="rounded-lg border border-retail-border bg-retail-card"><RetailEmptyState icon={FolderSearch} title="Categories are being prepared" description="Browse the full catalogue while new shopping departments are added." actionLabel="Browse catalogue" actionHref="/catalog" /></section>}
        <RetailTrustBar items={trustItems} />
      </RetailContainer></main>
    </RetailPublicShell>
  );
}

function CategoryPending() {
  return <RetailPublicShell><main><RetailContainer className="py-4"><CategoryPageSkeleton /></RetailContainer></main></RetailPublicShell>;
}

function CategoryError() {
  return <RetailPublicShell><main><RetailContainer className="py-4"><section className="rounded-lg border border-retail-border bg-retail-card"><RetailErrorState title="We couldn't load categories" description="Please try again to continue browsing." onRetry={() => window.location.reload()} /></section></RetailContainer></main></RetailPublicShell>;
}