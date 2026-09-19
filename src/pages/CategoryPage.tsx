import { useLocale } from '@/i18n/LocaleProvider';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common';
import { CategoryBanner, ListingToolbar, RetailListingHeader, RetailPagination, RetailProductGrid, SubcategoryChips } from '@/components/retail/listing';
import type { CategoryPageData } from '@/lib/catalogSeo.functions';
import { categoryPath, productPath, slugify } from '@/lib/seo/slug';
import { translateCategory } from '@/i18n/categoryNames';

type Props = { data: CategoryPageData; locale?: 'en' | 'ar'; page?: number; onPageChange?: (page: number) => void };
const PAGE_SIZE = 24;

export function categoryHeading(data: CategoryPageData) { return data.detail || data.sub || data.top; }
export function categoryIntro(data: CategoryPageData, locale: 'en'|'ar'='en') {
  const name=categoryHeading(data);
  return locale === 'ar' ? `تسوق منتجات ${name} واكتشف الخيارات المتاحة عبر تجارة.` : `Shop ${name.toLowerCase()}, everyday essentials and more on Tejaraa.`;
}

export default function CategoryPage({ data, locale='en', page=1, onPageChange }:Props) {
  const { t } = useLocale();
  const prefix=locale==='ar'?'/ar':''; const heading=categoryHeading(data);
  const tr = (name: string) => translateCategory(name, locale);
  const crumbs=[{label:t('shopx.category.home'),to:prefix||'/'},{label:t('shopx.category.allCategories'),to:`${prefix}/category`},{label:tr(data.top),to:`${prefix}${categoryPath(data.top)}`},...(data.sub?[{label:tr(data.sub),to:`${prefix}${categoryPath(data.top,data.sub)}`}]:[]),...(data.detail?[{label:tr(data.detail)}]:[])];
  const childItems=data.children.map((child)=>({label:tr(child.name),count:child.cnt,href:`${prefix}${data.sub?categoryPath(data.top,data.sub,child.name):categoryPath(data.top,child.name)}`}));
  const totalPages=Math.max(1,Math.ceil(data.total/PAGE_SIZE));
  return <RetailPublicShell dir={locale==='ar'?'rtl':'ltr'}><main><RetailContainer className="space-y-4 py-3 sm:py-4"><RetailListingHeader breadcrumbs={crumbs} title={tr(heading)} description={categoryIntro(data,locale)} countLabel={`${data.total.toLocaleString()} ${t('shopx.category.products')}`} />{!data.sub&&!data.detail&&<CategoryBanner name={tr(data.top)} description={categoryIntro(data,locale)} />}<SubcategoryChips title={t('shopx.category.browseRelated')} items={childItems} /><ListingToolbar resultLabel={`${data.total.toLocaleString()} ${t('shopx.category.products')}`} /><RetailProductGrid products={data.products as never} loading={false} emptyTitle={t('shopx.category.emptyTitle')} emptyDescription={t('shopx.category.emptyDescription')} emptyHref={`${prefix}/category`} emptyAction={t('shopx.category.browseAll')} />{onPageChange&&<RetailPagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />}</RetailContainer></main></RetailPublicShell>;
}

export function categoryJsonLd(data:CategoryPageData,locale:'en'|'ar'='en') {
  const base='https://tejaraa.com'; const prefix=locale==='ar'?'/ar':''; const path=`${prefix}${categoryPath(data.top,data.sub,data.detail)}`;
  const crumbs=[{name:'Home',item:`${base}${prefix||'/'}`},{name:'All Categories',item:`${base}${prefix}/category`},{name:data.top,item:`${base}${prefix}${categoryPath(data.top)}`},...(data.sub?[{name:data.sub,item:`${base}${prefix}${categoryPath(data.top,data.sub)}`}]:[]),...(data.detail?[{name:data.detail,item:`${base}${prefix}${categoryPath(data.top,data.sub,data.detail)}`}]:[])];
  return {'@context':'https://schema.org','@graph':[{'@type':'CollectionPage',name:categoryHeading(data),url:`${base}${path}`,description:categoryIntro(data,locale)},{'@type':'BreadcrumbList',itemListElement:crumbs.map((crumb,index)=>({'@type':'ListItem',position:index+1,name:crumb.name,item:crumb.item}))},{'@type':'ItemList',itemListElement:data.products.slice(0,24).map((product,index)=>({'@type':'ListItem',position:index+1,url:`${base}${prefix}${productPath(product)}`,name:product.name}))}]};
}
export { slugify };
