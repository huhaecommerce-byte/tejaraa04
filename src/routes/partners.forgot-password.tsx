import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { AuthShell, Field, Notice, SubmitButton } from "@/components/partners/AuthShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";
import { SUPPLIER_ORIGIN } from "@/lib/siteHosts";

export const Route = createFileRoute("/partners/forgot-password")({
  head: () => ({
    meta: [
      { title: `Reset Password — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Request a secure password reset link for your wholesale supplier account." },
      { property: "og:title", content: `Reset Password — ${brandConfig.name}` },
      { property: "og:description", content: "Request a secure password reset link for your supplier portal account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: `${SUPPLIER_ORIGIN}/partners/forgot-password` }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell
      eyebrow="Supplier Portal"
      title="Reset your password"
      subtitle="Enter your business email and we'll send you a secure link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/partners/signin" className="font-bold text-primary">Back to sign in</Link>
        </>
      }
    >
      {sentTo ? (
        <div className="rounded-xl border border-border bg-accent/40 p-4">
          <p className="text-sm font-bold text-foreground">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We sent a password reset link to <span className="font-semibold text-foreground">{sentTo}</span>. Follow the link to set a new password.
          </p>
          <button
            type="button"
            onClick={() => setSentTo("")}
            className="mt-3 text-[11px] font-bold text-primary"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form
          className="space-y-3.5"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const email = String(data.get("business-email") ?? "").trim();
            setError("");
            setBusy(true);
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            setBusy(false);
            if (resetError) {
              setError(resetError.message || "We could not send the reset link. Please try again.");
              return;
            }
            setSentTo(email);
          }}
        >
          <Field label="Business Email" type="email" placeholder="you@company.com" autoComplete="email" />
          <SubmitButton>{busy ? "Sending…" : "Send reset link"} <ArrowRight className="h-4 w-4" /></SubmitButton>
        </form>
      )}
      {error && <Notice>{error}</Notice>}
    </AuthShell>
  );
}
