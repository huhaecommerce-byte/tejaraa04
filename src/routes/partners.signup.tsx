import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthShell, Field, Notice, SubmitButton } from "@/components/partners/AuthShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";
import { SUPPLIER_ORIGIN } from "@/lib/siteHosts";


export const Route = createFileRoute("/partners/signup")({
  head: () => ({
    meta: [
      { title: `Join as a Wholesaler — ${brandConfig.name}` },
      { name: "description", content: "Create your wholesale account to list products, reach verified B2B buyers and expand across every GCC market." },
      { property: "og:title", content: `Join as a Wholesaler — ${brandConfig.name}` },
      { property: "og:description", content: "Register your business, get verified and start selling across the GCC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: `${SUPPLIER_ORIGIN}/partners/signup` }],
  }),

  component: SignUpPage,
});

const nextSteps = ["Company details", "Business documents", "Verification review"];

function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell
      eyebrow="Wholesaler Registration"
      title="Create your wholesale account"
      subtitle="Step 1 of 5 — start with your account details, then complete your company profile."
      footer={
        <>
          Already registered?{" "}
          <Link to="/partners/signin" className="font-bold text-primary">Sign in</Link>
        </>
      }
    >
      <form
        className="space-y-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const value = (key: string) => String(data.get(key) ?? "").trim();
          const firstName = value("first-name");
          const lastName = value("last-name");
          const email = value("business-email");
          const mobile = value("mobile-number");
          const password = String(data.get("password") ?? "");

          setError("");
          setBusy(true);
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { first_name: firstName, last_name: lastName, mobile },
            },
          });
          setBusy(false);

          if (signUpError) {
            setError(signUpError.message);
            return;
          }

          if (!signUpData.session) {
            setError(
              "Your account was created. We've emailed you a confirmation link — please confirm your email, then sign in to continue your supplier application.",
            );
            return;
          }

          navigate({
            to: "/partners/join",
            search: { firstName, lastName, email, mobile, step: 2 },
          });
        }}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="First Name" placeholder="Ahmed" autoComplete="given-name" />
          <Field label="Last Name" placeholder="Al Farsi" autoComplete="family-name" />
        </div>
        <Field label="Business Email" type="email" placeholder="you@company.com" autoComplete="email" />
        <Field label="Mobile Number" type="tel" placeholder="+971 50 000 0000" autoComplete="tel" />
        <Field label="Password" type="password" placeholder="Create a password" autoComplete="new-password" hint="Use at least 8 characters with a number." />
        <label className="flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary" />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        <SubmitButton>{busy ? "Creating account…" : "Continue"} <ArrowRight className="h-4 w-4" /></SubmitButton>
      </form>
      {error && <Notice>{error}</Notice>}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-muted-foreground">
        Next: {nextSteps.map((step) => (
          <span key={step} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary/60" />{step}</span>
        ))}
      </div>
    </AuthShell>
  );
}

