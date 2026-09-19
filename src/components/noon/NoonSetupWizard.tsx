import { useState } from "react";
import { CheckCircle2, Globe, Lock, Percent, RefreshCw, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

type Market = "sa" | "ae";
export type SetupValues = { markets: Market[]; warehouseIds: string[]; pricingRules: { type: "percent"; value: number; perMarket: { sa?: number; ae?: number } } };

const MARKETS: Array<{ value: Market; label: string }> = [
  { value: "sa", label: "Saudi Arabia (noon.com/saudi)" },
  { value: "ae", label: "United Arab Emirates (noon.com/uae)" },
];

export function NoonSetupWizard({ connection, warehouses, busy, onSyncWarehouses, onSave }: { connection: any; warehouses: any[]; busy: boolean; onSyncWarehouses: () => void; onSave: (values: SetupValues) => void }) {
  const pricing = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const [markets, setMarkets] = useState<Market[]>(((connection.enabled_markets as Market[]) ?? ["sa"]).filter((market) => market === "sa" || market === "ae"));
  const [warehouseIds, setWarehouseIds] = useState<string[]>(warehouses.filter((warehouse) => warehouse.enabled).map((warehouse) => warehouse.id));
  const perMarket = (pricing["perMarket"] ?? {}) as Record<string, number>;
  const [markupSa, setMarkupSa] = useState(String(perMarket["sa"] ?? (pricing["value"] as number) ?? 15));
  const [markupAe, setMarkupAe] = useState(String(perMarket["ae"] ?? (pricing["value"] as number) ?? 15));

  const [showInactive, setShowInactive] = useState(false);
  const visible = warehouses.filter((warehouse) => markets.includes(warehouse.market) && (showInactive || warehouse.noon_status === "active"));
  const inactiveCount = warehouses.filter((warehouse) => markets.includes(warehouse.market) && warehouse.noon_status !== "active").length;
  const missingMarkets = markets.filter((market) => !warehouses.some((warehouse) => warehouse.market === market && warehouseIds.includes(warehouse.id)));
  const markupOk = (!markets.includes("sa") || Number(markupSa) >= 0) && (!markets.includes("ae") || Number(markupAe) >= 0);
  const canSave = markets.length > 0 && warehouseIds.length > 0 && missingMarkets.length === 0 && markupOk;

  const submit = () => {
    if (!markets.length) return toast.error("Choose at least one country.");
    if (missingMarkets.length) return toast.error(`Choose a warehouse for ${missingMarkets.map((market) => market.toUpperCase()).join(" and ")}.`);
    const perMarketValues: { sa?: number; ae?: number } = {};
    if (markets.includes("sa")) perMarketValues.sa = Number(markupSa) || 0;
    if (markets.includes("ae")) perMarketValues.ae = Number(markupAe) || 0;
    onSave({ markets, warehouseIds, pricingRules: { type: "percent", value: perMarketValues.sa ?? perMarketValues.ae ?? 0, perMarket: perMarketValues } });
  };

  return <div className="mx-auto max-w-3xl space-y-5">
    <Card className="border-primary/30">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Lock className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="font-semibold">Finish your Noon setup</p>
          <p className="mt-1 text-sm text-muted-foreground">Your store is connected. Choose your countries, the warehouses you will ship from, and your profit settings. The Noon workspace opens as soon as you save.</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> 1. Countries you sell in</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {MARKETS.map((market) => <label key={market.value} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
          <Checkbox checked={markets.includes(market.value)} onCheckedChange={(checked) => setMarkets((current) => checked ? [...current, market.value] : current.filter((entry) => entry !== market.value))} />
          <span>{market.label}</span>
        </label>)}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base flex items-center gap-2"><Warehouse className="h-4 w-4" /> 2. Warehouses you will use</CardTitle><Button variant="outline" size="sm" disabled={busy} onClick={onSyncWarehouses}><RefreshCw /> Sync from Noon</Button></div></CardHeader>
      <CardContent className="space-y-3">
        {inactiveCount > 0 && <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={showInactive} onCheckedChange={(checked) => setShowInactive(checked === true)} /> Show {inactiveCount} inactive on Noon</label>}
        {visible.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No warehouses found for the selected countries yet — press “Sync from Noon”.</p> : <div className="divide-y">{visible.map((warehouse) => <div key={warehouse.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Switch checked={warehouseIds.includes(warehouse.id)} onCheckedChange={(checked) => setWarehouseIds((current) => checked ? [...current, warehouse.id] : current.filter((id) => id !== warehouse.id))} aria-label={`Use ${warehouse.warehouse_code}`} />
            <div><p className="text-sm font-medium">{warehouse.warehouse_name || warehouse.warehouse_code}</p><p className="text-xs text-muted-foreground">{warehouse.warehouse_code} · {String(warehouse.market).toUpperCase()} · {warehouse.processing_time}d processing</p></div>
          </div>
          <Badge variant={warehouse.noon_status === "active" ? "default" : "secondary"}>{warehouse.noon_status === "active" ? "Active on Noon" : "Inactive on Noon"}</Badge>
        </div>)}</div>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4" /> 3. Profit settings</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {markets.includes("sa") && <div className="space-y-2"><Label htmlFor="wiz-markup-sa">Saudi markup %</Label><Input id="wiz-markup-sa" type="number" min="0" value={markupSa} onChange={(e) => setMarkupSa(e.target.value)} /></div>}
        {markets.includes("ae") && <div className="space-y-2"><Label htmlFor="wiz-markup-ae">UAE markup %</Label><Input id="wiz-markup-ae" type="number" min="0" value={markupAe} onChange={(e) => setMarkupAe(e.target.value)} /></div>}
        {markets.length === 0 && <p className="text-sm text-muted-foreground">Choose your countries above first.</p>}
      </CardContent>
    </Card>

    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{canSave ? "All set — save to open your workspace." : "Complete all three steps to unlock the workspace."}</p>
      <Button disabled={!canSave || busy} onClick={submit}><CheckCircle2 /> Save and open workspace</Button>
    </div>
  </div>;
}
