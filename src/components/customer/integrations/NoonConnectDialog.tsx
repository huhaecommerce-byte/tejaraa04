import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, ShieldCheck, Store } from "lucide-react";
import { connectNoon } from "@/lib/noon.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

export function NoonConnectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const connect = useServerFn(connectNoon);
  const [busy, setBusy] = useState(false);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "Noon Store", privateKey: "", keyId: "" });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.name.trim() || form.privateKey.trim().length < 80) {
      toast.error("Add a connection name and paste the private key Noon gave you.");
      return;
    }
    setBusy(true);
    try {
      const result = await connect({ data: { name: form.name.trim(), privateKey: form.privateKey, ...(form.keyId.trim() ? { keyId: form.keyId.trim() } : {}) } });
      if (!result.ok) toast.warning(result.error ?? "Saved, but Noon could not verify this key.");
      else toast.success("Noon is connected. We pulled your account details automatically.");
      setConnectedId(result.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Noon could not be connected");
    } finally { setBusy(false); }
  };

  const openWorkspace = async () => {
    if (!connectedId) return;
    onOpenChange(false);
    setConnectedId(null);
    await navigate({ to: "/dropshipping/integrations/noon/$connectionId", params: { connectionId: connectedId } });
  };

  const close = (next: boolean) => { if (!next) setConnectedId(null); onOpenChange(next); };

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      {connectedId ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><CheckCircle2 className="h-7 w-7 text-primary" /></div>
          <DialogHeader className="items-center">
            <DialogTitle>Noon is connected</DialogTitle>
            <DialogDescription>Your connection is saved and verified. Open the workspace to manage products, orders and settings.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => close(false)}>Stay here</Button>
            <Button onClick={openWorkspace}>Open workspace <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store className="h-5 w-5" /></div>
            <DialogTitle>Connect Noon Seller</DialogTitle>
            <DialogDescription>Give the connection a name and paste the private key from Noon. Everything else — project, markets, warehouses and categories — is fetched from Noon after the key is verified.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label htmlFor="noon-name">Connection name</Label><Input id="noon-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="noon-key-id">Key ID (service account)</Label><Input id="noon-key-id" value={form.keyId} onChange={(e) => set("keyId", e.target.value)} placeholder="Only needed if it is not inside the key file" autoComplete="off" /><p className="text-xs text-muted-foreground">Noon shows this next to the key in the partner portal. Leave empty if your key file already contains it.</p></div>
            <div className="space-y-2"><Label htmlFor="noon-private">Private key</Label><Textarea id="noon-private" value={form.privateKey} onChange={(e) => set("privateKey", e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----" className="min-h-40 font-mono text-xs" autoComplete="off" /><p className="text-xs text-muted-foreground">Paste the key file exactly as Noon provided it. If it came as a JSON file, paste the whole file.</p></div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Credentials are encrypted before storage</span>
            <Button onClick={submit} disabled={busy}>{busy ? "Connecting…" : "Connect and fetch details"}</Button>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>;
}