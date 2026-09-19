import { createFileRoute } from "@tanstack/react-router";
import { Check, FileText, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/partners/AdminShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/partners/admin/payouts")({
  head: () => ({
    meta: [
      { title: `Payout Details Review — ${brandConfig.name} Admin` },
      { name: "description", content: "Review and approve supplier bank and payout details with their supporting documents." },
      { property: "og:title", content: `Payout Details Review — ${brandConfig.name}` },
      { property: "og:description", content: "Approve supplier settlement details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPayoutsPage,
});

type Settings = Database["public"]["Tables"]["wl_settings"]["Row"];

type Row = Settings & { company: string; contact: string; email: string };

type HistoryRow = {
  id: string;
  supplier_id: string;
  action: string;
  status: string;
  bank_name: string;
  bank_iban: string;
  document_name: string;
  note: string;
  created_at: string;
};

const historyActionLabel: Record<string, string> = {
  submitted: "Details submitted",
  resubmitted: "Details updated and resubmitted",
  approved: "Approved",
  rejected: "Rejected",
};

const tabs = ["pending", "approved", "rejected"] as const;

const pillClass: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success-foreground",
  rejected: "bg-destructive/10 text-destructive",
  draft: "bg-secondary text-muted-foreground",
};

function AdminPayoutsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<(typeof tabs)[number]>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Record<string, HistoryRow[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: settings, error } = await supabase
      .from("wl_settings")
      .select("*")
      .neq("payout_status", "draft")
      .order("payout_submitted_at", { ascending: false });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    const ids = (settings ?? []).map((row) => row.supplier_id);
    const [profilesRes, appsRes] = await Promise.all([
      ids.length ? supabase.from("wl_partner_profiles").select("id, first_name, last_name, email").in("id", ids) : Promise.resolve({ data: [] as never[] }),
      ids.length ? supabase.from("wl_applications").select("user_id, business_name, trading_name, contact_name").in("user_id", ids) : Promise.resolve({ data: [] as never[] }),
    ]);
    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const apps = new Map((appsRes.data ?? []).map((a) => [a.user_id, a]));
    setRows(
      (settings ?? []).map((row) => {
        const profile = profiles.get(row.supplier_id);
        const app = apps.get(row.supplier_id);
        return {
          ...row,
          company: app?.business_name || app?.trading_name || "Company not set",
          contact: app?.contact_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—",
          email: profile?.email ?? "",
        };
      }),
    );
    const { data: events } = ids.length
      ? await supabase
          .from("wl_payout_detail_history")
          .select("id, supplier_id, action, status, bank_name, bank_iban, document_name, note, created_at")
          .in("supplier_id", ids)
          .order("created_at", { ascending: false })
      : { data: [] as HistoryRow[] };
    const grouped: Record<string, HistoryRow[]> = {};
    for (const event of events ?? []) {
      (grouped[event.supplier_id] ??= []).push(event);
    }
    setHistory(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDocument(path: string) {
    if (!path) { setMessage("No document was attached with these details."); return; }
    const { data, error } = await supabase.storage.from("partner-documents").createSignedUrl(path, 600);
    if (error || !data) { setMessage("We could not open this document."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function review(row: Row, status: "approved" | "rejected") {
    if (status === "rejected" && !(notes[row.supplier_id] ?? "").trim()) {
      setMessage("Add a note so the supplier knows what to correct.");
      return;
    }
    setBusy(row.supplier_id);
    const { error } = await supabase
      .from("wl_settings")
      .update({
        payout_status: status,
        payout_review_notes: (notes[row.supplier_id] ?? "").trim(),
        payout_reviewed_at: new Date().toISOString(),
      })
      .eq("supplier_id", row.supplier_id);
    if (!error) {
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("wl_payout_detail_history").insert({
        supplier_id: row.supplier_id,
        actor_id: auth.user?.id ?? null,
        action: status,
        status,
        bank_account_name: row.bank_account_name,
        bank_name: row.bank_name,
        bank_iban: row.bank_iban,
        document_path: row.payout_document,
        document_name: row.payout_document_name,
        note: (notes[row.supplier_id] ?? "").trim(),
      });
    }
    setBusy("");
    setMessage(error ? error.message : status === "approved" ? "Payout details approved and saved." : "Payout details rejected.");
    if (!error) void load();
  }

  const visible = rows.filter((row) => row.payout_status === tab);

  return (
    <AdminShell title="Payout Details" subtitle="Verify supplier bank details and their supporting document before they are saved.">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`h-9 rounded-xl px-3 text-xs font-bold capitalize transition-colors ${tab === item ? "bg-primary text-primary-foreground shadow-button" : "border border-border bg-card text-muted-foreground hover:text-primary"}`}
          >
            {item} ({rows.filter((row) => row.payout_status === item).length})
          </button>
        ))}
      </div>

      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <div className="space-y-3">
        {visible.map((row) => (
          <section key={row.supplier_id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold">{row.company}</h2>
                <p className="text-[11px] text-muted-foreground">{row.contact}{row.email ? ` · ${row.email}` : ""}</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${pillClass[row.payout_status] ?? pillClass["draft"]}`}>
                {row.payout_status}
              </span>
            </div>

            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-2.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Account holder</dt>
                <dd className="mt-0.5 text-xs font-bold">{row.bank_account_name || "—"}</dd>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Bank</dt>
                <dd className="mt-0.5 text-xs font-bold">{row.bank_name || "—"}</dd>
              </div>
              <div className="rounded-xl border border-border bg-background p-2.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">IBAN</dt>
                <dd className="mt-0.5 text-xs font-bold">{row.bank_iban || "—"}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void openDocument(row.payout_document)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold hover:border-primary hover:text-primary"
              >
                <FileText className="h-4 w-4" /> {row.payout_document_name || "View document"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                Submitted {row.payout_submitted_at ? new Date(row.payout_submitted_at).toLocaleString() : "—"}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <textarea
                rows={2}
                value={notes[row.supplier_id] ?? row.payout_review_notes}
                onChange={(event) => setNotes({ ...notes, [row.supplier_id]: event.target.value })}
                placeholder="Review note for the supplier (required when rejecting)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <div className="flex flex-wrap gap-2">
                {row.payout_status === "approved" ? (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-success/15 px-3 text-xs font-bold text-success-foreground">
                    <Check className="h-4 w-4" /> Approved &amp; saved
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy === row.supplier_id}
                    onClick={() => void review(row, "approved")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-button disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> {busy === row.supplier_id ? "Saving…" : "Approve & save"}
                  </button>
                )}
                {row.payout_status === "rejected" ? (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-destructive/10 px-3 text-xs font-bold text-destructive">
                    <X className="h-4 w-4" /> Rejected
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy === row.supplier_id}
                    onClick={() => void review(row, "rejected")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-destructive/40 px-3 text-xs font-bold text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border bg-background p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Payout details history</p>
              <ul className="mt-2 space-y-1.5">
                {(history[row.supplier_id] ?? []).map((event) => (
                  <li key={event.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    <span className="font-bold">{new Date(event.created_at).toLocaleString()}</span>
                    <span className="text-muted-foreground">{historyActionLabel[event.action] ?? event.action}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${pillClass[event.status] ?? pillClass["draft"]}`}>{event.status}</span>
                    {event.bank_name && <span className="text-muted-foreground">{event.bank_name} · {event.bank_iban}</span>}
                    {event.document_name && <span className="text-muted-foreground">{event.document_name}</span>}
                    {event.note && <span className="text-muted-foreground">“{event.note}”</span>}
                  </li>
                ))}
                {(history[row.supplier_id] ?? []).length === 0 && (
                  <li className="text-[11px] text-muted-foreground">No recorded activity yet.</li>
                )}
              </ul>
            </div>
          </section>
        ))}
        {visible.length === 0 && (
          <p className="rounded-2xl border border-border bg-card px-3 py-8 text-center text-xs text-muted-foreground shadow-card">
            {loading ? "Loading payout details…" : `No ${tab} payout details.`}
          </p>
        )}
      </div>
    </AdminShell>
  );
}
