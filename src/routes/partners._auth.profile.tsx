import { createFileRoute } from "@tanstack/react-router";
import { Building2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Field, Panel, PrimaryButton, SupplierShell, inputClass } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/profile")({
  head: () => ({
    meta: [
      { title: `Company Profile — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Keep your contact person, mobile number and country up to date, and review the company details on your verified registration." },
      { property: "og:title", content: `Company Profile — ${brandConfig.name}` },
      { property: "og:description", content: "Company and contact details for GCC wholesalers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const countries = ["United Arab Emirates", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "International"];

function ProfilePage() {
  const { profile, application, userId, email, loading, refresh } = useSupplierWorkspace();
  const [form, setForm] = useState({ first_name: "", last_name: "", mobile: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      mobile: profile.mobile,
      country: profile.country,
    });
  }, [profile]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("wl_partner_profiles").update(form).eq("id", userId);
    setSaving(false);
    setMessage(error ? error.message : "Profile updated.");
    if (!error) refresh();
  }

  const company: { label: string; value: string }[] = [
    { label: "Business name", value: application?.business_name || "—" },
    { label: "Trading name", value: application?.trading_name || "—" },
    { label: "Business type", value: application?.business_type || "—" },
    { label: "Website", value: application?.website || "—" },
    { label: "Country", value: application?.country || "—" },
    { label: "City", value: application?.city || "—" },
    { label: "Contact email", value: application?.contact_email || email || "—" },
    { label: "Contact mobile", value: application?.contact_mobile || "—" },
  ];

  return (
    <SupplierShell
      title="Company Profile"
      subtitle="Your contact details and the company information on your registration."
      actions={<PrimaryButton onClick={save} disabled={saving || loading}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Profile"}</PrimaryButton>}
    >
      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <Panel title="Contact person">
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          <Field label="First name"><input className={inputClass} value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} /></Field>
          <Field label="Last name"><input className={inputClass} value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} /></Field>
          <Field label="Mobile"><input className={inputClass} value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></Field>
          <Field label="Country">
            <select className={inputClass} value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })}>
              <option value="">Select a country</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </Field>
          <Field label="Sign-in email" hint="Contact us to change the email on your account.">
            <input className={`${inputClass} bg-secondary/60`} value={email} readOnly />
          </Field>
        </div>
      </Panel>

      <Panel title="Company details" action={<span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> From your registration</span>}>
        <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {company.map((item) => (
            <div key={item.label} className="rounded-card border border-border bg-secondary/40 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 break-words text-xs font-bold">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-border px-3 py-2.5 text-[11px] font-medium text-muted-foreground">
          These details come from your verified registration and can't be edited here. For more changes, contact our team.
        </p>
      </Panel>
    </SupplierShell>
  );
}
