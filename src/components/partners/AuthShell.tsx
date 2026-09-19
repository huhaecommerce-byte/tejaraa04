import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { brandConfig } from "@/config/partnerBrand";
import heroImage from "@/assets/partners/hero-gcc-logistics.jpg";

const supplierHighlights = ["Wholesale & distribution supply", "E-commerce sales channels", "Saudi & Gulf markets"];

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`inline-flex items-center ${inverse ? "rounded-lg bg-background/95 px-3 py-1.5 shadow-card" : ""}`}>
      <BrandLogo variant="storefront" />
    </div>
  );
}

const proofPoints = [
  { icon: Globe2, text: "Sell across 6 GCC markets and internationally" },
  { icon: BadgeCheck, text: "Verified wholesaler network buyers trust" },
  { icon: ShieldCheck, text: "Secure, compliant and built for growth" },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="supplier-theme min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <aside className="hero-surface relative hidden overflow-hidden text-primary-foreground lg:block">
          <img
            src={heroImage}
            alt="GCC wholesale distribution network with trucks leaving a warehouse hub and Gulf city skylines connected by trade routes"
            width={1408}
            height={1024}
            className="hero-photo pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div className="hero-photo-tint pointer-events-none absolute inset-0" />
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
          <div className="relative z-10 flex h-full flex-col justify-between p-7">
            <Link to="/"><BrandMark inverse /></Link>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-hero-soft">Bigger opportunities. A stronger GCC together.</p>
              <h2 className="text-[2rem] font-extrabold leading-[1.05]">Your Inventory.<br />More Markets.<br /><span className="text-hero-accent">More Buyers.</span></h2>
              <ul className="mt-4 space-y-2">
                {proofPoints.map((point) => (
                  <li key={point.text} className="flex items-center gap-2 text-xs font-medium text-primary-foreground/85">
                    <point.icon className="h-4 w-4 shrink-0 text-hero-accent" />
                    {point.text}
                  </li>
                ))}
              </ul>
              <p className="script-note mt-4 text-lg text-hero-accent">From your warehouse to the whole GCC and beyond</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {supplierHighlights.map((item) => (
                <div key={item} className="rounded-card border border-primary-foreground/20 bg-primary-foreground/10 p-2.5">
                  <p className="text-[11px] font-bold leading-4">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex flex-col px-4 py-4 sm:px-8 lg:py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="lg:hidden"><BrandMark /></Link>
          </div>
          <div className="flex flex-1 items-center justify-center py-6">
            <div className="w-full max-w-md">
              <Link to="/" className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5">
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
              <h1 className="mt-1.5 text-2xl font-extrabold">{title}</h1>
              <p className="mt-1 mb-5 text-xs text-muted-foreground">{subtitle}</p>
              <div className="mt-5">{children}</div>
              <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">{footer}</div>
            </div>
          </div>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-2 text-[11px] text-muted-foreground">
            {["Secure & Compliant", "Verified Businesses Only", "GCC Wide"].map((item) => (
              <span key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{item}</span>
            ))}
          </p>
        </main>
      </div>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
  hint,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = label.toLowerCase().replaceAll(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-bold text-foreground">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <button
      type="submit"
      disabled={!ready}
      className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:opacity-70"
    >
      {children}
    </button>
  );
}


export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-border bg-accent/50 px-3 py-2 text-[11px] leading-4 text-primary">{children}</p>
  );
}
