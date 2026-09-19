import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Eye, FileText, ShieldCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { GhostButton, Panel, StatCard, StatusPill, SupplierShell } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/verification")({
  head: () => ({
    meta: [
      { title: `Verification — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Track your verification progress, view or replace submitted business documents and see reviewer notes." },
      { property: "og:title", content: `Verification — ${brandConfig.name}` },
      { property: "og:description", content: "Verification status and documents for GCC wholesalers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const { application, documents, userId, loading, refresh } = useSupplierWorkspace();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const warehouses = Array.isArray(application?.warehouses) ? (application?.warehouses as unknown[]) : [];
  const submitted = documents.filter((doc) => doc.provided).length;
  const verified = documents.filter((doc) => doc.verified).length;

  async function openDocument(path: string) {
    const { data, error } = await supabase.storage.from("partner-documents").createSignedUrl(path, 600);
    if (error || !data) { setMessage("This document could not be opened."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function upload(key: string, label: string, file: File) {
    if (!userId || !application) return;
    setBusy(key);
    setMessage("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${userId}/${Date.now()}-${key}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("partner-documents")
      .upload(path, file, file.type ? { contentType: file.type } : undefined);
    if (uploadError) { setBusy(""); setMessage(uploadError.message); return; }
    const current = { ...((application.documents ?? {}) as Record<string, unknown>) };
    delete current[key];
    const next = { ...current, [label]: { name: file.name, path, verified: false } };
    const { error } = await supabase
      .from("wl_applications")
      .update({
        documents: next as never,
        status: "pending",
        review_notes: "",
        reviewed_at: null,
        reviewed_by: null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", application.id);
    setBusy("");
    setMessage(
      error
        ? error.message
        : "Document uploaded. Your account is back under review — our admin team will approve the change.",
    );
    if (!error) refresh();
  }

  return (
    <SupplierShell title="Verification" subtitle="Your verification progress and the business documents on file.">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Account Status"
          value={application?.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : "Not submitted"}
          note={application ? `Submitted ${new Date(application.submitted_at).toLocaleDateString()}` : "Complete registration first"}
          icon={ShieldCheck}
        />
        <StatCard label="Documents Submitted" value={`${submitted}/${documents.length}`} note="Required business documents" icon={FileText} />
        <StatCard label="Documents Verified" value={`${verified}/${documents.length}`} note="Confirmed by our team" icon={BadgeCheck} />
        <StatCard label="Warehouses" value={String(warehouses.length)} note="Registered locations" icon={ShieldCheck} />
      </div>

      {!application && !loading && (
        <p className="rounded-card border border-border bg-card px-3 py-3 text-xs text-muted-foreground">
          You have not submitted a registration yet.{" "}
          <Link to="/partners/join" className="font-bold text-primary">Complete registration</Link>
        </p>
      )}

      {application?.review_notes && (
        <p className="rounded-card border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] font-semibold text-warning">
          Reviewer notes: {application.review_notes}
        </p>
      )}

      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <Panel
        title="Business documents"
        action={
          <span className="text-[11px] font-semibold text-muted-foreground">
            Every upload or replacement is sent to our admin team for approval
          </span>
        }
      >
        <ul className="divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.key} className="flex flex-wrap items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">{doc.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {doc.name
                    ? doc.path
                      ? doc.name
                      : `${doc.name} — file not stored, please re-upload to enable viewing`
                    : doc.source === "payout"
                      ? "Add it with your payout details"
                      : "No file on record"}
                </p>
              </div>
              <StatusPill
                label={
                  doc.source === "payout"
                    ? doc.status === "approved"
                      ? "Verified"
                      : doc.status === "pending"
                        ? "Submitted"
                        : doc.status === "rejected"
                          ? "Rejected"
                          : doc.provided
                            ? "Submitted"
                            : "Missing"
                    : doc.verified
                      ? "Verified"
                      : doc.provided
                        ? "Submitted"
                        : "Missing"
                }
                tone={
                  doc.source === "payout"
                    ? doc.status === "approved"
                      ? "positive"
                      : doc.status === "rejected"
                        ? "danger"
                        : doc.provided
                          ? "info"
                          : "neutral"
                    : doc.verified
                      ? "positive"
                      : doc.provided
                        ? "info"
                        : "neutral"
                }
              />
              <div className="flex items-center gap-2">
                {doc.path && (
                  <GhostButton onClick={() => openDocument(doc.path)}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </GhostButton>
                )}
                {doc.source === "payout" ? (
                  <Link to="/partners/finance">
                    <GhostButton>{doc.provided ? "Manage in Finance" : "Add in Finance"}</GhostButton>
                  </Link>
                ) : (
                  application && (
                    <>
                      <input
                        ref={(element) => { inputs.current[doc.key] = element; }}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void upload(doc.key, doc.label, file);
                        }}
                      />
                      <GhostButton onClick={() => inputs.current[doc.key]?.click()} disabled={busy === doc.key}>
                        <Upload className="h-3.5 w-3.5" /> {busy === doc.key ? "Uploading…" : doc.provided ? "Replace" : "Upload"}
                      </GhostButton>
                    </>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Registered warehouses">
        <ul className="divide-y divide-border">
          {warehouses.map((item, index) => {
            const warehouse = item as { name?: string; city?: string; country?: string; address?: string; contact?: string };
            return (
              <li key={index} className="px-3 py-3">
                <p className="text-xs font-bold">{warehouse.name || `Warehouse ${index + 1}`}</p>
                <p className="text-[11px] text-muted-foreground">
                  {[warehouse.address, warehouse.city, warehouse.country].filter(Boolean).join(", ") || "No address on record"}
                </p>
              </li>
            );
          })}
          {warehouses.length === 0 && (
            <li className="px-3 py-8 text-center text-xs text-muted-foreground">{loading ? "Loading…" : "No warehouses on record."}</li>
          )}
        </ul>
      </Panel>
    </SupplierShell>
  );
}
