import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, ShieldCheck, ShoppingBag } from "lucide-react";
import { connectShopify } from "@/lib/shopify.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const PERMISSIONS = [
  "write_products / read_products",
  "write_inventory / read_inventory",
  "read_locations",
  "write_orders / read_orders",
  "write_merchant_managed_fulfillment_orders",
];

type Mode = "devDashboard" | "adminToken";

export function ShopifyConnectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const connect = useServerFn(connectShopify);
  const [busy, setBusy] = useState(false);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("devDashboard");
  const [form, setForm] = useState({ name: "Shopify Store", shopDomain: "", accessToken: "", clientId: "", clientSecret: "" });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const missingBasics = !form.name.trim() || !form.shopDomain.trim();
    const missingCreds = mode === "devDashboard"
      ? !form.clientId.trim() || !form.clientSecret.trim()
      : !form.accessToken.trim();
    if (missingBasics || missingCreds) {
      toast.error(mode === "devDashboard"
        ? "Add a name, your store address, the client ID and the client secret."
        : "Add a name, your store address and the access token.");
      return;
    }
    setBusy(true);
    try {
      const result = await connect({ data: {
        name: form.name.trim(),
        shopDomain: form.shopDomain.trim(),
        ...(mode === "devDashboard"
          ? { clientId: form.clientId.trim(), clientSecret: form.clientSecret.trim() }
          : { accessToken: form.accessToken.trim() }),
      } });
      if (!result.ok) toast.warning(result.error ?? "Saved, but Shopify could not verify these credentials.");
      else toast.success(`Connected to ${result.shopName}.`);
      setConnectedId(result.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Shopify could not be connected");
    } finally { setBusy(false); }
  };

  const openWorkspace = async () => {
    if (!connectedId) return;
    onOpenChange(false);
    setConnectedId(null);
    await navigate({ to: "/dropshipping/integrations/shopify/$connectionId", params: { connectionId: connectedId } });
  };

  const close = (next: boolean) => { if (!next) setConnectedId(null); onOpenChange(next); };

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      {connectedId ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><CheckCircle2 className="h-7 w-7 text-primary" /></div>
          <DialogHeader className="items-center">
            <DialogTitle>Shopify is connected</DialogTitle>
            <DialogDescription>Open the workspace to finish setup and start pushing products.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => close(false)}>Stay here</Button>
            <Button onClick={openWorkspace}>Open workspace <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShoppingBag className="h-5 w-5" /></div>
            <DialogTitle>Connect your Shopify store</DialogTitle>
            <DialogDescription>Choose how your app was created, then paste its credentials. Tejaraa encrypts them before storage.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "devDashboard" as Mode, title: "Dev Dashboard app", hint: "dev.shopify.com — client ID + secret" },
                { id: "adminToken" as Mode, title: "Store custom app", hint: "Settings → Develop apps — shpat_ token" },
              ]).map((option) => (
                <button key={option.id} type="button" onClick={() => setMode(option.id)}
                  className={cn("rounded-md border p-3 text-left transition", mode === option.id ? "border-primary bg-primary/5" : "hover:border-primary/40")}>
                  <p className="text-sm font-medium">{option.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{option.hint}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2"><Label htmlFor="shopify-name">Connection name</Label><Input id="shopify-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="shopify-domain">Store address</Label><Input id="shopify-domain" value={form.shopDomain} onChange={(e) => set("shopDomain", e.target.value)} placeholder="my-shop.myshopify.com" autoComplete="off" /></div>
            {mode === "devDashboard" ? (
              <>
                <div className="space-y-2"><Label htmlFor="shopify-client-id">Client ID</Label><Input id="shopify-client-id" value={form.clientId} onChange={(e) => set("clientId", e.target.value)} placeholder="From Dev Dashboard → your app → Settings → Credentials" autoComplete="off" /></div>
                <div className="space-y-2"><Label htmlFor="shopify-client-secret">Client secret</Label><Input id="shopify-client-secret" type="password" value={form.clientSecret} onChange={(e) => set("clientSecret", e.target.value)} placeholder="shpss_…" autoComplete="new-password" /></div>
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  Tejaraa exchanges these for an access token and renews it automatically — Shopify expires these tokens every 24 hours. Make sure the app is installed on this store and has the permissions below.
                </p>
              </>
            ) : (
              <div className="space-y-2"><Label htmlFor="shopify-token">Admin API access token</Label><Input id="shopify-token" type="password" value={form.accessToken} onChange={(e) => set("accessToken", e.target.value)} placeholder="shpat_…" autoComplete="new-password" /></div>
            )}
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium">Permissions the app needs</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{PERMISSIONS.map((permission) => <li key={permission}>• {permission}</li>)}</ul>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Credentials are encrypted before storage</span>
            <Button onClick={submit} disabled={busy}>{busy ? "Connecting…" : "Connect store"}</Button>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>;
}
