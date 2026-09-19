import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";

import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatusPill, Tabs } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/admin/applications/")({
  head: () => ({
    meta: [
      { title: `Wholesaler Applications | ${brandConfig.name}` },
      { name: "description", content: "Review submitted wholesaler applications, check documents and approve or reject each business." },
      { property: "og:title", content: `Wholesaler Applications | ${brandConfig.name}` },
      { property: "og:description", content: "Approve or reject wholesaler registrations with full company and document detail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

const tabs = ["Pending", "Rejected", "All"] as const;
const statusTone: Record<string, string> = { pending: "warning", approved: "positive", rejected: "danger" };

type Warehouse = { country?: string; city?: string; address?: string };

function ApplicationsPage() {
  const [tab, setTab] = useState<string>("Pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("wl_applications")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return rows;
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: "approved" | "rejected"; note: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("wl_applications")
        .update({
          status,
          review_notes: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  const rows = (data ?? []).filter((row) => tab === "All" || row.status === tab.toLowerCase());

  return (
    <AdminShell
      title="Pending applications"
      subtitle="Registrations waiting for a decision. Approved businesses move to Wholesalers."
      actions={<Tabs items={tabs} value={tab} onChange={setTab} />}
    >
      {isLoading && <Panel title="Loading"><p className="px-3 py-4 text-xs text-muted-foreground">Fetching applications…</p></Panel>}

      {!isLoading && rows.length === 0 && (
        <Panel title={`${tab} applications`}>
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No {tab.toLowerCase()} applications right now.</p>
        </Panel>
      )}

      {rows.map((row) => {
        const documents = (row.documents ?? {}) as Record<string, unknown>;
        const warehouses = (Array.isArray(row.warehouses) ? row.warehouses : []) as Warehouse[];
        const note = notes[row.id] ?? row.review_notes ?? "";
        return (
          <Panel
            key={row.id}
            title={row.business_name || "Unnamed business"}
            action={
              <div className="flex min-w-0 items-center gap-2">
                <StatusPill label={row.status} tone={statusTone[row.status] ?? "neutral"} />
                <Link
                  to="/partners/admin/suppliers/$id"
                  params={{ id: row.user_id }}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  View details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            }
          >

            <div className="grid gap-3 p-3 lg:grid-cols-3">
              <div className="rounded-card border border-border bg-secondary/40 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Contact</p>
                <Row label="Name" value={row.contact_name} />
                <Row label="Email" value={row.contact_email} />
                <Row label="Mobile" value={row.contact_mobile} />
                <Row label="Account country" value={row.account_country} />
              </div>
              <div className="rounded-card border border-border bg-secondary/40 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Business</p>
                <Row label="Type" value={row.business_type} />
                <Row label="Trading name" value={row.trading_name} />
                <Row label="Website" value={row.website} />
                <Row label="Location" value={[row.city, row.country].filter(Boolean).join(", ")} />
              </div>
              <div className="rounded-card border border-border bg-secondary/40 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Documents</p>
                {Object.keys(documents).length === 0 && <p className="text-[11px] text-muted-foreground">No documents provided.</p>}
                {Object.entries(documents).map(([key, value]) => {
                  const detail =
                    value && typeof value === "object"
                      ? String((value as { name?: string }).name ?? "Uploaded")
                      : String(value ?? "");
                  return <Row key={key} label={key} value={detail} />;
                })}
                <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Warehouses</p>
                {warehouses.length === 0 && <p className="text-[11px] text-muted-foreground">None listed.</p>}
                {warehouses.map((warehouse, index) => (
                  <Row key={index} label={`#${index + 1}`} value={[warehouse.city, warehouse.country, warehouse.address].filter(Boolean).join(" · ")} />
                ))}
              </div>
            </div>

            <div className="grid gap-2 border-t border-border p-3 sm:flex sm:flex-wrap sm:items-center">
              <input
                value={note}
                onChange={(event) => setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))}
                placeholder="Review notes (shared with the wholesaler)"
                className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-9 sm:text-xs"
              />
              {row.status === "approved" ? (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary">
                  <Check className="h-3.5 w-3.5" /> Approved
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: row.id, status: "approved", note })}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:opacity-50 sm:h-9"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: row.id, status: "rejected", note })}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/5 px-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 sm:h-9"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </>
              )}
            </div>
          </Panel>
        );
      })}
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-3 py-1 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-foreground">{value || "—"}</span>
    </div>
  );
}
