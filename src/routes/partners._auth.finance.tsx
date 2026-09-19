import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CircleDollarSign, FileText, Pencil, Send, Upload, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Field, GhostButton, lockedInputClass, Panel, PrimaryButton, StatCard, StatusPill, SupplierShell, TableWrap, Td, Th, inputClass } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { ensureSupplierSettings, useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/finance")({
  head: () => ({
    meta: [
      { title: `Finance & Payouts — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "See settled sales, request a payout and keep your bank and settlement details up to date." },
      { property: "og:title", content: `Finance & Payouts — ${brandConfig.name}` },
      { property: "og:description", content: "Payouts and settlement for GCC wholesalers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinancePage,
});

const payoutTone: Record<string, string> = { requested: "warning", approved: "info", paid: "positive", rejected: "danger" };
const detailTone: Record<string, string> = { draft: "neutral", pending: "warning", approved: "positive", rejected: "danger" };
const detailLabel: Record<string, string> = {
  draft: "Not submitted",
  pending: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
};

type DetailHistory = {
  id: string;
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
  approved: "Approved by admin",
  rejected: "Rejected by admin",
};

function FinancePage() {
  const { orders, payouts, settings, userId, currency, loading, refresh } = useSupplierWorkspace();
  const [bank, setBank] = useState({ bank_name: "", bank_iban: "", bank_account_name: "" });
  const [doc, setDoc] = useState({ path: "", name: "" });
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"request" | "details">("request");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<DetailHistory[]>([]);
  const [historyPage, setHistoryPage] = useState(1);

  const PAGE_SIZE = 10;
  const sortedPayouts = [...payouts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const pageCount = Math.max(1, Math.ceil(sortedPayouts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagePayouts = sortedPayouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [payouts.length]);

  useEffect(() => {
    if (!settings) return;
    setBank({ bank_name: settings.bank_name, bank_iban: settings.bank_iban, bank_account_name: settings.bank_account_name });
    setDoc({ path: settings.payout_document, name: settings.payout_document_name });
  }, [settings]);

  const loadHistory = useCallback(async (supplierId: string) => {
    const { data } = await supabase
      .from("wl_payout_detail_history")
      .select("id, action, status, bank_name, bank_iban, document_name, note, created_at")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });
    setHistory(data ?? []);
  }, []);

  useEffect(() => {
    if (userId) void loadHistory(userId);
  }, [userId, settings?.payout_status, settings?.payout_submitted_at, loadHistory]);

  const historyPageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const historyCurrent = Math.min(historyPage, historyPageCount);
  const pageHistory = history.slice((historyCurrent - 1) * PAGE_SIZE, historyCurrent * PAGE_SIZE);
  useEffect(() => { setHistoryPage(1); }, [history.length]);

  const detailStatus = settings?.payout_status ?? "draft";
  const locked = !editing && (detailStatus === "pending" || detailStatus === "approved");

  const delivered = orders.filter((order) => order.status === "Delivered");
  const earned = delivered.reduce((sum, order) => sum + Number(order.order_value), 0);
  const inTransit = orders
    .filter((order) => ["Confirmed", "Processing", "Ready to Ship", "Shipped"].includes(order.status))
    .reduce((sum, order) => sum + Number(order.order_value), 0);
  const requested = payouts
    .filter((payout) => payout.status !== "rejected")
    .reduce((sum, payout) => sum + Number(payout.amount), 0);
  const available = Math.max(0, earned - requested);

  async function uploadDocument(file: File) {
    if (!userId) return;
    if (file.size > 20 * 1024 * 1024) { setMessage("Please choose a file smaller than 20MB."); return; }
    setSaving(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/payout-details/${Date.now()}-${safe}`;
    const { error } = await supabase.storage
      .from("partner-documents")
      .upload(path, file, file.type ? { contentType: file.type } : undefined);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setDoc({ path, name: file.name });
    setMessage(`"${file.name}" attached. Submit for approval to send it to our finance team.`);
  }

  async function openDocument() {
    if (!doc.path) return;
    const { data, error } = await supabase.storage.from("partner-documents").createSignedUrl(doc.path, 600);
    if (error || !data) { setMessage("This document could not be opened."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function submitBank() {
    if (!userId) return;
    if (!bank.bank_account_name.trim() || !bank.bank_name.trim() || !bank.bank_iban.trim()) {
      setMessage("Account holder name, bank name and IBAN are all required.");
      return;
    }
    if (!doc.path) { setMessage("Please attach a supporting document (bank letter or IBAN certificate)."); return; }
    setSaving(true);
    const ensured = await ensureSupplierSettings(userId);
    if (!ensured) {
      setSaving(false);
      setMessage("We could not open your finance record. Please reload the page and try again.");
      return;
    }
    const { data: updated, error } = await supabase
      .from("wl_settings")
      .update({
        ...bank,
        payout_document: doc.path,
        payout_document_name: doc.name,
        payout_status: "pending",
        payout_review_notes: "",
        payout_submitted_at: new Date().toISOString(),
        payout_reviewed_at: null,
      })
      .eq("supplier_id", userId)
      .select("supplier_id");
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    if (!updated || updated.length === 0) {
      setMessage("Your payout details could not be saved. Please reload the page and try again.");
      return;
    }
    await supabase.from("wl_payout_detail_history").insert({
      supplier_id: userId,
      actor_id: userId,
      action: detailStatus === "draft" ? "submitted" : "resubmitted",
      status: "pending",
      bank_account_name: bank.bank_account_name.trim(),
      bank_name: bank.bank_name.trim(),
      bank_iban: bank.bank_iban.trim(),
      document_path: doc.path,
      document_name: doc.name,
    });
    setEditing(false);
    setMessage("Payout details submitted. They will be saved once our admin team approves them.");
    void loadHistory(userId);
    refresh();
  }

  async function requestPayout() {
    if (!userId) return;
    if (detailStatus !== "approved") { setMessage("Your payout details must be approved before you can request a payout."); return; }
    const value = Number(amount);
    if (!value || value <= 0) { setMessage("Enter the amount you want to withdraw."); return; }
    if (value > available) { setMessage(`You can request up to ${currency} ${available.toLocaleString()}.`); return; }
    setSaving(true);
    const { error } = await supabase.from("wl_payout_requests").insert({ supplier_id: userId, amount: value, currency });
    setSaving(false);
    setAmount("");
    setMessage(error ? error.message : "Payout requested. Our finance team will review it.");
    if (!error) refresh();
  }

  return (
    <SupplierShell
      title="Finance"
      subtitle="Settled sales, payout requests and the bank details we settle to."
      actions={<PrimaryButton onClick={requestPayout} disabled={saving || loading || detailStatus !== "approved"}><Wallet className="h-4 w-4" /> Request Payout</PrimaryButton>}
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Available Balance" value={available ? `${currency} ${available.toLocaleString()}` : "—"} note="Delivered orders, minus requests" icon={Wallet} />
        <StatCard label="Delivered Sales" value={earned ? `${currency} ${earned.toLocaleString()}` : "—"} note={`${delivered.length} delivered orders`} icon={CircleDollarSign} />
        <StatCard label="In Fulfillment" value={inTransit ? `${currency} ${inTransit.toLocaleString()}` : "—"} note="Settles once delivered" icon={Banknote} />
        <StatCard label="Payout Requests" value={String(payouts.length)} note="All time" icon={Wallet} />
      </div>

      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <div className="flex w-fit gap-1 rounded-[12px] border border-border bg-secondary/40 p-1">
        <button
          type="button"
          onClick={() => setTab("request")}
          className={tab === "request"
            ? "rounded-[9px] border border-border bg-background px-4 py-2 text-xs font-semibold text-primary shadow-sm"
            : "rounded-[9px] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"}
        >
          Request a payout
        </button>
        <button
          type="button"
          onClick={() => setTab("details")}
          className={tab === "details"
            ? "flex items-center gap-2 rounded-[9px] border border-border bg-background px-4 py-2 text-xs font-semibold text-primary shadow-sm"
            : "flex items-center gap-2 rounded-[9px] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"}
        >
          Payout details
          <StatusPill label={detailLabel[detailStatus] ?? detailStatus} tone={detailTone[detailStatus] ?? "neutral"} />
        </button>
      </div>

      {tab === "request" ? (
        <>
          <Panel title="Request a payout">
            <div className="space-y-3 p-3">
              {detailStatus !== "approved" ? (
                <p className="rounded-card border border-border bg-secondary/40 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  {detailStatus === "pending"
                    ? "Your payout details are awaiting admin approval. You can request a payout once they are approved."
                    : detailStatus === "rejected"
                      ? "Your payout details were rejected. Update them and submit again before requesting a payout."
                      : "Fill in and submit your payout details first. You can request a payout once they are approved by our team."}
                </p>
              ) : (
                <>
                  <Field label={`Amount (${currency})`} hint={`Available now: ${currency} ${available.toLocaleString()}`}>
                    <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} placeholder="0.00" />
                  </Field>
                  <GhostButton onClick={requestPayout} disabled={saving}>Submit request</GhostButton>
                </>
              )}
            </div>
          </Panel>

          <Panel title="Payout history" action={<span className="text-[11px] font-semibold text-muted-foreground">Showing last {Math.min(PAGE_SIZE, sortedPayouts.length)} of {sortedPayouts.length}</span>}>
            <TableWrap>
              <thead className="border-b border-border bg-secondary/50">
                <tr><Th>Requested</Th><Th align="right">Amount</Th><Th>Status</Th><Th>Note</Th></tr>
              </thead>
              <tbody>
                {pagePayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-border last:border-0">
                    <Td strong>{new Date(payout.created_at).toLocaleDateString()}</Td>
                    <Td align="right" strong>{payout.currency} {Number(payout.amount).toLocaleString()}</Td>
                    <Td><StatusPill label={payout.status} tone={payoutTone[payout.status] ?? "neutral"} /></Td>
                    <Td>{payout.note || "—"}</Td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-muted-foreground">{loading ? "Loading payouts…" : "No payout requests yet."}</td></tr>
                )}
              </tbody>
            </TableWrap>
            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Page {currentPage} of {pageCount}
                </p>
                <div className="flex gap-1.5">
                  <GhostButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</GhostButton>
                  <GhostButton onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}>Next</GhostButton>
                </div>
              </div>
            )}
          </Panel>
        </>
        ) : (
        <>
          <Panel title="Payout details" action={<StatusPill label={detailLabel[detailStatus] ?? detailStatus} tone={detailTone[detailStatus] ?? "neutral"} />}>
            <div className="space-y-3 p-3">
              {detailStatus === "rejected" && settings?.payout_review_notes && (
                <p className="rounded-card border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive">
                  Admin note: {settings.payout_review_notes}
                </p>
              )}
              {locked && (
                <p className="text-[11px] text-muted-foreground">
                  {detailStatus === "approved"
                    ? "These details are approved and saved. Use Edit to change them — the update needs admin approval again."
                    : "Submitted for admin approval. Use Edit if you need to correct anything."}
                </p>
              )}
              <Field label="Account holder name *">
                <input className={locked ? lockedInputClass : inputClass} readOnly={locked} value={bank.bank_account_name} onChange={(event) => setBank({ ...bank, bank_account_name: event.target.value })} />
              </Field>
              <Field label="Bank name *">
                <input className={locked ? lockedInputClass : inputClass} readOnly={locked} value={bank.bank_name} onChange={(event) => setBank({ ...bank, bank_name: event.target.value })} />
              </Field>
              <Field label="IBAN *">
                <input className={locked ? lockedInputClass : inputClass} readOnly={locked} value={bank.bank_iban} onChange={(event) => setBank({ ...bank, bank_iban: event.target.value })} />
              </Field>
              <Field label="Supporting document *" hint="Bank letter or IBAN certificate showing the account holder name (PDF or image, up to 20MB).">
                <div className="flex flex-wrap items-center gap-2">
                  {doc.path ? (
                    <GhostButton onClick={openDocument}><FileText className="h-4 w-4" /> {doc.name || "View document"}</GhostButton>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">No document attached yet.</span>
                  )}
                  {!locked && (
                    <GhostButton onClick={() => fileRef.current?.click()} disabled={saving}>
                      <Upload className="h-4 w-4" /> {doc.path ? "Replace file" : "Attach file"}
                    </GhostButton>
                  )}
                </div>
              </Field>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadDocument(file);
                }}
              />
              {locked ? (
                <PrimaryButton onClick={() => { setEditing(true); setMessage(""); }}><Pencil className="h-4 w-4" /> Edit details</PrimaryButton>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton onClick={submitBank} disabled={saving}><Send className="h-4 w-4" /> Submit for approval</PrimaryButton>
                  {editing && <GhostButton onClick={() => {
                    setEditing(false);
                    if (settings) {
                      setBank({ bank_name: settings.bank_name, bank_iban: settings.bank_iban, bank_account_name: settings.bank_account_name });
                      setDoc({ path: settings.payout_document, name: settings.payout_document_name });
                    }
                    setMessage("");
                  }}>Cancel</GhostButton>}
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Payout details history" action={<span className="text-[11px] font-semibold text-muted-foreground">{history.length} record{history.length === 1 ? "" : "s"}</span>}>
            <TableWrap>
              <thead className="border-b border-border bg-secondary/50">
                <tr><Th>Date</Th><Th>Activity</Th><Th>Status</Th><Th>Bank / IBAN</Th><Th>Document</Th><Th>Note</Th></tr>
              </thead>
              <tbody>
                {pageHistory.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <Td strong>{new Date(item.created_at).toLocaleString()}</Td>
                    <Td>{historyActionLabel[item.action] ?? item.action}</Td>
                    <Td><StatusPill label={detailLabel[item.status] ?? item.status} tone={detailTone[item.status] ?? "neutral"} /></Td>
                    <Td>{[item.bank_name, item.bank_iban].filter(Boolean).join(" · ") || "—"}</Td>
                    <Td>{item.document_name || "—"}</Td>
                    <Td>{item.note || "—"}</Td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">No payout detail activity yet.</td></tr>
                )}
              </tbody>
            </TableWrap>
            {historyPageCount > 1 && (
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                <p className="text-[11px] font-semibold text-muted-foreground">Page {historyCurrent} of {historyPageCount}</p>
                <div className="flex gap-1.5">
                  <GhostButton onClick={() => setHistoryPage((p) => Math.max(1, p - 1))} disabled={historyCurrent === 1}>Previous</GhostButton>
                  <GhostButton onClick={() => setHistoryPage((p) => Math.min(historyPageCount, p + 1))} disabled={historyCurrent === historyPageCount}>Next</GhostButton>
                </div>
              </div>
            )}
          </Panel>
        </>
      )}

    </SupplierShell>
  );
}
