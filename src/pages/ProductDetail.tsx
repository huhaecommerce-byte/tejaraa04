import { useEffect, useMemo } from 'react';
import { categoryPath } from '@/lib/seo/slug';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailBreadcrumbs, RetailContainer, RetailEmptyState } from '@/components/retail/common';
import { ProductBuyBox, ProductGallery, ProductIdentity, ProductInformation } from '@/components/retail/product';
import { ProductRail } from '@/components/retail/home/ProductRail';
import { trackProductView } from '@/lib/trackProductView';
import { sellPriceSar } from '@/lib/priceConversion';
import { useProductDetailRows } from '@/lib/productDetailRows';
import type { SeoProduct } from '@/lib/catalogSeo.functions';

const cleanDescription = (raw: string) =>
  raw
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*class=["'][^"']*params_[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const ProductDetail = ({ initialProduct }: { initialProduct: SeoProduct | null }) => {
  const detailRows = useProductDetailRows();
  const product = initialProduct;

  useEffect(() => {
    if (product?.id) trackProductView(product.id);
  }, [product?.id]);

  const sellingPrice = sellPriceSar(product);
  const descriptionText = cleanDescription(product?.description || '');
  const ratings = useMemo(() => product?.related_ratings ?? {}, [product?.related_ratings]);

  return (
    <RetailPublicShell>
      <main>
        <RetailContainer className="py-3 sm:py-4">
          {!product ? (
            <RetailEmptyState title="Product not found" description="This product may no longer be available." actionLabel="Continue Shopping" actionHref="/catalog" />
          ) : (
            <>
              <RetailBreadcrumbs items={[
                { label: 'Home', to: '/' },
                { label: product.top_category, to: categoryPath(product.top_category) },
                ...(product.sub_category ? [{ label: product.sub_category, to: categoryPath(product.top_category, product.sub_category) }] : []),
                ...(product.detailed_category ? [{ label: product.detailed_category, to: categoryPath(product.top_category, product.sub_category, product.detailed_category) }] : []),
                { label: product.name },
              ]} />
              <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,.8fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.82fr)_320px] xl:gap-7">
                <ProductGallery images={product.images ?? []} productName={product.name} />
                <ProductIdentity product={product} price={sellingPrice} />
                <div className="lg:col-span-2 xl:col-span-1"><ProductBuyBox product={product} price={sellingPrice} /></div>
              </div>
              <section className="mt-7 bg-retail-card px-3 sm:px-5"><ProductInformation product={product} description={descriptionText} rows={detailRows} /></section>
              {product.related_products && product.related_products.length > 0 && <div className="mt-6"><ProductRail title="Similar Products" description={`More from ${product.sub_category || product.top_category}`} products={product.related_products as never} ratings={ratings as never} /></div>}
            </>
          )}
        </RetailContainer>
      </main>
    </RetailPublicShell>
  );
};

export default ProductDetail;

