import { useEffect, useMemo, useState } from 'react';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common';
import { CategoryRail, FeaturedDepartmentSection, ProductRail, PromotionGrid, RetailHero } from '@/components/retail/home';
import type { HomepageCategory, HomepageProduct, HomepageRating, HomepageViewCount } from '@/components/retail/home';
import { supabase } from '@/integrations/supabase/client';
import { JsonLd } from '@/components/JsonLd';

const LIST_COLUMNS = 'id,sku,name,slug,top_category,sub_category,source,images,price_sar,price_usd,cost_usd,moq,weight_kg,stock_qty,track_inventory,is_featured,created_at';
const fallbackCategories = ['Mobiles & tablets', 'Electronics', 'Home & kitchen', 'Fashion', 'Beauty & care', 'Health', 'Sports', 'Automotive', 'Daily needs'];

const HOME_COPY = {
  en: {
    featured: { t: 'Featured Products', d: 'Hand-picked products from across the marketplace' },
    best: { t: 'Best Sellers', d: 'Popular choices based on genuine customer reviews' },
    fresh: { t: 'New Arrivals', d: 'The latest products added to Tejaraa' },
    popular: { t: 'Popular Products', d: 'Products shoppers are viewing now' },
    local: { t: 'Ready in Saudi Arabia', d: 'Products available from local stock' },
  },
  ar: {
    featured: { t: 'منتجات مميزة', d: 'منتجات مختارة من مختلف أقسام المتجر' },
    best: { t: 'الأكثر مبيعاً', d: 'اختيارات شائعة بناءً على تقييمات حقيقية' },
    fresh: { t: 'وصل حديثاً', d: 'أحدث المنتجات المضافة إلى تجارة' },
    popular: { t: 'منتجات رائجة', d: 'منتجات يشاهدها المتسوقون الآن' },
    local: { t: 'متوفر في السعودية', d: 'منتجات جاهزة من المخزون المحلي' },
  },
};

export default function Index({ locale: localeProp }: { locale?: 'en' | 'ar' } = {}) {
  // Arabic can come from the /ar URL (prop) or from the language toggle (context).
  const { locale: activeLocale } = useLocale();
  const locale = localeProp ?? activeLocale;
  const L = HOME_COPY[locale];
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<HomepageCategory[]>([]);
  const [products, setProducts] = useState<HomepageProduct[]>([]);
  const [ratings, setRatings] = useState<Record<string, HomepageRating>>({});
  const [views, setViews] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [categoryResult, productResult, ratingResult, viewResult, sunskyResult] = await Promise.all([
        supabase.from('product_category_counts_cache').select('top_category, cnt').limit(1000),
        supabase.from('products').select(LIST_COLUMNS).order('created_at', { ascending: false }).limit(72),
        supabase.from('product_rating_stats').select('product_id, avg_rating, review_count').limit(750),
        supabase.from('product_view_counts').select('product_id, total_views').order('total_views', { ascending: false }).limit(250),
        supabase.from('sunsky_categories').select('category_id, name, name_ar, path').is('parent_id', null).order('name', { ascending: true }).limit(50),
      ]);
      if (!active) return;

      const totals = new Map<string, number>();
      (categoryResult.data ?? []).forEach((row) => { if (row.top_category) totals.set(row.top_category, (totals.get(row.top_category) ?? 0) + (Number(row.cnt) || 0)); });
      setCategories([...totals.entries()].map(([top_category, cnt]) => ({ top_category, cnt })).sort((a, b) => b.cnt - a.cnt).slice(0, 14));
      // The 20 main marketplace categories (sunsky level-1 tree) always show on the rail
      const l1Categories: HomepageCategory[] = (sunskyResult.data ?? [])
        .map((row) => ({ top_category: row.name, cnt: totals.get(row.name) ?? 0 }));
      setMainCategories(l1Categories);
      setProducts(((productResult.data ?? []) as unknown as HomepageProduct[]).filter((product) => product.images?.length));

      const ratingMap: Record<string, HomepageRating> = {};
      ((ratingResult.data ?? []) as HomepageRating[]).forEach((row) => { if (row.product_id) ratingMap[row.product_id] = row; });
      setRatings(ratingMap);
      const viewMap: Record<string, number> = {};
      ((viewResult.data ?? []) as HomepageViewCount[]).forEach((row) => { if (row.product_id && Number(row.total_views) > 0) viewMap[row.product_id] = Number(row.total_views); });
      setViews(viewMap);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const displayCategories = mainCategories.length ? mainCategories : (categories.length ? categories : fallbackCategories.map((top_category) => ({ top_category, cnt: 0 })));
  const featuredProducts = useMemo(() => products.filter((product) => product.is_featured).slice(0, 12), [products]);
  const bestProducts = useMemo(() => products.filter((product) => (ratings[product.id]?.review_count ?? 0) > 0).sort((a, b) => (ratings[b.id]?.review_count ?? 0) - (ratings[a.id]?.review_count ?? 0)).slice(0, 12), [products, ratings]);
  const newProducts = useMemo(() => products.slice(0, 12), [products]);
  const popularProducts = useMemo(() => products.filter((product) => views[product.id] > 0).sort((a, b) => views[b.id] - views[a.id]).slice(0, 12), [products, views]);
  const localProducts = useMemo(() => products.filter((product) => product.source === 'local').slice(0, 12), [products]);
  const departments = useMemo(() => displayCategories.map((category) => ({ name: category.top_category, products: products.filter((product) => product.top_category === category.top_category).slice(0, 6) })).filter((department) => department.products.length >= 2).slice(0, 3), [displayCategories, products]);

  return (
    <RetailPublicShell dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'OnlineStore', name: 'Tejaraa', url: 'https://tejaraa.com', description: 'Shop products online with trusted delivery across Saudi Arabia.' }} />
      <main>
        <RetailContainer className="space-y-4 py-3 sm:space-y-5 sm:py-4">
          <RetailHero locale={locale} />
          <CategoryRail categories={displayCategories} locale={locale} />
          <PromotionGrid locale={locale} />
          <ProductRail title={L.featured.t} description={L.featured.d} products={featuredProducts} ratings={ratings} loading={loading} />
          <ProductRail title={L.best.t} description={L.best.d} products={bestProducts} ratings={ratings} loading={loading} badge="best-seller" />
          <ProductRail title={L.fresh.t} description={L.fresh.d} products={newProducts} ratings={ratings} loading={loading} viewAllHref="/catalog" badge="new" tone="soft" />
          <ProductRail title={L.popular.t} description={L.popular.d} products={popularProducts} ratings={ratings} loading={false} />
          <ProductRail title={L.local.t} description={L.local.d} products={localProducts} ratings={ratings} loading={loading} viewAllHref="/catalog?source=local" />
          {departments.map((department) => <FeaturedDepartmentSection key={department.name} name={department.name} products={department.products} ratings={ratings} locale={locale} />)}
        </RetailContainer>
      </main>
    </RetailPublicShell>
  );
}