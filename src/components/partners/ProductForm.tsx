import { useNavigate } from "@tanstack/react-router";
import { FileClock, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Field, GhostButton, Panel, PrimaryButton, inputClass } from "@/components/partners/SupplierShell";
import { ProductImages, readProductImages, type ProductImage } from "@/components/partners/ProductImages";
import { RichTextEditor } from "@/components/partners/RichTextEditor";
import { sanitizeRichText } from "@/lib/partners/sanitize-html";
import {
  PartnerCategorySelect,
  useCategoryTree,
  buildCategoryPath,
  isCategoryComplete,
  categoryLeafId,
} from "@/components/partners/CategorySelect";

import { useAutoTranslate, type TranslateStatus } from "@/hooks/partners/useAutoTranslate";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { SupplierProduct } from "@/hooks/partners/useSupplierWorkspace";

/** Legacy free-text list — kept for older records only; new products use the SunSky category tree. */
export const productCategories = [
  "Electronics & Accessories", "Home & Kitchen", "Beauty & Personal Care", "Fashion & Apparel",
  "Food & Beverage", "Health & Wellness", "Baby & Kids", "Sports & Outdoors",
  "Office & Stationery", "Tools & Industrial", "Automotive Parts", "Packaging & Supplies",
];

export const currencies = ["AED", "SAR", "KWD", "QAR", "BHD", "OMR", "USD"];

function TranslateHint({
  status,
  arabic,
  onRetranslate,
}: {
  status?: TranslateStatus;
  arabic?: boolean;
  onRetranslate?: () => void;
}) {
  if (!status || status === "idle") return null;
  const text =
    status === "translating"
      ? (arabic ? "جارٍ الترجمة…" : "Translating…")
      : status === "auto"
        ? (arabic ? "ترجمة تلقائية — يمكنك التعديل" : "Auto-translated — you can edit it")
        : (arabic ? "تعذّرت الترجمة الآن — اكتبها يدويًا" : "Couldn't translate right now — type it manually");
  return (
    <div className="mt-1 flex items-center gap-2">
      <p className={`text-[11px] ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>{text}</p>
      {onRetranslate && status !== "translating" && (
        <button
          type="button"
          onClick={onRetranslate}
          className="inline-flex items-center gap-1 rounded-md border border-input px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          title={arabic ? "إعادة الترجمة من العمود الآخر" : "Re-translate from the other column"}
        >
          <RefreshCw className="h-3 w-3" />
          {arabic ? "إعادة الترجمة" : "Re-translate"}
        </button>
      )}
    </div>
  );
}

export type ProductFormValues = {
  name: string;
  nameAr: string;
  sku: string;
  brand: string;
  brandAr: string;
  category: string;
  categoryL1: number | null;
  categoryL2: number | null;
  categoryL3: number | null;
  description: string;
  descriptionAr: string;
  wholesale_price: string;
  currency: string;
  moq: string;
  stock: string;
  warehouse: string;
  images: ProductImage[];
};

export function emptyProduct(): ProductFormValues {
  return {
    name: "", nameAr: "", sku: "", brand: "", brandAr: "", category: "",
    categoryL1: null, categoryL2: null, categoryL3: null,
    description: "", descriptionAr: "", wholesale_price: "",
    currency: "", moq: "1", stock: "0", warehouse: "", images: [],
  };
}

export function toFormValues(product: SupplierProduct): ProductFormValues {
  const row = product as SupplierProduct & {
    description?: string;
    images?: unknown;
    category_l1_id?: number | null;
    category_l2_id?: number | null;
    category_l3_id?: number | null;
    category_path?: string | null;
    name_ar?: string | null;
    brand_ar?: string | null;
    description_ar?: string | null;
  };
  return {
    name: product.name,
    nameAr: row.name_ar ?? "",
    sku: product.sku,
    brand: product.brand,
    brandAr: row.brand_ar ?? "",
    category: row.category_path ?? product.category,
    categoryL1: row.category_l1_id ?? null,
    categoryL2: row.category_l2_id ?? null,
    categoryL3: row.category_l3_id ?? null,
    description: row.description ?? "",
    descriptionAr: row.description_ar ?? "",
    wholesale_price: String(product.wholesale_price),
    currency: product.currency,
    moq: String(product.moq),
    stock: String(product.stock),
    warehouse: product.warehouse,
    images: readProductImages(row.images),
  };
}

export function ProductForm({
  initial,
  productId,
  supplierId,
  warehouses,
  onSaved,
  allowDraft,
  extraImages,
}: {
  initial: ProductFormValues;
  productId?: string;
  supplierId: string | null;
  warehouses: string[];
  onSaved?: () => void;
  allowDraft?: boolean;
  /** External image links to append to the list (e.g. picked from an import). */
  extraImages?: string[];
}) {
  const [values, setValues] = useState(initial);
  const usedExtra = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!extraImages?.length) return;
    const fresh = extraImages.filter((link) => !usedExtra.current.has(link));
    if (!fresh.length) return;
    fresh.forEach((link) => usedExtra.current.add(link));
    setValues((prev) => ({
      ...prev,
      images: [...prev.images, ...fresh.filter((link) => !prev.images.some((img) => img.url === link)).map((link) => ({ url: link }))],
    }));
  }, [extraImages]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { rows: categoryRows, loading: categoriesLoading } = useCategoryTree();

  // English ⇄ Arabic: typing in one column fills the other automatically.
  const { status: translateStatus, retranslate } = useAutoTranslate({
    values,
    setValues,
    pairs: [
      { en: "name", ar: "nameAr" },
      { en: "brand", ar: "brandAr" },
      { en: "description", ar: "descriptionAr", html: true },
    ],
  });

  const categoryValue = {
    l1: values.categoryL1,
    l2: values.categoryL2,
    l3: values.categoryL3,
    path: values.category,
  };

  // Keep the stored path in step with the tree once it finishes loading.
  useEffect(() => {
    if (categoryRows.length === 0 || values.categoryL1 == null) return;
    const path = buildCategoryPath(categoryRows, categoryValue);
    if (path && path !== values.category) setValues((prev) => ({ ...prev, category: path }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryRows]);

  const categoryFields = {
    category_path: values.category || null,
    category_l1_id: values.categoryL1,
    category_l2_id: values.categoryL2,
    category_l3_id: values.categoryL3,
    category_id: categoryLeafId(categoryValue),
  };

  const set = (key: keyof ProductFormValues) => (value: string) => setValues((prev) => ({ ...prev, [key]: value }));


  async function save() {
    setError("");
    if (!supplierId) { setError("Your session expired. Please sign in again."); return; }
    if (!values.name.trim()) { setError("Product name is required."); return; }
    if (!values.sku.trim()) { setError("SKU is required."); return; }
    if (!values.brand.trim()) { setError("Brand is required."); return; }
    if (!isCategoryComplete(categoryValue, categoryRows)) {
      setError("Please choose the category, sub category and detailed category.");
      return;
    }
    if (!values.warehouse) { setError("Please choose a warehouse."); return; }
    if (!values.currency) { setError("Please choose a currency."); return; }
    if (!values.wholesale_price) { setError("Wholesale price is required."); return; }
    const price = Number(values.wholesale_price);
    const moq = Number(values.moq);
    const stock = Number(values.stock);
    if (!Number.isFinite(price) || price <= 0) { setError("Selling price must be a number greater than zero."); return; }
    if (!Number.isFinite(moq) || moq < 1) { setError("Minimum order quantity must be at least 1."); return; }
    if (!Number.isFinite(stock) || stock < 0) { setError("Stock cannot be a negative number."); return; }
    if (values.images.length === 0) { setError("At least one product image is required."); return; }
    const sku = values.sku.trim();
    if (sku) {
      setSaving(true);
      let skuQuery = supabase.from("wl_products").select("id").eq("supplier_id", supplierId).eq("sku", sku);
      if (productId) skuQuery = skuQuery.neq("id", productId);
      const { data: duplicates } = await skuQuery.limit(1);
      setSaving(false);
      if (duplicates && duplicates.length > 0) { setError(`SKU "${sku}" is already used by another product. Please choose a unique SKU.`); return; }
    }
    setSaving(true);
    const payload = {
      supplier_id: supplierId,
      name: values.name.trim(),
      name_ar: values.nameAr.trim() || null,
      sku: values.sku.trim(),
      brand: values.brand.trim(),
      brand_ar: values.brandAr.trim() || null,
      category: values.category,
      ...categoryFields,
      description: sanitizeRichText(values.description).trim(),
      description_ar: sanitizeRichText(values.descriptionAr).trim() || null,
      wholesale_price: price,
      currency: values.currency,
      moq: moq,
      stock: stock,
      warehouse: values.warehouse,
      images: values.images as unknown as Json,
      // Submitting an imported/auto draft sends it for approval.
      ...(allowDraft && productId ? { status: "pending" as const } : {}),
    };
    const { error: dbError } = productId
      ? await supabase.from("wl_products").update(payload).eq("id", productId)
      : await supabase.from("wl_products").insert(payload);
    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    onSaved?.();
    navigate({ to: "/partners/products", search: { q: "" } });
  }

  async function saveDraft() {
    setError("");
    if (!supplierId) { setError("Your session expired. Please sign in again."); return; }
    if (!values.name.trim()) { setError("Give the product a name before saving it as a draft."); return; }
    const price = Number(values.wholesale_price);
    const moq = Number(values.moq);
    const stock = Number(values.stock);
    setSaving(true);
    const payload = {
      supplier_id: supplierId,
      name: values.name.trim(),
      name_ar: values.nameAr.trim() || null,
      sku: values.sku.trim(),
      brand: values.brand.trim(),
      brand_ar: values.brandAr.trim() || null,
      category: values.category,
      ...categoryFields,
      description: sanitizeRichText(values.description).trim(),
      description_ar: sanitizeRichText(values.descriptionAr).trim() || null,
      wholesale_price: Number.isFinite(price) && price > 0 ? price : 0,
      currency: values.currency || "AED",
      moq: Number.isFinite(moq) && moq >= 1 ? moq : 1,
      stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
      warehouse: values.warehouse,
      images: values.images as unknown as Json,
      status: "draft" as const,
    };
    const { error: dbError } = productId
      ? await supabase.from("wl_products").update(payload).eq("id", productId)
      : await supabase.from("wl_products").insert(payload);
    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    toast.success("Saved to drafts — finish it whenever you're ready.");
    onSaved?.();
    navigate({ to: "/partners/products/drafts" });
  }

  return (
    <>
      <Panel title="Product details">
        <div className="grid gap-4 p-3 lg:grid-cols-2">
          <div className="grid gap-3 lg:col-span-2 sm:grid-cols-2">
            <Field label="SKU *"><input className={inputClass} value={values.sku} onChange={(e) => set("sku")(e.target.value)} placeholder="SKU-0001" /></Field>
            <Field label="Warehouse *">
              {warehouses.length > 0 ? (
                <select className={inputClass} value={values.warehouse} onChange={(e) => set("warehouse")(e.target.value)}>
                  <option value="">Select a warehouse</option>
                  {warehouses.map((warehouse) => <option key={warehouse} value={warehouse}>{warehouse}</option>)}
                </select>
              ) : (
                <input className={inputClass} value={values.warehouse} onChange={(e) => set("warehouse")(e.target.value)} placeholder="Warehouse / city" />
              )}
            </Field>
          </div>

          {/* English column */}
          <div className="space-y-3 rounded-lg border border-border bg-card p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">English</p>
            <Field label="Title *">
              <input className={inputClass} value={values.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Stainless steel water bottle 750ml" />
              <TranslateHint status={translateStatus.name} onRetranslate={() => retranslate("name")} />
            </Field>
            <Field label="Brand *">
              <input className={inputClass} value={values.brand} onChange={(e) => set("brand")(e.target.value)} placeholder="Brand name" />
              <TranslateHint status={translateStatus.brand} onRetranslate={() => retranslate("brand")} />
            </Field>
            <Field label="Description">
              <RichTextEditor
                value={values.description}
                onChange={(html) => set("description")(html)}
                placeholder="Describe the product: key features, materials, sizes, packaging, and anything buyers should know."
              />
              <TranslateHint status={translateStatus.description} onRetranslate={() => retranslate("description")} />
            </Field>
          </div>

          {/* Arabic column */}
          <div dir="rtl" className="space-y-3 rounded-lg border border-border bg-card p-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">العربية</p>
            <Field label="العنوان *">
              <input className={inputClass} value={values.nameAr} onChange={(e) => set("nameAr")(e.target.value)} placeholder="مثال: زجاجة ماء من الستانلس ستيل 750 مل" />
              <TranslateHint status={translateStatus.nameAr} arabic onRetranslate={() => retranslate("nameAr")} />
            </Field>
            <Field label="العلامة التجارية *">
              <input className={inputClass} value={values.brandAr} onChange={(e) => set("brandAr")(e.target.value)} placeholder="اسم العلامة التجارية" />
              <TranslateHint status={translateStatus.brandAr} arabic onRetranslate={() => retranslate("brandAr")} />
            </Field>
            <Field label="الوصف">
              <RichTextEditor
                value={values.descriptionAr}
                onChange={(html) => set("descriptionAr")(html)}
                placeholder="اكتب وصف المنتج: المميزات، الخامات، المقاسات، التغليف، وأي تفاصيل تهم المشتري."
              />
              <TranslateHint status={translateStatus.descriptionAr} arabic onRetranslate={() => retranslate("descriptionAr")} />
            </Field>
          </div>


          <div className="lg:col-span-2">
            <PartnerCategorySelect
              value={categoryValue}
              rows={categoryRows}
              loading={categoriesLoading}
              onChange={(next) => setValues((prev) => ({
                ...prev,
                categoryL1: next.l1,
                categoryL2: next.l2,
                categoryL3: next.l3,
                category: next.path,
              }))}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Wholesale terms">
        <div className="grid gap-3 p-3 sm:grid-cols-4">
          <Field label="Currency">
            <select className={inputClass} value={values.currency} onChange={(e) => set("currency")(e.target.value)}>
              <option value="" disabled>Select currency</option>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </Field>
          <Field label="Wholesale price *"><input type="number" min="0" step="0.01" className={inputClass} value={values.wholesale_price} onChange={(e) => set("wholesale_price")(e.target.value)} /></Field>
          <Field label="Minimum order quantity"><input type="number" min="1" className={inputClass} value={values.moq} onChange={(e) => set("moq")(e.target.value)} /></Field>
          <Field label="Stock available"><input type="number" min="0" className={inputClass} value={values.stock} onChange={(e) => set("stock")(e.target.value)} /></Field>
        </div>
      </Panel>

      <Panel title="Product images *">
        <ProductImages
          images={values.images}
          supplierId={supplierId}
          onChange={(next) => setValues((prev) => ({ ...prev, images: next }))}
        />
      </Panel>



      {error && <p className="rounded-card border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving…" : productId ? "Save changes" : "Save product"}</PrimaryButton>
        {allowDraft && (
          <GhostButton onClick={() => void saveDraft()} disabled={saving}>
            <FileClock className="h-4 w-4" /> Save as draft
          </GhostButton>
        )}
        <GhostButton onClick={() => navigate({ to: "/partners/products", search: { q: "" } })}>Cancel</GhostButton>
      </div>
    </>
  );
}
