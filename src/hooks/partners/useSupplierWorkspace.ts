import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SupplierApplication = Database["public"]["Tables"]["wl_applications"]["Row"];
export type SupplierProfile = Database["public"]["Tables"]["wl_partner_profiles"]["Row"];
export type SupplierProduct = Database["public"]["Tables"]["wl_products"]["Row"];
export type SupplierOrder = Database["public"]["Tables"]["wl_orders"]["Row"];
export type SupplierSettings = Database["public"]["Tables"]["wl_settings"]["Row"];
export type PayoutRequest = Database["public"]["Tables"]["wl_payout_requests"]["Row"];

export type DocumentEntry = {
  key: string;
  label: string;
  provided: boolean;
  verified: boolean;
  name: string;
  path: string;
  source?: "payout" | undefined;
  status?: string | undefined;
};

export const documentLabels: { key: string; label: string }[] = [
  { key: "trade_licence", label: "Trade licence / CR" },
  { key: "vat_certificate", label: "VAT certificate" },
  { key: "owner_id", label: "Owner / authorized person ID" },
  { key: "brand_authorization", label: "Brand authorization" },
  { key: "bank_details", label: "Bank details" },
];

export const salesChannelNames = ["Our Storefront", "B2B Buyers", "API Integrations"] as const;

export type SupplierWorkspace = {
  loading: boolean;
  userId: string | null;
  email: string;
  profile: SupplierProfile | null;
  application: SupplierApplication | null;
  products: SupplierProduct[];
  orders: SupplierOrder[];
  settings: SupplierSettings | null;
  payouts: PayoutRequest[];
  documents: DocumentEntry[];
  companyName: string;
  contactName: string;
  currency: string;
  refresh: () => void;
};

function readDocuments(
  application: SupplierApplication | null,
  settings: SupplierSettings | null = null,
): DocumentEntry[] {
  const raw = (application?.documents ?? {}) as Record<string, unknown>;
  return documentLabels.map(({ key, label }) => {
    if (key === "bank_details" && settings && (settings.payout_document || settings.payout_document_name)) {
      return {
        key,
        label,
        provided: true,
        verified: settings.payout_status === "approved",
        name: settings.payout_document_name || "Bank document",
        path: settings.payout_document || "",
        source: "payout" as const,
        status: settings.payout_status,
      };
    }
    const value = raw[key] ?? raw[label];
    const base = key === "bank_details" ? { source: "payout" as const, status: settings?.payout_status } : {};
    if (!value) return { key, label, provided: false, verified: false, name: "", path: "", ...base };
    if (typeof value === "string") return { key, label, provided: true, verified: false, name: value, path: "", ...base };
    const obj = value as { name?: string; path?: string; verified?: boolean };
    return {
      key,
      label,
      provided: Boolean(obj.name || obj.path),
      verified: Boolean(obj.verified),
      name: obj.name ?? "",
      path: obj.path ?? "",
      ...base,
    };
  });
}

const emptyState: Omit<SupplierWorkspace, "refresh"> = {
  loading: true,
  userId: null,
  email: "",
  profile: null,
  application: null,
  products: [],
  orders: [],
  settings: null,
  payouts: [],
  documents: readDocuments(null),
  companyName: "",
  contactName: "",
  currency: "",
};

export function useSupplierWorkspace(): SupplierWorkspace {
  const [state, setState] = useState(emptyState);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!active) return;
      if (!user) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const [profileRes, applicationRes, productsRes, ordersRes, settingsRes, payoutsRes] = await Promise.all([
        supabase.from("wl_partner_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("wl_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("wl_products").select("*").eq("supplier_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wl_orders").select("*").eq("supplier_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wl_settings").select("*").eq("supplier_id", user.id).maybeSingle(),
        supabase.from("wl_payout_requests").select("*").eq("supplier_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (!active) return;
      const profile = profileRes.data ?? null;
      const application = applicationRes.data ?? null;
      const products = productsRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const settings = settingsRes.data ?? null;

      setState({
        loading: false,
        userId: user.id,
        email: user.email ?? "",
        profile,
        application,
        products,
        orders,
        settings,
        payouts: payoutsRes.data ?? [],
        documents: readDocuments(application, settings),
        companyName: application?.business_name || application?.trading_name || "",
        contactName:
          application?.contact_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          user.email ||
          "",
        currency: settings?.default_currency || orders[0]?.currency || products[0]?.currency || "",
      });
    })();

    return () => {
      active = false;
    };
  }, [tick]);

  return { ...state, refresh };
}

export async function ensureSupplierSettings(supplierId: string) {
  const { data } = await supabase.from("wl_settings").select("*").eq("supplier_id", supplierId).maybeSingle();
  if (data) return data;
  const { data: created } = await supabase
    .from("wl_settings")
    .insert({ supplier_id: supplierId })
    .select("*")
    .maybeSingle();
  return created ?? null;
}
