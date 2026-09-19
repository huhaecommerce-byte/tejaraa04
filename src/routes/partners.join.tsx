import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  
  FileText,
  Info,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/partners/AuthShell";
import { supabase } from "@/integrations/supabase/client";

import { brandConfig } from "@/config/partnerBrand";
import { SUPPLIER_ORIGIN } from "@/lib/siteHosts";

type JoinSearch = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  mobile?: string | undefined;
  step?: number | undefined;
};

export const Route = createFileRoute("/partners/join")({
  validateSearch: (search: Record<string, unknown>): JoinSearch => {
    const text = (key: string) => (typeof search[key] === "string" ? (search[key] as string) : undefined);
    const step = Number(search["step"]);
    return {
      ...(text("firstName") ? { firstName: text("firstName") } : {}),
      ...(text("lastName") ? { lastName: text("lastName") } : {}),
      ...(text("email") ? { email: text("email") } : {}),
      ...(text("mobile") ? { mobile: text("mobile") } : {}),
      ...(Number.isFinite(step) && step >= 1 && step <= 6 ? { step } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: `Join as a Wholesaler | ${brandConfig.name}` },
      {
        name: "description",
        content:
          "Register your wholesale, distribution or manufacturing business in six steps: account, company, documents, warehouse, business profile and review.",
      },
      { property: "og:title", content: `Join as a Wholesaler | ${brandConfig.name}` },
      {
        property: "og:description",
        content: "List your inventory once and sell across the GCC. Complete your wholesaler registration and get verified.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: `${SUPPLIER_ORIGIN}/partners/join` }],
  }),
  component: JoinPage,
});


const MARKETS = ["United Arab Emirates", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "International"];
const COUNTRY_DIAL_CODES: Record<string, string> = {
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  Kuwait: "+965",
  Qatar: "+974",
  Bahrain: "+973",
  Oman: "+968",
  International: "",
};
const MOBILE_PLACEHOLDERS: Record<string, string> = {
  "United Arab Emirates": "50 000 0000",
  "Saudi Arabia": "50 000 0000",
  Kuwait: "5000 0000",
  Qatar: "3000 0000",
  Bahrain: "3600 0000",
  Oman: "9200 0000",
  International: "Mobile number",
};
const BUSINESS_TYPES = ["Wholesaler", "Distributor", "Manufacturer", "Importer", "Individual / Freelancer"];
const COUNTRY_CITIES: Record<string, string[]> = {
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina", "Tabuk", "Abha", "Jubail"],
  Kuwait: ["Kuwait City", "Salmiya", "Hawally", "Farwaniya", "Fahaheel", "Jahra"],
  Qatar: ["Doha", "Al Rayyan", "Al Wakrah", "Lusail", "Al Khor", "Dukhan"],
  Bahrain: ["Manama", "Riffa", "Muharraq", "Hamad Town", "Isa Town", "Sitra"],
  Oman: ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Seeb", "Duqm"],
};

const STEPS = [
  { id: 1, title: "Account", caption: "Your login details", icon: UserRound },
  { id: 2, title: "Company", caption: "Legal business profile", icon: Building2 },
  { id: 3, title: "Business Documents", caption: "Licences & certificates", icon: FileText },
  { id: 4, title: "Warehouse", caption: "Where you store stock", icon: Warehouse },
  { id: 5, title: "Review & Submit", caption: "Confirm and send", icon: ShieldCheck },
] as const;

/* ---------- primitives (same design language as the rest of the platform) ---------- */

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15";

function Label({ children, htmlFor, optional }: { children: ReactNode; htmlFor: string; optional?: boolean | undefined }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-foreground">
      {children}
      {optional && <span className="font-semibold text-muted-foreground">(optional)</span>}
    </label>
  );
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
  optional,
  hint,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={name} optional={optional}>{label}</Label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly string[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} appearance-none pr-9`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  value,
  onChange,
  withLocation,
}: {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  withLocation?: boolean;
}) {
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("");

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote("Your browser does not support location detection.");
      return;
    }
    setLocating(true);
    setLocationNote("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange(`Pinned location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setLocationNote("Location pinned — edit the text to add building or street details.");
        setLocating(false);
      },
      () => {
        setLocationNote("Could not detect your location. Check browser permission and try again.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={name}>{label}</Label>
        {withLocation && (
          <button
            type="button"
            onClick={fetchLocation}
            disabled={locating}
            className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent/60 px-3 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-accent disabled:opacity-50"
          >
            <MapPin className="h-3.5 w-3.5" />
            {locating ? "Detecting…" : "Auto-fetch location by pin"}
          </button>
        )}
      </div>
      <textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {locationNote && <p className="mt-1 text-[10px] text-muted-foreground">{locationNote}</p>}
    </div>
  );
}

function UploadField({
  label,
  hint,
  optional,
  fileName,
  onFile,
}: {
  label: string;
  hint: string;
  optional?: boolean;
  fileName: string;
  onFile: (name: string, file: File | null) => void;
}) {
  const id = label.toLowerCase().replaceAll(/[^a-z]+/g, "-");
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-border bg-secondary/40 p-3.5 transition-colors hover:border-primary hover:bg-accent/50"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {fileName ? <CheckCircle2 className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          {label}
          {optional ? (
            <span className="font-semibold text-muted-foreground">(optional)</span>
          ) : (
            <span className="font-semibold text-destructive">*</span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{fileName || hint}</span>
      </span>
      <input
        id={id}
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onFile(file?.name ?? "", file);
        }}
      />
    </label>
  );
}



function PhoneField({
  country,
  dialCode,
  onDialCodeChange,
  value,
  onChange,
}: {
  country: string;
  dialCode: string;
  onDialCodeChange: (value: string) => void;
  value: string;
  onChange: (value: string) => void;
}) {
  const isInternational = country === "International" || country === "";
  return (
    <div>
      <Label htmlFor="mobile">Mobile Number</Label>
      <div className="flex gap-2">
        <div className="w-20 shrink-0">
          <input
            id="dialCode"
            name="dialCode"
            type="tel"
            readOnly={!isInternational}
            placeholder={isInternational ? "+00" : ""}
            value={dialCode}
            onChange={(event) => onDialCodeChange(event.target.value)}
            className={`${inputClass} px-2 text-center font-bold ${
              isInternational ? "" : "bg-secondary text-muted-foreground"
            }`}
            aria-label="Country dialling code"
          />
        </div>
        <div className="min-w-0 flex-1">
          <input
            id="mobile"
            name="mobile"
            type="tel"
            placeholder={MOBILE_PLACEHOLDERS[country] ?? "Mobile number"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {isInternational
          ? "Enter your own country dialling code, then your number."
          : `Country code set automatically for ${country}.`}
      </p>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

type ExtraWarehouse = { country: string; city: string; address: string };

function CityField({
  label,
  name,
  country,
  value,
  onChange,
}: {
  label: string;
  name: string;
  country: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const cities = country ? COUNTRY_CITIES[country] : undefined;
  if (cities) {
    return <SelectField label={label} name={name} options={cities} placeholder="Select city" value={value} onChange={onChange} />;
  }
  return (
    <TextField
      label={label}
      name={name}
      placeholder={country ? "Enter your city" : "Select a country first"}
      value={value}
      onChange={onChange}
    />
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-2 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <span className="break-words text-xs font-bold text-foreground sm:max-w-[60%] sm:text-right">{value || "—"}</span>
    </div>
  );
}

/* ---------- page ---------- */

type FormState = Record<string, string>;

function JoinPage() {
  const search = Route.useSearch();
  const prefilled = Boolean(search.firstName || search.email);
  const [step, setStep] = useState(search.step ?? (prefilled ? 2 : 1));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState<FormState>({
    firstName: search.firstName ?? "",
    lastName: search.lastName ?? "",
    email: search.email ?? "",
    mobile: search.mobile ?? "",
  });
  
  const [businessType, setBusinessType] = useState("");
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [extraWarehouses, setExtraWarehouses] = useState<ExtraWarehouse[]>([]);

  const setDoc = (key: string) => (name: string, file: File | null) => {
    setForm((prev) => ({ ...prev, [key]: name }));
    setDocFiles((prev) => ({ ...prev, [key]: file }));
  };


  const addWarehouse = () =>
    setExtraWarehouses((prev) => [...prev, { country: "", city: "", address: "" }]);
  const removeWarehouse = (index: number) =>
    setExtraWarehouses((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  const updateWarehouse = (index: number, key: keyof ExtraWarehouse) => (value: string) =>
    setExtraWarehouses((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: value, ...(key === "country" ? { city: "" } : null) }
          : item,
      ),
    );

  useEffect(() => {
    if (step !== 4) return;
    setForm((prev) => ({
      ...prev,
      whCountry: prev["whCountry"] || prev["country"] || "",
      whCity: prev["whCity"] || prev["city"] || "",
      whAddress: prev["whAddress"] || "",
    }));
  }, [step]);


  const set = (key: string) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleAccountCountry = (value: string) =>
    setForm((prev) => ({
      ...prev,
      accountCountry: value,
      dialCode: COUNTRY_DIAL_CODES[value] ?? "",
    }));

  const get = (key: string) => form[key] ?? "";

  const submitApplication = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      let { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        const email = get("email");
        const password = get("password");
        if (!email || !password) {
          setSubmitError("Please add your work email and password in step 1 so we can create your account.");
          return;
        }
        const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signedIn.user) {
          auth = { user: signedIn.user };
        } else if (signInError?.message?.toLowerCase().includes("email not confirmed")) {
          setSubmitError(
            "Your account needs email confirmation before we can save documents. Please open the confirmation link we emailed you, sign in, then return here to finish your application.",
          );
          return;
        } else if (signInError && !signInError.message?.toLowerCase().includes("invalid login")) {
          setSubmitError(signInError.message);
          return;
        } else {
          const { data: created, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: {
                first_name: get("firstName"),
                last_name: get("lastName"),
                mobile: `${get("dialCode")} ${get("mobile")}`.trim(),
                country: get("accountCountry"),
              },
            },
          });
          if (signUpError || !created.user) {
            setSubmitError(signUpError?.message ?? "We could not create your account. Please try again.");
            return;
          }
          if (!created.session) {
            setSubmitError(
              "Your account needs email confirmation before we can save documents. Please open the confirmation link we emailed you, sign in, then return here to finish your application.",
            );
            return;
          }
          auth = { user: created.user };
        }
      }

      const warehouses = [
        { country: get("whCountry"), city: get("whCity"), address: get("whAddress") },
        ...extraWarehouses,
      ].filter((item) => item.country || item.city || item.address);

      const documentLabels: Record<string, string> = {
        docLicense: "Trade licence / CR",
        docVat: "VAT certificate",
        docId: "Owner / authorized person ID",
        docBrand: "Brand authorization",
        docBank: "Bank details",
      };

      const documents: Record<string, { name: string; path: string; verified: boolean }> = {};
      for (const [key, label] of Object.entries(documentLabels)) {
        const name = get(key);
        if (!name) continue;
        let path = "";
        const file = docFiles[key];
        if (file) {
          const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]+/g, "-");
          const objectPath = `${auth.user.id}/${Date.now()}-${key}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("partner-documents")
            .upload(objectPath, file, { ...(file.type ? { contentType: file.type } : {}) });
          if (uploadError) {
            setSubmitError(`We could not upload "${file.name}". ${uploadError.message}`);
            return;
          }
          path = objectPath;
        }
        documents[label] = { name, path, verified: false };
      }

      const { error: insertError } = await supabase.from("wl_applications").insert({
        user_id: auth.user.id,
        status: "pending",
        contact_name: `${get("firstName")} ${get("lastName")}`.trim(),
        contact_email: get("email"),
        contact_mobile: `${get("dialCode")} ${get("mobile")}`.trim(),
        account_country: get("accountCountry"),
        business_type: businessType,
        business_name: get("legalName"),
        trading_name: get("tradingName"),
        website: get("website"),
        country: get("country"),
        city: get("city"),
        documents,
        warehouses,
      });


      if (insertError) {
        setSubmitError(insertError.message);
        return;
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };


  if (submitted) {
    return <VerificationPending name={get("firstName")} company={get("legalName")} />;
  }

  const active = STEPS[step - 1]!;

  return (
    <div className="supplier-theme min-h-screen bg-secondary/40 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-site items-center justify-between px-4 lg:px-8">
          <Link to="/partners"><BrandMark /></Link>
          <div className="flex items-center gap-4">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Already registered?{" "}
              <Link to="/partners/signin" className="font-bold text-primary hover:underline">Sign in</Link>
            </p>
            <Link to="/partners" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-site px-3 py-5 sm:px-4 sm:py-8 lg:px-8 lg:py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Wholesaler registration</p>
        <h1 className="mt-1.5 text-[1.75rem] font-extrabold leading-tight lg:text-[2rem]">
          Join {brandConfig.name} and sell across the GCC
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Six short steps. Once your business is verified you can list your inventory and start receiving orders from every
          sales channel.
        </p>

        <div className="mt-5 grid gap-4 lg:mt-7 lg:grid-cols-[280px_1fr] lg:gap-5">
          {/* Stepper */}
          <aside className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>Step {step} of {STEPS.length}</span>
                <span className="text-primary">{Math.round((step / STEPS.length) * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / STEPS.length) * 100}%` }} />
              </div>
            </div>
            <ol className="hidden space-y-1 pb-4 lg:block">
              {STEPS.map((item) => {
                const state = item.id === step ? "current" : item.id < step ? "done" : "todo";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setStep(item.id)}
                      className={`flex w-full items-center gap-3 rounded-card px-2.5 py-2 text-left transition-colors ${
                        state === "current" ? "bg-accent/70" : "hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${
                          state === "todo" ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : String(item.id).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-xs font-bold ${state === "current" ? "text-primary" : "text-foreground"}`}>
                          {item.title}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">{item.caption}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="hidden items-start gap-2 rounded-card border border-border bg-accent/50 px-3 py-2 text-[11px] leading-4 text-primary lg:flex" style={{ marginTop: "auto" }}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Verification usually completes within 2 business days.
            </p>
          </aside>

          {/* Form panel */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <active.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Step {String(step).padStart(2, "0")}
                </p>
                <p className="text-sm font-extrabold">{active.title}</p>
              </div>
            </div>

            {step === 1 && (
              <SectionCard
                title="Create your account"
                description={
                  prefilled
                    ? "Carried over from sign up — check the details and edit anything that needs changing."
                    : "This is how you will sign in to your supplier portal."
                }
              >

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="First Name" name="firstName" placeholder="Ahmed" value={get("firstName")} onChange={set("firstName")} />
                  <TextField label="Last Name" name="lastName" placeholder="Al Mansoori" value={get("lastName")} onChange={set("lastName")} />
                  <SelectField
                    label="Country"
                    name="accountCountry"
                    options={MARKETS}
                    placeholder="Select country"
                    value={get("accountCountry")}
                    onChange={handleAccountCountry}
                  />
                  <PhoneField
                    country={get("accountCountry")}
                    dialCode={get("dialCode")}
                    onDialCodeChange={set("dialCode")}
                    value={get("mobile")}
                    onChange={set("mobile")}
                  />
                  <TextField label="Work Email" name="email" type="email" placeholder="you@company.com" value={get("email")} onChange={set("email")} />
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    hint="Use 8+ characters with a number and a symbol."
                    value={get("password")}
                    onChange={set("password")}
                  />
                </div>
              </SectionCard>
            )}

            {step === 2 && (
              <SectionCard title="Company details" description="Enter the details exactly as they appear on your trade licence.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Country"
                    name="country"
                    options={MARKETS}
                    placeholder="Select country"
                    value={get("country")}
                    onChange={(value) => setForm((prev) => ({ ...prev, country: value, city: "" }))}
                  />
                  {get("country") && COUNTRY_CITIES[get("country")] ? (
                    <SelectField
                      label="City"
                      name="city"
                      options={COUNTRY_CITIES[get("country")]!}
                      placeholder="Select city"
                      value={get("city")}
                      onChange={set("city")}
                    />
                  ) : (
                    <TextField
                      label="City"
                      name="city"
                      placeholder={get("country") ? "Enter your city" : "Select a country first"}
                      value={get("city")}
                      onChange={set("city")}
                    />
                  )}
                  <SelectField label="Business Type" name="businessType" options={BUSINESS_TYPES} placeholder="Select business type" value={businessType} onChange={setBusinessType} />
                  <TextField
                    label={businessType === "Individual / Freelancer" ? "Individual Name" : "Business Name"}
                    name="legalName"
                    placeholder={businessType === "Individual / Freelancer" ? "Ahmed Al Mansoori" : "Gulf Trading LLC"}
                    value={get("legalName")}
                    onChange={set("legalName")}
                  />
                  <TextField label="Trading Name" name="tradingName" optional placeholder="Gulf Trading" value={get("tradingName")} onChange={set("tradingName")} />
                  <TextField label="Website" name="website" optional placeholder="www.company.com" value={get("website")} onChange={set("website")} />
                </div>
              </SectionCard>
            )}

            {step === 3 && (
              <SectionCard
                title="Business documents"
                description={
                  businessType === "Individual / Freelancer"
                    ? "As an Individual / Freelancer you only need to upload your personal ID. Clear PDF or image files."
                    : "Trade License / CR and Owner ID are mandatory. Clear PDF or image files — our verification team reviews every document."
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <UploadField
                    label="Trade License / CR"
                    optional={businessType === "Individual / Freelancer"}
                    hint={businessType === "Individual / Freelancer" ? "Upload if you have one" : "PDF or image, up to 10 MB"}
                    fileName={get("docLicense")}
                    onFile={setDoc("docLicense")}
                  />
                  <UploadField label="VAT Certificate" optional hint="PDF or image, up to 10 MB" fileName={get("docVat")} onFile={setDoc("docVat")} />
                  <UploadField label="Owner / Authorized Person ID" hint="Emirates ID, national ID or passport" fileName={get("docId")} onFile={setDoc("docId")} />
                  <UploadField label="Brand Authorization" optional hint="Needed if you distribute branded goods" fileName={get("docBrand")} onFile={setDoc("docBrand")} />
                  <UploadField label="Company Bank Document" optional hint="Can be added later before your first payout" fileName={get("docBank")} onFile={setDoc("docBank")} />
                </div>

              </SectionCard>
            )}

            {step === 4 && (
              <SectionCard title="Warehouse & storage" description="Tell us where your stock is held so we can plan fulfilment.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Warehouse Country"
                    name="whCountry"
                    options={MARKETS}
                    placeholder="Select country"
                    value={get("whCountry")}
                    onChange={(value) => setForm((prev) => ({ ...prev, whCountry: value, whCity: "" }))}
                  />
                  <CityField label="Warehouse City" name="whCity" country={get("whCountry")} value={get("whCity")} onChange={set("whCity")} />
                  
                  <TextAreaField label="Warehouse Address" name="whAddress" placeholder="Warehouse number, street, industrial area" value={get("whAddress")} onChange={set("whAddress")} withLocation />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Filled in from your company details — edit anything that is different for your warehouse.
                </p>

                {extraWarehouses.map((warehouse, index) => (
                  <div key={index} className="mt-5 rounded-card border border-border bg-secondary/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-foreground">Additional warehouse {index + 2}</p>
                      <button
                        type="button"
                        onClick={() => removeWarehouse(index)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-destructive hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Warehouse Country"
                        name={`extraCountry${index}`}
                        options={MARKETS}
                        placeholder="Select country"
                        value={warehouse.country}
                        onChange={updateWarehouse(index, "country")}
                      />
                      <CityField
                        label="Warehouse City"
                        name={`extraCity${index}`}
                        country={warehouse.country}
                        value={warehouse.city}
                        onChange={updateWarehouse(index, "city")}
                      />
                      <TextAreaField
                        label="Warehouse Address"
                        name={`extraAddress${index}`}
                        placeholder="Warehouse number, street, industrial area"
                        value={warehouse.address}
                        onChange={updateWarehouse(index, "address")}
                        withLocation
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addWarehouse}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-accent/60 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-accent"
                >
                  <Plus className="h-4 w-4" /> I have another warehouse (same or another country)
                </button>
              </SectionCard>
            )}

            {step === 5 && (
              <SectionCard title="Review & submit" description="Check your details, then send your application to our verification team.">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-card border border-border bg-secondary/40 p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Account</p>
                    <ReviewRow label="Name" value={`${get("firstName")} ${get("lastName")}`.trim()} />
                    <ReviewRow label="Email" value={get("email")} />
                    <ReviewRow label="Mobile" value={get("mobile")} />
                  </div>
                  <div className="rounded-card border border-border bg-secondary/40 p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Company</p>
                    <ReviewRow label="Legal name" value={get("legalName")} />
                    <ReviewRow label="Business type" value={businessType} />
                    <ReviewRow label="Country / city" value={[get("country"), get("city")].filter(Boolean).join(", ")} />
                  </div>
                  <div className="rounded-card border border-border bg-secondary/40 p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Documents</p>
                    <ReviewRow label="Trade licence / CR" value={get("docLicense") || "Not uploaded"} />
                    <ReviewRow label="VAT certificate" value={get("docVat") || "Not uploaded"} />
                    <ReviewRow label="Authorized person ID" value={get("docId") || "Not uploaded"} />
                  </div>
                  <div className="rounded-card border border-border bg-secondary/40 p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Warehouse & business</p>
                    <ReviewRow label="Warehouse" value={[get("whCity"), get("whCountry")].filter(Boolean).join(", ")} />
                  </div>
                </div>
                <label className="mt-4 flex items-start gap-2.5 rounded-card border border-border bg-accent/50 p-3.5 text-[11px] leading-4 text-primary">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
                  <span>
                    I confirm the information and documents provided are accurate and I accept the {brandConfig.name} supplier
                    terms and privacy policy.
                  </span>
                </label>
              </SectionCard>
            )}

            {submitError && (
              <p className="mt-5 rounded-card border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                {submitError}
              </p>
            )}

            {/* Navigation */}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.min(STEPS.length, current + 1))}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitApplication}
                  disabled={submitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit application"} <CheckCircle2 className="h-4 w-4" />

                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ---------- verification pending ---------- */

const VERIFICATION_TIMELINE = [
  { title: "Application received", caption: "We have your business details and documents.", done: true },
  { title: "Document verification", caption: "Our team is checking your licence, VAT and ID.", done: false },
  { title: "Account activation", caption: "Your supplier portal opens for product listing.", done: false },
];

function VerificationPending({ name, company }: { name: string; company: string }) {
  return (
    <div className="supplier-theme min-h-screen bg-secondary/40 text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-site items-center justify-between px-4 lg:px-8">
          <Link to="/partners"><BrandMark /></Link>
          <Link to="/partners" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-9">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Application submitted</p>
          <h1 className="mt-1.5 text-[1.75rem] font-extrabold leading-tight">Verification Pending</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Thank you{name ? `, ${name}` : ""}. Your application{company ? ` for ${company}` : ""} is being reviewed. We will
            email you as soon as your business is verified — usually within 2 business days.
          </p>

          <div className="mt-7 space-y-3 text-left">
            {VERIFICATION_TIMELINE.map((item, index) => (
              <div key={item.title} className="flex items-start gap-3 rounded-card border border-border bg-secondary/40 p-3.5">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${
                    item.done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {item.done ? <CheckCircle2 className="h-4 w-4" /> : String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-xs font-bold">{item.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{item.caption}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/partners/dashboard"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              Preview your supplier portal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/partners"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
