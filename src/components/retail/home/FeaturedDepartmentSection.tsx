import { ArrowRight } from 'lucide-react';
import { translateCategory } from '@/i18n/categoryNames';
import { Link } from '@/lib/router-compat';
import { ShopProductCard } from '@/components/storefront/ShopProductCard';
import type { HomepageProduct, HomepageRating } from './homeTypes';

const departmentImages: Record<string, string> = {
  electronics: '/marketplace/electronics.jpg', mobile: '/marketplace/mobile.jpg', home: '/marketplace/home.jpg', beauty: '/marketplace/beauty.jpg', fashion: '/marketplace/fashion.jpg', sports: '/marketplace/sports.jpg', automotive: '/marketplace/automotive.jpg', food: '/marketplace/food.jpg',
};

function imageFor(name: string) {
  const key = Object.keys(departmentImages).find((candidate) => name.toLowerCase().includes(candidate));
  return key ? departmentImages[key] : '/marketplace/more.jpg';
}

const labels = {
  en: { eyebrow: 'Featured department', action: 'Shop department' },
  ar: { eyebrow: 'قسم مميز', action: 'تسوق القسم' },
};

export function FeaturedDepartmentSection({ name, products, ratings, locale = 'en' }: { name: string; products: HomepageProduct[]; ratings: Record<string, HomepageRating>; locale?: 'en' | 'ar' }) {
  if (!products.length) return null;
  const t = labels[locale];
  const href = `/catalog?q=${encodeURIComponent(name)}`;
  return (
    <section className="grid overflow-hidden rounded-lg border border-retail-border bg-retail-card lg:grid-cols-[260px_minmax(0,1fr)]">
      <Link to={href} className="group relative min-h-[180px] overflow-hidden lg:min-h-full">
        <img src={imageFor(name)} alt="" loading="lazy" width={600} height={700} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-retail-dark-green via-retail-dark-green/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-primary-foreground"><p className="text-[10px] font-bold uppercase text-retail-gold">{t.eyebrow}</p><h2 className="mt-1 font-display text-2xl font-bold">{translateCategory(name, locale)}</h2><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">{t.action} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></span></div>
      </Link>
      <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto p-3 sm:gap-3 sm:p-4">
        {products.slice(0, 6).map((product) => <div key={product.id} className="w-[168px] shrink-0 snap-start sm:w-[190px] xl:w-[210px]"><ShopProductCard product={product} rating={ratings[product.id]?.avg_rating} reviewCount={ratings[product.id]?.review_count} compact /></div>)}
      </div>
    </section>
  );
}