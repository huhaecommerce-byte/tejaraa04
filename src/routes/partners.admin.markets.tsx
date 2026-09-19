import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Globe2, Save, Trash2, Upload } from "lucide-react";

import { AdminShell } from "@/components/partners/AdminShell";
import { Panel } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/admin/markets")({
  head: () => ({
    meta: [
      { title: `Market Flags | ${brandConfig.name}` },
      { name: "description", content: "Set the flag or image shown for every market on the Tejarx.com homepage." },
      { property: "og:title", content: `Market Flags | ${brandConfig.name}` },
      { property: "og:description", content: "Upload or link a custom image for each GCC market shown on the homepage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketsPage,
});

type MarketRow = {
  code: string;
  name: string;
  note: string;
  image_url: string;
  sort_order: number;
};

const MAX_UPLOAD = 4 * 1024 * 1024;

async function toSquareDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml") return dataUrl;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("That file is not a valid image."));
    element.src = dataUrl;
  });
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL("image/png");
}

function MarketsPage() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Partial<MarketRow>>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "market-flags"],
    queryFn: async () => {
      const { data: rows, error: queryError } = await supabase
        .from("wl_market_flags")
        .select("code, name, note, image_url, sort_order")
        .order("sort_order", { ascending: true });
      if (queryError) throw queryError;
      return (rows ?? []) as MarketRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: MarketRow) => {
      const { error: updateError } = await supabase
        .from("wl_market_flags")
        .update({ name: row.name, note: row.note, image_url: row.image_url })
        .eq("code", row.code);
      if (updateError) throw updateError;
    },
    onSuccess: (_result, row) => {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.code];
        return next;
      });
      setError("");
      setMessage(`${row.name || row.code} saved. The homepage now shows this image.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "market-flags"] });
      queryClient.invalidateQueries({ queryKey: ["market-flags"] });
    },
    onError: (mutationError: Error) => {
      setMessage("");
      setError(mutationError.message || "Could not save this market.");
    },
  });

  const rows = (data ?? []).map((row) => ({ ...row, ...drafts[row.code] })) as MarketRow[];

  const update = (code: string, patch: Partial<MarketRow>) =>
    setDrafts((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));

  const pickFile = async (code: string, file: File | undefined) => {
    if (!file) return;
    setMessage("");
    if (file.size > MAX_UPLOAD) {
      setError("Please choose an image smaller than 4MB.");
      return;
    }
    try {
      const image = await toSquareDataUrl(file);
      update(code, { image_url: image });
      setError("");
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Could not use that image.");
    }
  };

  return (
    <AdminShell
      title="Market flags"
      subtitle="Choose the flag or image shown for each market on the homepage. Upload a picture or paste an image link, then save."
    >
      {message && <p className="rounded-card border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">{message}</p>}
      {error && <p className="rounded-card border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">{error}</p>}

      {isLoading && <Panel title="Loading"><p className="px-3 py-4 text-xs text-muted-foreground">Fetching markets…</p></Panel>}

      {rows.map((row) => {
        const dirty = Boolean(drafts[row.code]);
        return (
          <Panel key={row.code} title={row.name || row.code}>
            <div className="grid gap-3 p-3 md:grid-cols-[96px_minmax(0,1fr)]">
              <div className="flex flex-col items-center gap-2">
                {row.image_url ? (
                  <img src={row.image_url} alt={`${row.name} flag`} className="h-16 w-16 rounded-full border-2 border-background object-cover shadow-card ring-1 ring-border" />
                ) : (
                  <span className={`h-16 w-16 ${row.code === "intl" ? "grid place-items-center rounded-full bg-primary text-primary-foreground shadow-card" : `flag flag-${row.code}`}`} aria-hidden="true">
                    {row.code === "intl" ? <Globe2 className="h-6 w-6" /> : <span />}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{row.code}</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
                  Market name
                  <input
                    value={row.name}
                    onChange={(event) => update(row.code, { name: event.target.value })}
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-10 sm:text-xs"
                  />
                </label>
                <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
                  Short note
                  <input
                    value={row.note}
                    onChange={(event) => update(row.code, { note: event.target.value })}
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-10 sm:text-xs"
                  />
                </label>
                <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-2">
                  Image link (optional)
                  <input
                    value={row.image_url.startsWith("data:") ? "" : row.image_url}
                    placeholder={row.image_url.startsWith("data:") ? "Uploaded image in use" : "https://…"}
                    onChange={(event) => update(row.code, { image_url: event.target.value })}
                    className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-10 sm:text-xs"
                  />
                </label>

                <div className="grid gap-2 sm:col-span-2 sm:flex sm:flex-wrap sm:items-center">
                  <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary sm:h-9">
                    <Upload className="h-3.5 w-3.5" /> Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void pickFile(row.code, event.target.files?.[0])} />
                  </label>
                  {row.image_url && (
                    <button
                      type="button"
                      onClick={() => update(row.code, { image_url: "" })}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/5 px-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 sm:h-9"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Use default flag
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!dirty || save.isPending}
                    onClick={() => save.mutate(row)}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 disabled:opacity-50 sm:h-9"
                  >
                    <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : dirty ? "Save changes" : "Saved"}
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        );
      })}
    </AdminShell>
  );
}
