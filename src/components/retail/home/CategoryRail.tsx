import { Link } from '@/lib/router-compat';
import { RetailSectionHeader } from '@/components/retail/common';
import type { HomepageCategory } from './homeTypes';

const fallbackImages = ['/marketplace/mobile.jpg', '/marketplace/electronics.jpg', '/marketplace/home.jpg', '/marketplace/beauty.jpg', '/marketplace/fashion.jpg', '/marketplace/sports.jpg', '/marketplace/automotive.jpg', '/marketplace/food.jpg', '/marketplace/more.jpg'];

// Themed emerald/gold tiles for the 20 main marketplace categories (keyed by lowercase name)
const themedCategoryImages: Record<string, string> = {
  'mobile parts': '/marketplace/categories/mobile-parts.png',
  'computer & networking': '/marketplace/categories/computer-networking.png',
  'consumer electronics': '/marketplace/categories/consumer-electronics.png',
  'game accessories': '/marketplace/categories/game-accessories.png',
  'security': '/marketplace/categories/security.png',
  'home & garden': '/marketplace/categories/home-garden.png',
  'smart phones': '/marketplace/categories/smart-phones.png',
  'in car': '/marketplace/categories/in-car.png',
  'outdoor & sports': '/marketplace/categories/outdoor-sports.png',
  'camera accessories': '/marketplace/categories/camera-accessories.png',
  'mobile accessories': '/marketplace/categories/mobile-accessories.png',
  'apple accessories': '/marketplace/categories/apple-accessories.png',
  'dji & insta360 accessories': '/marketplace/categories/dji-insta360-accessories.png',
  'samsung accessories': '/marketplace/categories/samsung-accessories.png',
  'office & school supplies': '/marketplace/categories/office-school-supplies.png',
  'jewelry & apparel': '/marketplace/categories/jewelry-apparel.png',
  'smart wear': '/marketplace/categories/smart-wear.png',
  'print your demand(pod)': '/marketplace/categories/print-on-demand.png',
  'apple parts': '/marketplace/categories/apple-parts.png',
  'samsung parts': '/marketplace/categories/samsung-parts.png',
  // common storefront aliases
  'mobiles & tablets': '/marketplace/categories/smart-phones.png',
  'electronics': '/marketplace/categories/consumer-electronics.png',
  'home & kitchen': '/marketplace/categories/home-garden.png',
  'fashion': '/marketplace/categories/jewelry-apparel.png',
  'sports': '/marketplace/categories/outdoor-sports.png',
  'automotive': '/marketplace/categories/in-car.png',
};

function categoryImage(name: string, index: number) {
  return themedCategoryImages[name.trim().toLowerCase()] ?? fallbackImages[index % fallbackImages.length];
}

const copy = {
  en: { title: 'Shop by Category', action: 'View all categories', products: 'products' },
  ar: { title: 'تسوق حسب الفئة', action: 'عرض كل الفئات', products: 'منتج' },
};

export function CategoryRail({ categories, locale = 'en' }: { categories: HomepageCategory[]; locale?: 'en' | 'ar' }) {
  const t = copy[locale];
  const prefix = locale === 'ar' ? '/ar' : '';
  return (
    <section className="rounded-lg border border-retail-border bg-retail-card p-3 sm:p-4">
      <RetailSectionHeader title={t.title} actionLabel={t.action} actionHref={`${prefix}/category`} />
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-10">
        {categories.slice(0, 20).map((category, index) => (
          <Link key={category.top_category} to={`/catalog?q=${encodeURIComponent(category.top_category)}`} className="group text-center">
            <span className="block aspect-square overflow-hidden rounded-md bg-retail-light-green"><img src={categoryImage(category.top_category, index)} alt="" loading="lazy" width={232} height={232} className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /></span>
            <span className="mt-2 line-clamp-2 block text-xs font-bold leading-tight text-retail-text group-hover:text-retail-green">{category.top_category}</span>
            {category.cnt > 0 && <span className="mt-0.5 block text-[10px] text-retail-muted">{category.cnt.toLocaleString()} {t.products}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
