import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, MapPin, Percent, RefreshCw } from "lucide-react";
import { listShopifyLocationsForConnection, updateShopifySettings } from "@/lib/shopify.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

export type ShopifySetupValues = {
  locationId: string;
  locationName?: string;
  market: "sa" | "ae";
  currency: string;
  safetyStock: number;
  pricingRules: { type: "percent"; value: number; perMarket: { sa?: number; ae?: number } };
};

type ShopifyLocation = { id: string; name: string; isActive: boolean; fulfillsOnlineOrders: boolean };

export function ShopifySetupWizard({ connection, busy, onSave }: { connection: any; busy: boolean; onSave: (values: ShopifySetupValues) => void }) {
  const loadLocations = useServerFn(listShopifyLocationsForConnection);
  const [locations, setLocations] = useState<ShopifyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string>(connection.location_id ?? "");
  const [market, setMarket] = useState<"sa" | "ae">((connection.market as "sa" | "ae") ?? "sa");
  const [currency, setCurrency] = useState(connection.currency ?? "SAR");
  const [safety, setSafety] = useState(String(connection.safety_stock ?? 0));
  const pricing = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const perMarket = (pricing["perMarket"] ?? {}) as Record<string, number>;
  const [markup, setMarkup] = useState(String(perMarket[market] ?? (pricing["value"] as number) ?? 15));

  const [loadError, setLoadError] = useState<string>("");
  const [newToken, setNewToken] = useState("");
  const saveSettings = useServerFn(updateShopifySettings);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const result = await loadLocations({ data: { id: connection.id } });
      setLoadError("");
      setLocations(result.locations as ShopifyLocation[]);
      if (!locationId) {
        const preferred = result.locations.find((entry: ShopifyLocation) => entry.isActive) ?? result.locations[0];
        if (preferred) setLocationId(preferred.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Shopify locations could not be loaded";
      setLoadError(message);
      setLocations([]);
      toast.error(message);
    } finally { setLoading(false); }
  };

  const saveToken = async () => {
    if (newToken.trim().length < 20) return toast.error("Paste the Admin API access token that starts with shpat_.");
    setLoading(true);
    try {
      await saveSettings({ data: { id: connection.id, accessToken: newToken.trim() } });
      setNewToken("");
      toast.success("Token saved — checking your store again.");
      await fetchLocations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The token could not be saved");
      setLoading(false);
    }
  };

  useEffect(() => { void fetchLocations(); }, [connection.id]);


  const chosen = locations.find((entry) => entry.id === locationId);
  const canSave = Boolean(locationId) && Number(markup) >= 0;

  const submit = () => {
    if (!locationId) return toast.error("Choose the Shopify location we should keep stocked.");
    onSave({
      locationId,
      locationName: chosen?.name ?? "",
      market,
      currency: currency.toUpperCase(),
      safetyStock: Number(safety) || 0,
      pricingRules: { type: "percent", value: Number(markup) || 0, perMarket: { [market]: Number(markup) || 0 } },
    });
  };

  return <div className="mx-auto max-w-3xl space-y-5">
    <Card className="border-primary/30">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Lock className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="font-semibold">Finish your Shopify setup</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose where your stock sits, which country you sell in, and your profit markup. The workspace opens as soon as you save.</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Stock location</CardTitle><Button variant="outline" size="sm" disabled={loading} onClick={fetchLocations}><RefreshCw /> Refresh</Button></div></CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading your Shopify locations…</p>
          : loadError ? <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">{loadError}</p>
            <p className="text-xs text-muted-foreground">Create the app inside your store admin: Settings → Apps and sales channels → Develop apps → Create an app → tick the product, inventory, location, order and fulfilment permissions → Install app → copy the Admin API access token (it starts with shpat_). A Client ID or secret from dev.shopify.com will not work here.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input type="password" value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="shpat_…" autoComplete="new-password" />
              <Button onClick={saveToken} disabled={loading}>Save token and retry</Button>
            </div>
          </div>
          : locations.length === 0 ? <p className="text-sm text-muted-foreground">No locations found on this store.</p>

            : <div className="divide-y">{locations.map((location) => <label key={location.id} className="flex cursor-pointer items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-3">
                <input type="radio" name="shopify-location" checked={locationId === location.id} onChange={() => setLocationId(location.id)} />
                <span><span className="block text-sm font-medium">{location.name}</span></span>
              </span>
              <Badge variant={location.isActive ? "default" : "secondary"}>{location.isActive ? "Active" : "Inactive"}</Badge>
            </label>)}</div>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Percent className="h-4 w-4" /> Selling country and profit</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Country</Label><Select value={market} onValueChange={(value: "sa" | "ae") => setMarket(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sa">Saudi Arabia</SelectItem><SelectItem value="ae">United Arab Emirates</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="shopify-currency">Currency</Label><Input id="shopify-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="shopify-markup">Default markup %</Label><Input id="shopify-markup" type="number" min="0" value={markup} onChange={(e) => setMarkup(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="shopify-safety">Safety stock kept back</Label><Input id="shopify-safety" type="number" min="0" value={safety} onChange={(e) => setSafety(e.target.value)} /></div>
      </CardContent>
    </Card>

    <div className="flex justify-end"><Button disabled={!canSave || busy} onClick={submit}>Save and open workspace</Button></div>
  </div>;
}
