import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { AuthShell, Field, Notice, SubmitButton } from "@/components/partners/AuthShell";
import { brandConfig } from "@/config/partnerBrand";
import { readUserRoles } from "@/hooks/partners/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { hasConsoleAccess } from "@/lib/partners/permissions";
import { SUPPLIER_ORIGIN } from "@/lib/siteHosts";


export const Route = createFileRoute("/partners/signin")({
  head: () => ({
    meta: [
      { title: `Sign In — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Sign in to your wholesale account to manage products, inventory, orders and payouts across the GCC." },
      { property: "og:title", content: `Sign In — ${brandConfig.name}` },
      { property: "og:description", content: "Access your supplier portal to manage listings, orders and settlements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: `${SUPPLIER_ORIGIN}/partners/signin` }],
  }),

  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell
      eyebrow="Supplier Portal"
      title="Sign in to your account"
      subtitle="Manage your products, inventory, orders and payouts in one workspace."
      footer={
        <>
          New to {brandConfig.name}?{" "}
          <Link to="/partners/signup" className="font-bold text-primary">Join as a Wholesaler</Link>
        </>
      }
    >
      <form
        className="space-y-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const email = String(data.get("business-email") ?? "").trim();
          const password = String(data.get("password") ?? "");
          setError("");
          setBusy(true);
          const { data: result, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          setBusy(false);
          if (signInError || !result.user) {
            setError(signInError?.message ?? "We could not sign you in. Check your email and password.");
            return;
          }
          const roles = await readUserRoles(result.user.id);
          if (hasConsoleAccess(roles)) {
            navigate({ to: "/partners/admin", replace: true });
            return;
          }
          if (roles.includes("supplier")) {
            navigate({ to: "/partners/dashboard", replace: true });
            return;
          }
          // Shopper / dropshipping account: signed in, but no wholesale access yet.
          navigate({ to: "/partners/join", replace: true });
        }}
      >
        <Field label="Business Email" type="email" placeholder="you@company.com" autoComplete="email" />
        <Field label="Password" type="password" placeholder="••••••••" autoComplete="current-password" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" /> Keep me signed in
          </label>
          <Link to="/partners/forgot-password" className="text-[11px] font-bold text-primary">Forgot password?</Link>
        </div>
        <SubmitButton>{busy ? "Signing in…" : "Sign In"} <ArrowRight className="h-4 w-4" /></SubmitButton>
      </form>
      {error && <Notice>{error}</Notice>}
    </AuthShell>
  );
}

