import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface Props {
  unitCostSar: number;
  defaultQty?: number;
}

export const ProfitCalculator = ({ unitCostSar, defaultQty = 1 }: Props) => {
  const [open, setOpen] = useState(false);
  const [sellPrice, setSellPrice] = useState(Math.max(unitCostSar * 1.6, unitCostSar + 20));
  const [commission, setCommission] = useState(15);
  const [qty, setQty] = useState(defaultQty);
  const [extraCost, setExtraCost] = useState(0);

  const { profitPerUnit, marginPct, totalProfit, totalRevenue, totalFees } = useMemo(() => {
    const fee = (sellPrice * commission) / 100;
    const ppu = sellPrice - unitCostSar - fee - extraCost;
    const margin = sellPrice > 0 ? (ppu / sellPrice) * 100 : 0;
    return {
      profitPerUnit: ppu,
      marginPct: margin,
      totalProfit: ppu * qty,
      totalRevenue: sellPrice * qty,
      totalFees: fee * qty,
    };
  }, [sellPrice, commission, unitCostSar, extraCost, qty]);

  const positive = profitPerUnit >= 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-accent/[0.04]">
      <CardContent className="p-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Profit calculator</h3>
                <p className="text-[11px] text-muted-foreground">Estimate your earnings before placing the order</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Selling price (SAR)</Label>
                <Input
                  type="number"
                  value={sellPrice}
                  onChange={e => setSellPrice(Math.max(0, Number(e.target.value)))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Quantity</Label>
                <Input
                  type="number"
                  value={qty}
                  onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Commission %</Label>
                <Input
                  type="number"
                  value={commission}
                  onChange={e => setCommission(Math.max(0, Number(e.target.value)))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Extra cost per unit (shipping, packaging)</Label>
              <Input
                type="number"
                value={extraCost}
                onChange={e => setExtraCost(Math.max(0, Number(e.target.value)))}
                className="h-9"
              />
            </div>

            <div className={`rounded-lg p-3 border ${positive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Profit per unit</span>
                <span className={`flex items-center gap-1 text-lg font-bold ${positive ? 'text-emerald-600' : 'text-destructive'}`}>
                  {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  SAR {profitPerUnit.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/40">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Margin</p>
                  <p className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-destructive'}`}>{marginPct.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</p>
                  <p className="text-sm font-bold">SAR {totalRevenue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total profit</p>
                  <p className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-destructive'}`}>SAR {totalProfit.toFixed(0)}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Cost SAR {unitCostSar.toFixed(2)} · Commission SAR {(totalFees / qty).toFixed(2)}/unit
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
