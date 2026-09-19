import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { isUuid } from '@/lib/seo/slug';
import { ArrowLeft, Tag, Truck, Package, Weight, Copy, ChevronLeft, ChevronRight, Barcode, ShoppingCart, MapPin, Warehouse, CheckCircle, Globe2, Home, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { sellPriceSar, parsePricingSettings, importShippingFee, DEFAULT_PRICING, type PricingSettings } from '@/lib/priceConversion';
import { RequestQuoteButton } from '@/components/customer/RequestQuoteButton';
import { useBrowsedProducts } from '@/hooks/useBrowsedProducts';
import { trackProductView } from '@/lib/trackProductView';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useAuth } from '@/contexts/AuthContext';


const stripSpecifications = (html: string) => {
  if (typeof window === 'undefined' || !html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('[class*="params_"]').forEach((el) => el.remove());
  return doc.body.innerHTML;
};

const descriptionHasContent = (html: string) => {
  if (typeof window === 'undefined' || !html) return false;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').trim().length > 0;
};

const CustomerProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { numericLimit, isUnlimited, isLoading: planLoading } = useCurrentPlan();
  const imgLimit = numericLimit('image_bulk_download');
  const imgUnlimited = isUnlimited('image_bulk_download');
  const [imgUsed, setImgUsed] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [sarRate, setSarRate] = useState(3.75);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [variants, setVariants] = useState<any[]>([]);
  const { addBrowsed } = useBrowsedProducts();
  const sellingPrice = sellPriceSar(product);

  useEffect(() => {
    if (!user?.id) return;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    (supabase as any)
      .from('image_download_log')
      .select('count')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .then(({ data }: any) => {
        setImgUsed((data ?? []).reduce((s: number, r: any) => s + (Number(r.count) || 0), 0));
      });
  }, [user?.id]);

  useEffect(() => {
    supabase.from('platform_settings').select('key, value')
      .in('key', ['usd_to_sar_rate', 'sell_weight_rate', 'weight_fee_mode', 'weight_fee_scope'])
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value; });
        if (map['usd_to_sar_rate']) setSarRate(parseFloat(map['usd_to_sar_rate']) || 3.75);
        setPricing(parsePricingSettings(map));
      });
  }, []);
  useEffect(() => {
    if (!id) return;
    setVariants([]);
    setLoading(true);
    (async () => {
      // The id param can be a UUID (internal links) or an SEO slug (public product pages).
      const base = () => supabase.from('products').select('*');
      let prod: any = null;
      if (isUuid(id)) {
        const { data } = await base().eq('id', id).maybeSingle();
        prod = data;
      }
      if (!prod) {
        const { data } = await base().eq('slug', id).maybeSingle();
        prod = data;
      }
      if (!prod) {
        const { data } = await base().eq('slug_ar', id).maybeSingle();
        prod = data;
      }
      setProduct(prod);
      // Track this product as actually viewed
      if (prod?.id) { addBrowsed([prod.id]); trackProductView(prod.id); }
      if (prod?.sku) {
        const trimmed = prod.sku.trim();
        const match = trimmed.match(/^(.+)[A-Z]$/);
        if (match) {
          const baseSku = match[1];
          const candidateSkus = Array.from({ length: 26 }, (_, i) =>
            baseSku + String.fromCharCode(65 + i)
          );
          const { data: siblings } = await supabase
            .from('products')
            .select('id, name, sku, images')
            .in('sku', candidateSkus);
          setVariants((siblings || []).sort((a: any, b: any) => a.sku.localeCompare(b.sku)));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Product not found</p>
          <Link to="/dropshipping/catalog"><Button>Back to Catalog</Button></Link>
        </div>
      </div>
    );
  }

  const images: string[] = product.images?.length > 0 ? product.images : [];

  return (
    <div className="space-y-2 pb-10 md:pb-0 max-w-full overflow-x-hidden">
      <Link to="/dropshipping/catalog" className="inline-block">
        <Button variant="outline" size="sm" className="gap-1.5 w-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Button>
      </Link>

      <div className="grid md:grid-cols-[480px_1fr] md:auto-rows-fr gap-4 md:gap-5">
        {/* Image Gallery Column */}
        <div className="flex flex-col space-y-2 min-w-0">
          <div
            className="bg-white rounded-xl flex items-center justify-center border overflow-hidden aspect-square md:aspect-auto md:flex-1 relative w-full max-w-full"
            onContextMenu={(e) => e.preventDefault()}
          >
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain no-save-img"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <Package className="h-24 w-24 text-muted-foreground/30" />
            )}
            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
            {images.length > 1 && (
              <span className="absolute bottom-2 right-2 z-20 text-xs bg-background/80 border rounded-full px-2 py-0.5">{selectedImage + 1} / {images.length}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-2 shadow-md flex-shrink-0 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2 flex-1 justify-start md:justify-center overflow-x-auto no-scrollbar snap-x">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)} onContextMenu={(e) => e.preventDefault()} className={`w-14 h-14 rounded-lg border-2 overflow-hidden flex-shrink-0 bg-background/80 p-1 transition-all snap-start touch-manipulation ${i === selectedImage ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full rounded-md object-contain no-save-img"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedImage(i => (i + 1) % images.length)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-2 shadow-md flex-shrink-0 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
          {images.length > 0 && (planLoading || imgLimit > 0) && (
            <div className="space-y-2">
              <Button
                size="sm"
                disabled={planLoading || (!imgUnlimited && imgUsed + 1 > imgLimit)}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary active:bg-primary"
                onClick={async () => {
                  if (!user?.id) {
                    toast.error('Please sign in to download images.');
                    return;
                  }
                  if (!imgUnlimited && imgUsed + 1 > imgLimit) {
                    toast.error(`Monthly product download limit reached (${imgUsed} / ${imgLimit}). Upgrade your plan.`);
                    return;
                  }
                  toast.info('Creating ZIP file... This may take a moment.');
                  try {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const res = await fetch(`/api/fn/download-images`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        urls: images,
                        filename: product.sku || product.name,
                      }),
                    });
                    if (!res.ok) throw new Error('Server error');
                    const { images: imgData } = await res.json();
                    if (!imgData || imgData.length === 0) throw new Error('No images fetched');

                    const zip = new JSZip();
                    for (const img of imgData) {
                      const binaryStr = atob(img.data);
                      const bytes = new Uint8Array(binaryStr.length);
                      for (let j = 0; j < binaryStr.length; j++) {
                        bytes[j] = binaryStr.charCodeAt(j);
                      }
                      zip.file(img.name, bytes);
                    }
                    const content = await zip.generateAsync({ type: 'blob' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(content);
                    a.download = `${product.sku || product.name}_images.zip`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                    await (supabase as any).from('image_download_log').insert({
                      user_id: user.id,
                      count: 1,
                      product_id: product.id,
                    });
                    setImgUsed(u => u + 1);
                    toast.success(`ZIP downloaded with ${imgData.length} images!`);
                  } catch {
                    toast.error('Failed to create ZIP. Try opening images individually.');
                  }
                }}
              >
                <Package className="h-4 w-4" />
                Download All {images.length} Images as ZIP
              </Button>
              <p className="mx-auto w-fit max-w-full rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-center text-xs text-muted-foreground shadow-sm">
                {planLoading
                  ? 'Checking your plan…'
                  : imgUnlimited
                  ? 'Unlimited product downloads on your plan.'
                  : `Used ${imgUsed} of ${imgLimit} products this month.`}
              </p>
            </div>
          )}
        </div>

        {/* Product Info Column */}
        <div className="flex flex-col space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 pt-2 pb-1">
            {product.source === 'local' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold capitalize tracking-wide ring-1 ring-primary/20">
                <Home className="h-3.5 w-3.5" />
                Local
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 text-accent px-2.5 py-1 text-xs font-bold capitalize tracking-wide ring-1 ring-accent/30 shadow-sm">
                <Globe2 className="h-3.5 w-3.5" />
                Global
              </span>
            )}
            {product.source !== 'local' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 text-xs font-semibold capitalize tracking-wide ring-1 ring-amber-500/20">
                <Clock className="h-3.5 w-3.5" />
                7–10 Days Processing & Delivery
              </span>
            )}
            {product.labelling_available && <Badge variant="outline"><Tag className="h-3 w-3 mr-1" />Labelling Available</Badge>}
          </div>

          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold mb-1 break-words leading-tight">{product.name}</h1>
            {product.name_ar && <p className="text-base text-muted-foreground break-words" dir="rtl">{product.name_ar}</p>}
          </div>

          <p className="text-xs text-muted-foreground break-words">{product.top_category} › {product.sub_category} › {product.detailed_category}</p>

          <div className={`grid gap-3 ${variants.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {variants.length > 1 && (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Variants</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{variants.length}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 auto-rows-1fr">
                  {variants.map((v: any, i: number) => {
                    const suffix = v.sku.replace(product.sku.replace(/[A-Z]$/, ''), '');
                    const isCurrent = v.id === product.id;
                    const thumb = v.images?.[0];
                    return (
                      <Link
                        key={v.id}
                        to={`/dropshipping/catalog/${v.id}`}
                        className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in ${
                          isCurrent
                            ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/40'
                            : 'border-border/50 bg-card hover:border-primary/30'
                        }`}
                        style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                      >
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-muted/30 flex items-center justify-center flex-shrink-0" onContextMenu={(e) => e.preventDefault()}>
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={v.name}
                              className="w-full h-full object-contain no-save-img"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </div>
                        <span className={`font-bold text-sm mt-1 ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                          {suffix || v.sku}
                        </span>
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary/60 transition-all duration-500 group-hover:w-full" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price */}
            <div className={`flex flex-col ${variants.length <= 1 ? 'col-span-full' : ''}`}>
              <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase mb-1">Price</h3>
              <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-3 space-y-2">
                <p className="text-2xl font-bold text-primary">SAR {sellingPrice.toFixed(2)}</p>
                {importShippingFee(product, 1, pricing) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    + Import Shipping Fee SAR {importShippingFee(product, 1, pricing).toFixed(2)} per unit, added at checkout.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Per unit, excluding VAT and shipping.</p>
                <Button
                  size="sm"
                  className="w-full h-10 rounded-full font-semibold touch-manipulation active:scale-[0.97]"
                  onClick={() => navigate(`/dropshipping/orders/new?productId=${product.id}`)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
                  Order Now
                </Button>
              </div>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-3 space-y-2">
              {product.estimated_delivery && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Est. Delivery:</span>
                  <span className="font-medium">{product.estimated_delivery}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Weight className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium">{Number(product.weight_kg).toFixed(2)} kg</span>
              </div>
              {product.platforms?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Platforms:</span>
                  <span className="font-medium">{product.platforms.join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <Button className="w-full" size="lg" onClick={() => navigate(`/dropshipping/orders/new?productId=${product.id}`)}>
              Order Now
            </Button>
            <RequestQuoteButton productId={product.id} productName={product.name} defaultPrice={sellingPrice} />
          </div>

          {/* How It Works Steps */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">How It Works</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: ShoppingCart, label: 'Place Order', desc: 'Choose qty & tier' },
                { icon: CheckCircle, label: 'We Source', desc: 'We procure for you' },
                { icon: Warehouse, label: 'Warehouse', desc: 'Stored & labelled' },
                { icon: Truck, label: 'Delivered', desc: 'To you or customer' },
              ].map((step, i) => (
                <div
                  key={step.label}
                  className="group relative flex flex-col items-center text-center p-2 rounded-lg border border-border/40 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${300 + i * 100}ms`, animationFillMode: 'both' }}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors duration-300">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">{step.desc}</p>
                  {i < 3 && (
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 text-xs hidden md:block">›</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                { icon: MapPin, text: 'Dropship to your customer' },
                { icon: Warehouse, text: 'Ship to your warehouse' },
                { icon: Truck, text: 'Deliver anywhere in KSA' },
              ].map((option) => (
                <div key={option.text} className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 hover:bg-emerald-500/20 transition-colors duration-200">
                  <option.icon className="h-3 w-3" />
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const cleanedDescription = stripSpecifications(product.description || '');
        if (!descriptionHasContent(cleanedDescription)) return null;
        return (
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <p className="text-sm font-medium text-muted-foreground">Product Description</p>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary active:bg-primary"
                  onClick={() => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cleanedDescription;
                    const plainText = tempDiv.textContent || tempDiv.innerText || cleanedDescription;
                    navigator.clipboard.writeText(plainText);
                    toast.success('Description copied to clipboard!');
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy Full Description</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
              </div>
              <div
                className="product-description text-foreground text-sm prose prose-sm max-w-none dark:prose-invert prose-img:max-w-full prose-img:h-auto break-words"
                dangerouslySetInnerHTML={{ __html: cleanedDescription }}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* Mobile sticky CTA bar — merges flush on top of the bottom nav */}
      <div
        className="md:hidden fixed left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[hsl(152_40%_88%/0.7)]"
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-2 items-center gap-2 px-3 py-2">
          <RequestQuoteButton compact productId={product.id} productName={product.name} defaultPrice={sellingPrice} className="w-full h-9 px-2 justify-center" />
          <Button
            size="sm"
            className="h-9 px-2 rounded-full font-semibold touch-manipulation active:scale-[0.97] w-full justify-center"
            onClick={() => navigate(`/dropshipping/orders/new?productId=${product.id}`)}
          >
            <ShoppingCart className="h-4 w-4 mr-1 shrink-0" />
            Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductDetail;
