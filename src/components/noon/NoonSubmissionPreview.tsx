import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, FileSearch, Loader2 } from "lucide-react";
import { previewNoonSubmission } from "@/lib/noon.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

type Report = Awaited<ReturnType<typeof previewNoonSubmission>>["reports"][number];

/** Dry-run report of the exact image URLs, barcode and payload sent to Noon for each selected product. */
export function NoonSubmissionPreview({ connectionId, linkIds, disabled }: { connectionId: string; linkIds: string[]; disabled?: boolean }) {
  const preview = useServerFn(previewNoonSubmission);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  const run = async () => {
    setLoading(true);
    try {
      const result = await preview({ data: { connectionId, linkIds: linkIds.slice(0, 50) } });
      setReports(result.reports as Report[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the preview");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const okCount = reports.filter((report) => !report.issues.length).length;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setReports([]); void run(); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || !linkIds.length}><FileSearch /> Preview &amp; validate{linkIds.length ? ` (${linkIds.length})` : ""}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Noon submission preview</DialogTitle>
          <DialogDescription>Exactly what will be sent to Noon for each product, including the separate content and barcode requests.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking images and barcodes…</div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{okCount} of {reports.length} products are ready to send.</p>
            {reports.map((report) => (
              <div key={report.linkId} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="block truncate">{report.productName}</strong>
                    <span className="text-xs text-muted-foreground">SKU {report.partnerSku}{report.categoryCode ? ` · category ${report.categoryCode}` : ""}</span>
                  </div>
                  {report.issues.length
                    ? <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> {report.issues.length} problem{report.issues.length > 1 ? "s" : ""}</Badge>
                    : <Badge><CheckCircle2 className="mr-1 h-3 w-3" /> Ready</Badge>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="text-sm">
                    <span className="text-xs uppercase text-muted-foreground">Barcode mapped to SKU</span>
                    <p className="font-mono">{report.barcode || "—"} {!report.barcode ? <span className="text-xs text-muted-foreground">(none — optional)</span> : report.barcodeValid ? <span className="text-xs text-muted-foreground">(valid)</span> : <span className="text-xs text-destructive">(invalid)</span>}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs uppercase text-muted-foreground">Price &amp; stock</span>
                    <p>{report.prices.map((price) => `${price.market.toUpperCase()} ${price.price}`).join(" · ") || "—"}</p>
                    <p className="text-xs text-muted-foreground">{report.stock.map((entry) => `${entry.warehouse_code}: ${entry.qty} (${entry.processing_time})`).join(" · ") || "No warehouse"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase text-muted-foreground">Image links sent to Noon</span>
                  {report.images.length === 0 && <p className="text-sm text-destructive">No public image link could be built for this product.</p>}
                  {report.images.map((image) => (
                    <div key={image.url} className="flex items-center gap-3 rounded border p-2">
                      <img src={image.url} alt="" className="h-12 w-12 rounded object-cover" />
                      <span className="min-w-0 flex-1 break-all font-mono text-xs">{image.url}</span>
                      <Badge variant={image.reachable ? "default" : "destructive"}>{image.reachable ? "Reachable" : `Blocked${image.status ? ` (${image.status})` : ""}`}</Badge>
                    </div>
                  ))}
                </div>

                {report.alreadySubmitted && <p className="text-xs text-muted-foreground">Already sent to Noon as {report.noonSkuParent} — tick “Resubmit already-sent products” to send the content again.</p>}
                {report.issues.length > 0 && (
                  <ul className="list-inside list-disc text-sm text-destructive">{report.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
                )}
                {report.payload && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Show exact content payload</summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3">{report.payload}</pre>
                  </details>
                )}
                {report.barcodePayload && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Show exact barcode payload</summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3">{report.barcodePayload}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
