import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Field, Panel, PrimaryButton, SupplierShell, inputClass } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { currencies } from "@/components/partners/ProductForm";
import { ensureSupplierSettings, useSupplierWorkspace } from "@/hooks/partners/useSupplierWorkspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/_auth/settings")({
  head: () => ({
    meta: [
      { title: `Settings — ${brandConfig.name} Supplier Portal` },
      { name: "description", content: "Set your default currency, low stock alert level and notification preferences." },
      { property: "og:title", content: `Settings — ${brandConfig.name}` },
      { property: "og:description", content: "Workspace preferences for GCC wholesalers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, userId, loading, refresh } = useSupplierWorkspace();
  const [form, setForm] = useState({
    default_currency: "",
    low_stock_threshold: "1",
    order_notifications: true,
    stock_notifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!settings) return;
    setForm({
      default_currency: settings.default_currency || "",
      low_stock_threshold: String(settings.low_stock_threshold ?? 1),
      order_notifications: settings.order_notifications,
      stock_notifications: settings.stock_notifications,
    });
  }, [settings]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    await ensureSupplierSettings(userId);
    const { error } = await supabase
      .from("wl_settings")
      .update({
        default_currency: form.default_currency,
        low_stock_threshold: Number(form.low_stock_threshold) || 1,
        order_notifications: form.order_notifications,
        stock_notifications: form.stock_notifications,
      })
      .eq("supplier_id", userId);
    setSaving(false);
    setMessage(error ? error.message : "Settings saved.");
    if (!error) refresh();
  }

  return (
    <SupplierShell
      title="Settings"
      subtitle="Workspace preferences and alerts."
      actions={<PrimaryButton onClick={save} disabled={saving || loading}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}</PrimaryButton>}
    >
      {message && <p className="rounded-card border border-border bg-accent/40 px-3 py-2 text-[11px] font-semibold text-primary">{message}</p>}

      <Panel title="Workspace preferences">
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          <Field label="Default currency" hint="Used for new listings and payout requests.">
            <select className={inputClass} value={form.default_currency} onChange={(event) => setForm({ ...form, default_currency: event.target.value })}>
              <option value="">Select currency</option>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </Field>
          <Field label="Low stock alert level" hint="We flag a product once its stock reaches this number.">
            <input type="number" min="0" className={inputClass} value={form.low_stock_threshold} onChange={(event) => setForm({ ...form, low_stock_threshold: event.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Notifications">
        <div className="space-y-2.5 p-3">
          <label className="flex items-center gap-2.5 rounded-card border border-border bg-secondary/40 p-2.5">
            <input type="checkbox" checked={form.order_notifications} onChange={(event) => setForm({ ...form, order_notifications: event.target.checked })} className="h-4 w-4 accent-primary" />
            <span className="text-xs font-bold">Alert me about new orders</span>
          </label>
          <label className="flex items-center gap-2.5 rounded-card border border-border bg-secondary/40 p-2.5">
            <input type="checkbox" checked={form.stock_notifications} onChange={(event) => setForm({ ...form, stock_notifications: event.target.checked })} className="h-4 w-4 accent-primary" />
            <span className="text-xs font-bold">Alert me when stock runs low</span>
          </label>
        </div>
      </Panel>
    </SupplierShell>
  );
}
