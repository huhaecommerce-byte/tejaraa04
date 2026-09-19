import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, FileText, Paperclip, ShieldCheck, X } from "lucide-react";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatusPill, TableWrap, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { documentLabels } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/partners/admin/suppliers/$id")({
  head: () => ({
    meta: [
      { title: `Wholesaler Profile | ${brandConfig.name}` },
      { name: "description", content: "Complete wholesaler record: company details, documents, payout details, listings, orders and activity." },
      { property: "og:title", content: `Wholesaler Profile | ${brandConfig.name}` },
      { property: "og:description", content: "View one wholesaler's company, finance and activity records in full." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierDetailPage,
});

const statusTone: Record<string, string> = {
  pending: "warning",
  approved: "positive",
  active: "positive",
  rejected: "danger",
  requested: "warning",
  paid: "positive",
  draft: "neutral",
};

type Warehouse = { country?: string; city?: string; address?: string };

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function money(value: number, currency: string) {
  return `${currency || ""} ${Number(value || 0).toLocaleString()}`.trim();
}

function SupplierDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);
  const [docError, setDocError] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "supplier-detail", id],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [profile, application, settings, products, orders, payouts, payoutHistory] = await Promise.all([
        supabase.from("wl_partner_profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("wl_applications").select("*").eq("user_id", id).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("wl_settings").select("*").eq("supplier_id", id).maybeSingle(),
        supabase.from("wl_products").select("*").eq("supplier_id", id).order("created_at", { ascending: false }),
        supabase.from("wl_orders").select("*").eq("supplier_id", id).order("created_at", { ascending: false }),
        supabase.from("wl_payout_requests").select("*").eq("supplier_id", id).order("created_at", { ascending: false }),
        supabase.from("wl_payout_detail_history").select("*").eq("supplier_id", id).order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        profile: profile.data,
        application: application.data,
        settings: settings.data,
        products: products.data ?? [],
        orders: orders.data ?? [],
        payouts: payouts.data ?? [],
        payoutHistory: payoutHistory.data ?? [],
      };
    },
  });

  const openDocument = async (label: string, path: string) => {
    if (!path) return;
    setDocError("");
    setOpeningDoc(label);
    const { data: signed, error } = await supabase.storage.from("partner-documents").createSignedUrl(path, 60 * 10);
    setOpeningDoc(null);
    if (error || !signed?.signedUrl) {
      setDocError(`We could not open "${label}". ${error?.message ?? "The file is unavailable."}`);
      return;
    }
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
  };

  const applicationId = data?.application?.id ?? null;

  useEffect(() => {
    if (data?.application?.review_notes) setNote(data.application.review_notes);
  }, [data?.application?.review_notes]);

  const decide = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      if (!applicationId) throw new Error("This account has no submitted application yet.");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("wl_applications")
        .update({
          status,
          review_notes: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.user?.id ?? null,
        })
        .eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (mutationError: Error) => setDocError(mutationError.message),
  });

  const verify = useMutation({
    mutationFn: async ({ storeKey, verified }: { storeKey: string; verified: boolean }) => {
      if (!applicationId) throw new Error("This account has no submitted application yet.");
      const current = (data?.application?.documents ?? {}) as Record<string, Json>;
      const existing = current[storeKey];
      const base =
        typeof existing === "string"
          ? { name: existing, path: "", verified: false }
          : ((existing ?? { name: "", path: "", verified: false }) as Record<string, Json>);
      const next: Json = { ...current, [storeKey]: { ...base, verified } };
      const { error } = await supabase.from("wl_applications").update({ documents: next }).eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (mutationError: Error) => setDocError(mutationError.message),
  });


  const backLink = (
    <Link
      to="/partners/admin/suppliers"
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to wholesalers
    </Link>
  );

  if (isLoading) {
    return (
      <AdminShell title="Wholesaler" subtitle="Loading the full record." actions={backLink}>
        <Panel title="Loading"><p className="px-3 py-6 text-xs text-muted-foreground">Fetching wholesaler…</p></Panel>
      </AdminShell>
    );
  }

  if (!data?.profile) {
    return (
      <AdminShell title="Wholesaler not found" subtitle="This account no longer exists." actions={backLink}>
        <Panel title="Nothing to show">
          <p className="px-3 py-6 text-xs text-muted-foreground">We could not load this wholesaler. Go back and pick another one.</p>
        </Panel>
      </AdminShell>
    );
  }

  const { profile, application, settings, products, orders, payouts, payoutHistory } = data;
  const rawDocuments = (application?.documents ?? {}) as Record<string, unknown>;
  const normalizeDoc = (storeKey: string, value: unknown) => {
    if (typeof value === "string") return { storeKey, name: value, path: "", verified: false, payoutSourced: false };
    const record = (value ?? {}) as { name?: string; path?: string; verified?: boolean };
    return { storeKey, name: record.name ?? "", path: record.path ?? "", verified: Boolean(record.verified), payoutSourced: false };
  };
  const canonicalEntries = documentLabels.map(({ key, label }) => {
    const storeKey = rawDocuments[label] !== undefined ? label : key;
    return [label, normalizeDoc(storeKey, rawDocuments[label] ?? rawDocuments[key])] as const;
  });
  const knownKeys = new Set(documentLabels.flatMap(({ key, label }) => [key, label]));
  const extraEntries = Object.entries(rawDocuments)
    .filter(([key]) => !knownKeys.has(key))
    .map(([key, value]) => [key, normalizeDoc(key, value)] as const);
  const bankFromPayout =
    settings && (settings.payout_document || settings.payout_document_name)
      ? {
          name: settings.payout_document_name || "Bank document",
          path: settings.payout_document || "",
          verified: settings.payout_status === "approved",
        }
      : null;
  const documentEntries = [...canonicalEntries, ...extraEntries].map(([label, doc]) => {
    if (label === "Bank details" && bankFromPayout) {
      return [label, { ...doc, ...bankFromPayout, payoutSourced: true }] as const;
    }
    return [label, doc] as const;
  });
  const warehouses = (Array.isArray(application?.warehouses) ? application?.warehouses : []) as Warehouse[];
  const totalSales = orders.reduce((sum, order) => sum + Number(order.order_value || 0), 0);
  const salesCurrency = orders[0]?.currency ?? settings?.default_currency ?? "";
  const liveProducts = products.filter((product) => product.status === "active" && product.is_active).length;
  const activeListings = products.filter((product) => product.status === "active").length;
  const pendingListings = products.filter((product) => product.status === "pending").length;

  return (
    <AdminShell
      title={application?.business_name || `${profile.first_name} ${profile.last_name}`.trim() || "Wholesaler"}
      subtitle={`${profile.email} · joined ${formatDate(profile.created_at)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={application?.status ?? "not submitted"} tone={statusTone[application?.status ?? ""] ?? "neutral"} />
          {backLink}
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Products listed" value={String(products.length)} hint={`${liveProducts} live`} />
        <Stat label="Orders received" value={String(orders.length)} hint={`${money(totalSales, salesCurrency)} total value`} />
        <Stat label="Payout requests" value={String(payouts.length)} hint={`${payouts.filter((row) => row.status === "requested").length} awaiting action`} />
        <Stat label="Payout details" value={settings?.payout_status ?? "not started"} hint={formatDate(settings?.payout_submitted_at)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Contact person">
          <div className="p-3">
            <Row label="Full name" value={`${profile.first_name} ${profile.last_name}`.trim()} />
            <Row label="Email" value={profile.email} />
            <Row label="Mobile" value={profile.mobile || application?.contact_mobile || ""} />
            <Row label="Account country" value={profile.country || application?.account_country || ""} />
            <Row label="Account created" value={formatDate(profile.created_at)} />
          </div>
        </Panel>

        <Panel title="Company details">
          <div className="p-3">
            <Row label="Business type" value={application?.business_type ?? ""} />
            <Row label="Legal / individual name" value={application?.business_name ?? ""} />
            <Row label="Trading name" value={application?.trading_name ?? ""} />
            <Row label="Website" value={application?.website ?? ""} />
            <Row label="City" value={application?.city ?? ""} />
            <Row label="Country" value={application?.country ?? ""} />
          </div>
        </Panel>

        <Panel title="Verification">
          <div className="p-3">
            <Row label="Status" value={application?.status ?? "not submitted"} />
            <Row label="Submitted" value={formatDate(application?.submitted_at)} />
            <Row label="Last reviewed" value={formatDate(application?.reviewed_at)} />
            <Row label="Documents provided" value={`${documentEntries.filter(([, doc]) => doc.name).length}/${documentEntries.length || 0}`} />
            <Row label="Review notes" value={application?.review_notes ?? ""} />
          </div>
        </Panel>
      </div>

      <Panel title="Finance details">
        <div className="grid gap-3 p-3 lg:grid-cols-2">
          <div>
            <Row label="Payout status" value={settings?.payout_status ?? "not started"} />
            <Row label="Account holder" value={settings?.bank_account_name ?? ""} />
            <Row label="Bank name" value={settings?.bank_name ?? ""} />
            <Row label="IBAN" value={settings?.bank_iban ?? ""} />
            <Row label="Default currency" value={settings?.default_currency ?? ""} />
            <Row label="Minimum order value" value={settings ? String(settings.min_order_value) : ""} />
          </div>
          <div>
            <Row label="Submitted" value={formatDate(settings?.payout_submitted_at)} />
            <Row label="Reviewed" value={formatDate(settings?.payout_reviewed_at)} />
            <Row label="Review notes" value={settings?.payout_review_notes ?? ""} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {settings?.payout_document ? (
                <button
                  type="button"
                  disabled={openingDoc === "bank"}
                  onClick={() => openDocument("bank", settings.payout_document)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {openingDoc === "bank" ? "Opening…" : `View bank document${settings.payout_document_name ? ` · ${settings.payout_document_name}` : ""}`}
                </button>
              ) : (
                <p className="text-[11px] font-semibold text-muted-foreground">No bank document attached yet.</p>
              )}
              <Link
                to="/partners/admin/payouts"
                className="inline-flex h-8 items-center rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Review payout details
              </Link>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={`Uploaded documents (${documentEntries.filter(([, doc]) => doc.name).length}/${documentEntries.length || 0})`}>
        <div className="grid gap-2.5 p-3 sm:grid-cols-2">
          {documentEntries.length === 0 && (
            <p className="text-xs text-muted-foreground">No documents on record for this wholesaler.</p>
          )}
          {documentEntries.map(([label, doc]) => (
            <div key={label} className="flex items-start gap-2.5 rounded-card border border-border bg-secondary/40 p-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${doc.name ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {doc.name ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                  {doc.name && <StatusPill label={doc.verified ? "Verified" : "Not verified"} tone={doc.verified ? "positive" : "warning"} />}
                </div>
                <p className={`mt-0.5 break-all text-xs ${doc.name ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>
                  {doc.name || "Not provided"}
                </p>
                {doc.name && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!doc.path || openingDoc === label}
                      onClick={() => openDocument(label, doc.path)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {openingDoc === label ? "Opening…" : doc.path ? "View document" : "File not stored"}
                    </button>
                    {doc.payoutSourced ? (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Bank document — approval is managed under Payout details.
                      </span>
                    ) : (
                    <button
                      type="button"
                      disabled={verify.isPending || !applicationId}
                      onClick={() => verify.mutate({ storeKey: doc.storeKey, verified: !doc.verified })}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                        doc.verified
                          ? "border border-border bg-background text-muted-foreground hover:border-destructive hover:text-destructive"
                          : "bg-primary text-primary-foreground shadow-button"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {doc.verified ? "Undo verification" : "Mark verified"}
                    </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {docError && <p className="text-[11px] font-semibold text-destructive sm:col-span-2">{docError}</p>}
        </div>
      </Panel>

      {application && (
        <Panel title="Verification decision">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Review notes (shared with the wholesaler)"
              className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {application.status === "approved" ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary">
                <Check className="h-3.5 w-3.5" /> Approved
              </span>
            ) : (
              <>
                <button
                  type="button"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate("approved")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate("rejected")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/5 px-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </>
            )}
          </div>
        </Panel>
      )}

      <Panel title={`Warehouses (${warehouses.length})`}>
        {warehouses.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No warehouse locations on record.</p>
        ) : (
          <TableWrap>
            <thead className="bg-secondary/60">
              <tr><Th>#</Th><Th>Country</Th><Th>City</Th><Th>Address</Th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {warehouses.map((warehouse, index) => (
                <tr key={index}>
                  <Td strong>{index + 1}</Td>
                  <Td>{warehouse.country || "—"}</Td>
                  <Td>{warehouse.city || "—"}</Td>
                  <Td>{warehouse.address || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title={`Listings (${products.length})`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-primary">{products.length}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {products.length === 0 ? "No listings yet" : `${products.length} listing${products.length === 1 ? "" : "s"} submitted`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pendingListings > 0 ? `${pendingListings} waiting for approval · ` : ""}{activeListings} approved
              </p>
            </div>
          </div>
          {products.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/partners/admin/products"
                search={{ supplier: id }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                View all listings
              </Link>
              {activeListings > 0 && (
                <Link
                  to="/partners/admin/live-products"
                  search={{ supplier: id }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  View live listings ({activeListings})
                </Link>
              )}
            </div>
          )}
        </div>
      </Panel>

      <Panel title={`Orders (${orders.length})`}>
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Reference</Th><Th>Products</Th><Th>Buyer country</Th><Th align="right">Qty</Th><Th align="right">Value</Th><Th>Status</Th><Th>Date</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.slice(0, 15).map((order) => (
              <tr key={order.id}>
                <Td strong>{order.reference || "—"}</Td>
                <Td>{order.product_summary || "—"}</Td>
                <Td>{order.buyer_country || "—"}</Td>
                <Td align="right">{order.quantity}</Td>
                <Td align="right">{money(Number(order.order_value), order.currency)}</Td>
                <Td>{order.status}</Td>
                <Td>{formatDate(order.created_at)}</Td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><Td>No orders yet.</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td><Td align="right">—</Td><Td>—</Td><Td>—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title={`Payout requests (${payouts.length})`}>
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Date</Th><Th align="right">Amount</Th><Th>Status</Th><Th>Note</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payouts.slice(0, 10).map((payout) => (
              <tr key={payout.id}>
                <Td>{formatDate(payout.created_at)}</Td>
                <Td align="right" strong>{money(Number(payout.amount), payout.currency)}</Td>
                <td className="px-3 py-2.5"><StatusPill label={payout.status} tone={statusTone[payout.status] ?? "neutral"} /></td>
                <Td>{payout.note || "—"}</Td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><Td>No payout requests yet.</Td><Td align="right">—</Td><Td>—</Td><Td>—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title="Payout details activity (last 10)">
        <TableWrap>
          <thead className="bg-secondary/60">
            <tr><Th>Date</Th><Th>Activity</Th><Th>Status</Th><Th>Bank / IBAN</Th><Th>Note</Th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payoutHistory.map((entry) => (
              <tr key={entry.id}>
                <Td>{formatDate(entry.created_at)}</Td>
                <Td strong>{entry.action}</Td>
                <td className="px-3 py-2.5"><StatusPill label={entry.status} tone={statusTone[entry.status] ?? "neutral"} /></td>
                <Td>{[entry.bank_name, entry.bank_iban].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>{entry.note || "—"}</Td>
              </tr>
            ))}
            {payoutHistory.length === 0 && (
              <tr><Td>No payout detail activity yet.</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </AdminShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-border bg-background p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black capitalize text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
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
