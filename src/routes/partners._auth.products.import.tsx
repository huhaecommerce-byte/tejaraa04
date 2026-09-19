import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

const steps = [
  "Opening the product page…",
  "Reading the title, brand and price…",
  "Collecting the product photos…",
  "Almost there — preparing your listing…",
];
import { Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { sanitizeRichText } from "@/lib/partners/sanitize-html";
import { BrandLogo } from "@/components/BrandLogo";
import { SupplierShell, Panel, Field, PrimaryButton, GhostButton, inputClass } from "@/components/partners/SupplierShell";
import { ProductForm, emptyProduct, currencies, type ProductFormValues } from "@/components/partners/ProductForm";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { warehouseNames } from "@/routes/partners._auth.products.new";
import { scrapeProductFromUrl, type ScrapedProduct } from "@/lib/partners/product-import.functions";

export const Route = createFileRoute("/partners/_auth/products/import")({
  head: () => ({
    meta: [
      { title: `Import Product From A Link — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Paste a product link from any online store and we will read the details for you to review and submit for approval." },
      { property: "og:title", content: `Import Product From A Link — ${brandConfig.name}` },
      { property: "og:description", content: "Paste a product link, review the details, submit for approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImportProductPage,
});

function toFormValues(scraped: ScrapedProduct): ProductFormValues {
  const base = emptyProduct();
  return {
    ...base,
    name: scraped.name.slice(0, 160),
    brand: scraped.brand,
    sku: scraped.sku,
    // Categories come from the shared category tree — the supplier picks all three levels.
    category: "",
    description: scraped.description ? `<p>${scraped.description.replace(/</g, "&lt;").slice(0, 4000)}</p>` : "",
    wholesale_price: scraped.price,
    currency: currencies.includes(scraped.currency) ? scraped.currency : "",
    images: scraped.images.map((url) => ({ url })),
  };
}

function ImportProductPage() {
  const { userId, application, refresh, loading } = useSupplierWorkspace();
  const warehouses = warehouseNames(application?.warehouses);
  const scrape = useServerFn(scrapeProductFromUrl);

  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scraped, setScraped] = useState<ScrapedProduct | null>(null);
  const [values, setValues] = useState<ProductFormValues | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!busy) { setStep(0); return; }
    const timer = window.setInterval(() => setStep((prev) => (prev + 1) % steps.length), 2200);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function run() {
    setError("");
    if (!url.trim()) { setError("Please paste a product link first."); return; }
    setBusy(true);
    try {
      const result = await scrape({ data: { url } });
      setScraped(result);
      const formValues = toFormValues(result);
      setValues(formValues);
      // Automatically park the fetched product in drafts so nothing is lost.
      if (userId) {
        const price = Number(formValues.wholesale_price);
        const { data: draft, error: draftError } = await supabase
          .from("wl_products")
          .insert({
            supplier_id: userId,
            name: formValues.name.trim() || "Imported product",
            sku: formValues.sku.trim(),
            brand: formValues.brand.trim(),
            category: formValues.category,
            description: sanitizeRichText(formValues.description).trim(),
            wholesale_price: Number.isFinite(price) && price > 0 ? price : 0,
            currency: formValues.currency || "AED",
            moq: 1,
            stock: 0,
            warehouse: formValues.warehouse,
            images: formValues.images as unknown as Json,
            status: "draft",
          })
          .select("id")
          .single();
        if (draftError) {
          setError(`Details loaded, but the draft could not be saved automatically: ${draftError.message}`);
        } else if (draft) {
          setDraftId(draft.id);
          toast.success("Saved to your drafts — it stays there until you submit it.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not read that page. Please try another link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SupplierShell
      title="Import From A Link"
      subtitle="Paste a product page from any online store. We read the details, you check them, then send the listing for approval."
    >
      <div className="space-y-4">
        <Panel title="Product link">
          <div className="space-y-3 p-3">
            <Field label="Paste the product page address" hint="Example: https://store.com/products/wireless-earbuds">
              <input
                id="importUrl"
                className={inputClass}
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") void run(); }}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <PrimaryButton onClick={() => void run()} disabled={busy}>
                <Sparkles className="h-4 w-4" />
                {busy ? "Reading the page…" : "Read product details"}
              </PrimaryButton>
              {values && (
                <GhostButton onClick={() => { setValues(null); setScraped(null); setDraftId(null); setUrl(""); }} disabled={busy}>
                  Start over
                </GhostButton>
              )}
            </div>
            {busy && (
              <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-secondary/40 px-4 py-6">
                <BrandLogo variant="storefront-footer" className="animate-pulse" />
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border">
                  <div className="h-full w-1/3 rounded-full bg-primary [animation:tjx-progress_1.2s_ease-in-out_infinite]" />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground">{steps[step]}</p>
              </div>
            )}
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
            {scraped && (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                Details read from {scraped.sourceUrl}
              </p>
            )}
          </div>
        </Panel>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading your account…</p>
        ) : values ? (
          <ProductForm
            key={draftId ?? scraped?.sourceUrl ?? "imported"}
            initial={values}
            {...(draftId ? { productId: draftId } : {})}
            supplierId={userId}
            warehouses={warehouses}
            onSaved={refresh}
            allowDraft
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Once we read the page, the listing form appears here already filled in — check every field, add your wholesale price and pictures, then submit it for approval.
          </p>
        )}
      </div>
    </SupplierShell>
  );
}
