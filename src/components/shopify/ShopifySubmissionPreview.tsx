import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileSearch } from "lucide-react";
import { previewShopifySubmission } from "@/lib/shopify.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

type Report = Awaited<ReturnType<typeof previewShopifySubmission>>["reports"][number];

export function ShopifySubmissionPreview({ connectionId, linkIds, disabled }: { connectionId: string; linkIds: string[]; disabled?: boolean }) {
  const preview = useServerFn(previewShopifySubmission);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  const run = async () => {
    if (!linkIds.length) { toast.info("Tick the products you want to check first."); return; }
    setBusy(true);
    try {
      const result = await preview({ data: { connectionId, linkIds: linkIds.slice(0, 50) } });
      setReports(result.reports);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally { setBusy(false); }
  };

  return <>
    <Button variant="outline" disabled={disabled || busy} onClick={run}><FileSearch /> Preview & validate</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What will be sent to Shopify</DialogTitle>
          <DialogDescription>Exactly the photos, barcode, price and stock that go out when you publish.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {reports.map((report) => <div key={report.linkId} className="rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{report.productName}</p>
              <div className="flex gap-1">
                {report.alreadyPublished && <Badge variant="secondary">Already in Shopify</Badge>}
                <Badge variant={report.issues.length ? "destructive" : "default"}>{report.issues.length ? "Needs attention" : "Ready"}</Badge>
              </div>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">SKU / barcode</dt><dd>{report.sku}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Price and stock</dt><dd>{report.price ? report.price.toFixed(2) : "—"} · {report.stock} in stock</dd></div>
            </dl>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground">Photo links</p>
              {report.images.length === 0 ? <p className="text-xs text-destructive">No public photo link</p> : report.images.map((image) => <div key={image.url} className="flex items-center gap-2 text-xs">
                <Badge variant={image.reachable === false ? "destructive" : "outline"}>{image.reachable === false ? "Blocked" : "Reachable"}</Badge>
                <span className="truncate">{image.url}</span>
              </div>)}
            </div>
            {report.issues.length > 0 && <ul className="mt-3 space-y-1 text-xs text-destructive">{report.issues.map((issue) => <li key={issue}>• {issue}</li>)}</ul>}
            {report.payload && <details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Show exact payload</summary><pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-[11px]">{report.payload}</pre></details>}
          </div>)}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
