import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ImageIcon, X } from "lucide-react";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatusPill } from "@/components/partners/SupplierShell";
import { readProductImages } from "@/components/partners/ProductImages";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeRichText } from "@/lib/partners/sanitize-html";
import { useServerFn } from "@tanstack/react-start";
import { pushProductsNow } from "@/lib/partners/channel-connections.functions";

export const Route = createFileRoute("/partners/admin/products/$id")({
  head: () => ({
    meta: [
      { title: `Listing Review | ${brandConfig.name}` },
      { name: "description", content: "Full wholesale listing record: photos, pricing, stock, warehouse and supplier details before approval." },
      { property: "og:title", content: `Listing Review | ${brandConfig.name}` },
      { property: "og:description", content: "Verify every detail submitted by the wholesaler, then set the listing status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetailPage,
});

const statusTone: Record<string, string> = { pending: "warning", active: "positive", rejected: "danger", draft: "neutral", out_of_stock: "warning" };
const statusOptions = ["pending", "active", "rejected"] as const;
type ProductStatus = (typeof statusOptions)[number];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function ProductDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [saveError, setSaveError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data: row, error: rowError } = await supabase.from("wl_products").select("*").eq("id", id).maybeSingle();
      if (rowError) throw rowError;
      return row;
    },
  });

  const { data: supplier } = useQuery({
    queryKey: ["admin", "product-supplier", data?.supplier_id],
    enabled: Boolean(data?.supplier_id),
    queryFn: async () => {
      const [profile, application] = await Promise.all([
        supabase.from("wl_partner_profiles").select("*").eq("id", data!.supplier_id).maybeSingle(),
        supabase.from("wl_applications").select("*").eq("user_id", data!.supplier_id).maybeSingle(),
      ]);
      return { profile: profile.data, application: application.data };
    },
  });

  useEffect(() => {
    if (data?.review_notes) setNote(data.review_notes);
  }, [data?.review_notes]);

  const pushProducts = useServerFn(pushProductsNow);

  const setStatus = useMutation({
    mutationFn: async (status: ProductStatus) => {
      const { error: updateError } = await supabase.from("wl_products").update({ status, review_notes: note }).eq("id", id);
      if (updateError) throw updateError;
      // Approved catalogue changes are shared with every connected project.
      if (status === "active") {
        try {
          await pushProducts({ data: {} });
        } catch {
          /* connected projects are retried from the Connections page */
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (mutationError: Error) => setSaveError(mutationError.message),
  });

  const backLink = (
    <Link
      to="/partners/admin/products"
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to listings
    </Link>
  );

  if (isLoading) {
    return (
      <AdminShell title="Listing" subtitle="Loading the full listing record." actions={backLink}>
        <Panel title="Loading"><p className="px-3 py-6 text-xs text-muted-foreground">Fetching listing…</p></Panel>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell title="Listing not found" subtitle="This listing no longer exists or you do not have access." actions={backLink}>
        <Panel title="Nothing to show">
          <p className="px-3 py-6 text-xs text-muted-foreground">We could not load this listing. Go back and pick another one.</p>
        </Panel>
      </AdminShell>
    );
  }

  const images = readProductImages(data.images);
  const app = supplier?.application;
  const warehouses = Array.isArray(app?.warehouses) ? (app!.warehouses as { country?: string; city?: string; address?: string }[]) : [];

  return (
    <AdminShell
      title="Listing review"
      subtitle={`${data.sku || "No SKU"} · submitted ${formatDate(data.created_at)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={data.status.replace("_", " ")} tone={statusTone[data.status] ?? "neutral"} />
          {backLink}
        </div>
      }
    >
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: what the customer will see */}
        <div className="space-y-3">
          <h1 className="px-1 text-base font-extrabold leading-snug text-foreground">{data.name}</h1>
          <Panel title="Description">
            {data.description ? (
              <div
                className="rich-text px-3 py-3 text-xs leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(data.description) }}
              />
            ) : (
              <p className="px-3 py-3 text-xs leading-relaxed text-muted-foreground">No description was provided for this listing.</p>
            )}
          </Panel>

          <Panel title={`Photos (${images.length})`}>
            {images.length === 0 ? (
              <p className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground"><ImageIcon className="h-4 w-4" /> No photos were uploaded for this listing.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <Photo key={`${image.path ?? image.url}-${index}`} image={image} label={index === 0 ? "Main photo" : `Photo ${index + 1}`} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Right: everything the admin needs, in one column */}
        <div className="space-y-3 lg:sticky lg:top-4">
          <Panel title="Your decision">
            <div className="space-y-2.5 p-3">
              {data.status === "pending" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate("active")}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate("rejected")}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/5 px-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {data.status === "active" ? "Approved and live." : data.status === "rejected" ? "Rejected." : "No action needed."}
                    {" "}The buttons return if the wholesaler changes anything.
                  </span>
                  <StatusPill label={data.status.replace(/_/g, " ")} tone={data.status === "active" ? "text-primary" : data.status === "rejected" ? "text-destructive" : "text-muted-foreground"} />
                </div>
              )}
              {data.status === "pending" && (
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Note to the wholesaler (optional)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              )}
              {setStatus.isSuccess && !setStatus.isPending && <p className="text-[11px] font-semibold text-primary">Saved</p>}
              {saveError && <p className="text-[11px] font-semibold text-destructive">{saveError}</p>}
            </div>
          </Panel>

          <Panel title="Key facts">
            <div className="p-3">
              <div className="mb-2 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-secondary/60 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Price</p>
                  <p className="mt-0.5 text-sm font-extrabold text-foreground">{data.currency || ""} {Number(data.wholesale_price).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-secondary/60 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Min order</p>
                  <p className="mt-0.5 text-sm font-extrabold text-foreground">{data.moq}</p>
                </div>
                <div className="rounded-xl bg-secondary/60 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">In stock</p>
                  <p className="mt-0.5 text-sm font-extrabold text-foreground">{data.stock}</p>
                </div>
              </div>
              <Row label="Brand" value={data.brand} />
              <Row label="Category" value={data.category} />
              <Row label="SKU" value={data.sku} />
              <Row label="Warehouse" value={data.warehouse} />
              <Row label="Last updated" value={formatDate(data.updated_at)} />
            </div>
          </Panel>

          <Panel title="Submitted by">
            <div className="p-3">
              <Row label="Company" value={app?.business_name ?? null} />
              <Row label="Contact" value={supplier?.profile ? `${supplier.profile.first_name} ${supplier.profile.last_name}`.trim() : null} />
              <Row label="Email" value={supplier?.profile?.email ?? null} />
              <Row label="Mobile" value={supplier?.profile?.mobile ?? null} />
              {warehouses.length > 0 && (
                <Row label="Warehouses" value={warehouses.map((w) => [w.city, w.country].filter(Boolean).join(", ")).join(" · ") || null} />
              )}
            </div>
            {data.supplier_id && app?.id && (
              <div className="px-3 pb-3">
                <Link
                  to="/partners/admin/applications/$id"
                  params={{ id: app.id }}
                  className="inline-flex h-8 items-center rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  View supplier application
                </Link>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}

function Photo({ image, label }: { image: { path?: string; url?: string }; label: string }) {
  const [src, setSrc] = useState<string | null>(image.url ?? null);

  useEffect(() => {
    let cancelled = false;
    setSrc(image.url ?? null);
    if (image.path) {
      supabase.storage.from("partner-product-images").createSignedUrl(image.path, 3600).then(({ data }) => {
        if (!cancelled && data?.signedUrl) setSrc(data.signedUrl);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [image.path, image.url]);

  return (
    <figure className="overflow-hidden rounded-card border border-border bg-secondary/40">
      {src ? (
        <a href={src} target="_blank" rel="noopener noreferrer">
          <img src={src} alt={label} className="h-36 w-full object-cover" loading="lazy" />
        </a>
      ) : (
        <div className="grid h-36 w-full place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
      )}
      <figcaption className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 text-[11px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] break-words text-right font-semibold text-foreground">{value || "—"}</span>
    </div>
  );
}
