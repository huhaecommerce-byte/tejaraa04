import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common';
import { CategoryBanner, ListingToolbar, RetailListingHeader, RetailPagination, RetailProductGrid, SubcategoryChips } from '@/components/retail/listing';
import type { CategoryPageData } from '@/lib/catalogSeo.functions';
import { categoryPath, productPath, slugify } from '@/lib/seo/slug';

type Props = { data: CategoryPageData; locale?: 'en' | 'ar'; page?: number; onPageChange?: (page: number) => void };
const PAGE_SIZE = 24;

const labels = {
  en: { home:'Home', categories:'All Categories', products:'products', empty:'No products available in this category yet.', emptyDescription:'Explore another department while new products are added.', browse:'Browse All Categories', related:'Browse related categories' },
  ar: { home:'الرئيسية', categories:'كل الفئات', products:'منتج', empty:'لا توجد منتجات في هذه الفئة حالياً.', emptyDescription:'تصفح فئة أخرى حتى تتم إضافة منتجات جديدة.', browse:'تصفح جميع الفئات', related:'تصفح الفئات ذات الصلة' },
};

export function categoryHeading(data: CategoryPageData) { return data.detail || data.sub || data.top; }
export function categoryIntro(data: CategoryPageData, locale: 'en'|'ar'='en') {
  const name=categoryHeading(data);
  return locale === 'ar' ? `تسوق منتجات ${name} واكتشف الخيارات المتاحة عبر تجارة.` : `Shop ${name.toLowerCase()}, everyday essentials and more on Tejaraa.`;
}

export default function CategoryPage({ data, locale='en', page=1, onPageChange }:Props) {
  const L=labels[locale]; const prefix=locale==='ar'?'/ar':''; const heading=categoryHeading(data);
  const crumbs=[{label:L.home,to:prefix||'/'},{label:L.categories,to:`${prefix}/category`},{label:data.top,to:`${prefix}${categoryPath(data.top)}`},...(data.sub?[{label:data.sub,to:`${prefix}${categoryPath(data.top,data.sub)}`}]:[]),...(data.detail?[{label:data.detail}]:[])];
  const childItems=data.children.map((child)=>({label:child.name,count:child.cnt,href:`${prefix}${data.sub?categoryPath(data.top,data.sub,child.name):categoryPath(data.top,child.name)}`}));
  const totalPages=Math.max(1,Math.ceil(data.total/PAGE_SIZE));
  return <RetailPublicShell dir={locale==='ar'?'rtl':'ltr'}><main><RetailContainer className="space-y-4 py-3 sm:py-4"><RetailListingHeader breadcrumbs={crumbs} title={heading} description={categoryIntro(data,locale)} countLabel={`${data.total.toLocaleString()} ${L.products}`} />{!data.sub&&!data.detail&&<CategoryBanner name={data.top} description={categoryIntro(data,locale)} />}<SubcategoryChips title={L.related} items={childItems} /><ListingToolbar resultLabel={`${data.total.toLocaleString()} ${L.products}`} /><RetailProductGrid products={data.products as never} loading={false} emptyTitle={L.empty} emptyDescription={L.emptyDescription} emptyHref={`${prefix}/category`} emptyAction={L.browse} />{onPageChange&&<RetailPagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />}</RetailContainer></main></RetailPublicShell>;
}

export function categoryJsonLd(data:CategoryPageData,locale:'en'|'ar'='en') {
  const base='https://tejaraa.com'; const prefix=locale==='ar'?'/ar':''; const path=`${prefix}${categoryPath(data.top,data.sub,data.detail)}`;
  const crumbs=[{name:'Home',item:`${base}${prefix||'/'}`},{name:'All Categories',item:`${base}${prefix}/category`},{name:data.top,item:`${base}${prefix}${categoryPath(data.top)}`},...(data.sub?[{name:data.sub,item:`${base}${prefix}${categoryPath(data.top,data.sub)}`}]:[]),...(data.detail?[{name:data.detail,item:`${base}${prefix}${categoryPath(data.top,data.sub,data.detail)}`}]:[])];
  return {'@context':'https://schema.org','@graph':[{'@type':'CollectionPage',name:categoryHeading(data),url:`${base}${path}`,description:categoryIntro(data,locale)},{'@type':'BreadcrumbList',itemListElement:crumbs.map((crumb,index)=>({'@type':'ListItem',position:index+1,name:crumb.name,item:crumb.item}))},{'@type':'ItemList',itemListElement:data.products.slice(0,24).map((product,index)=>({'@type':'ListItem',position:index+1,url:`${base}${prefix}${productPath(product)}`,name:product.name}))}]};
}
export { slugify };