import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ImagePlus, Link2, Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GhostButton, inputClass } from "@/components/partners/SupplierShell";
import { supabase } from "@/integrations/supabase/client";

export type ProductImage = {
  /** Storage path inside the private product-images bucket. */
  path?: string;
  /** External image link pasted by the supplier. */
  url?: string;
  alt?: string;
};

export function readProductImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return entry.startsWith("http") ? [{ url: entry }] : [{ path: entry }];
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const path = typeof record["path"] === "string" ? record["path"] : undefined;
      const url = typeof record["url"] === "string" ? record["url"] : undefined;
      const alt = typeof record["alt"] === "string" ? record["alt"] : undefined;
      if (!path && !url) return [];
      return [{ ...(path ? { path } : {}), ...(url ? { url } : {}), ...(alt ? { alt } : {}) }];
    }
    return [];
  });
}

function imageKey(image: ProductImage, index: number) {
  return `${image.path ?? image.url ?? "image"}-${index}`;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const SHRINK_ABOVE_BYTES = 3 * 1024 * 1024;
const MAX_DIMENSION = 2400;

async function shrinkImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ProductImages({
  images,
  onChange,
  supplierId,
}: {
  images: ProductImage[];
  onChange: (next: ProductImage[]) => void;
  supplierId: string | null;
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewIndex]);

  const storedPaths = images.map((image) => image.path).filter((path): path is string => Boolean(path));

  useEffect(() => {
    const missing = storedPaths.filter((path) => !previews[path]);
    if (missing.length === 0) return;
    let active = true;
    (async () => {
      const resolved: Record<string, string> = {};
      for (const path of missing) {
        const { data } = await supabase.storage.from("partner-product-images").createSignedUrl(path, 3600);
        if (data?.signedUrl) resolved[path] = data.signedUrl;
      }
      if (active && Object.keys(resolved).length > 0) setPreviews((prev) => ({ ...prev, ...resolved }));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedPaths.join("|")]);

  function previewSrc(image: ProductImage) {
    if (image.url) return image.url;
    if (image.path) return previews[image.path] ?? "";
    return "";
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    if (!supplierId) {
      setError("Your session expired. Please sign in again.");
      return;
    }
    setUploading(true);
    const added: ProductImage[] = [];
    for (const original of Array.from(files)) {
      if (!original.type.startsWith("image/")) {
        setError("Only image files can be uploaded.");
        continue;
      }
      const file = original.size > SHRINK_ABOVE_BYTES ? await shrinkImage(original) : original;
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`"${original.name}" is too large. Please use a photo under 25 MB.`);
        continue;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const path = `${supplierId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("partner-product-images")
        .upload(path, file, { upsert: false, ...(file.type ? { contentType: file.type } : {}) });
      if (uploadError) {
        setError(
          /exceeded the maximum allowed size/i.test(uploadError.message)
            ? `"${original.name}" is too large to upload. Please use a smaller photo.`
            : uploadError.message,
        );
        continue;
      }
      added.push({ path });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (added.length > 0) onChange([...images, ...added]);
  }

  function addUrl() {
    setError("");
    const value = urlDraft.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value)) {
      setError("Paste a full image link starting with http:// or https://");
      return;
    }
    onChange([...images, { url: value }]);
    setUrlDraft("");
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
  }

  function remove(index: number) {
    onChange(images.filter((_, position) => position !== index));
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <GhostButton onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload images"}
        </GhostButton>
        <div className="flex min-w-[260px] flex-1 items-center gap-2">
          <input
            className={inputClass}
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
            placeholder="Paste an image link (https://…)"
          />
          <GhostButton onClick={addUrl}>
            <Link2 className="h-4 w-4" /> Add link
          </GhostButton>
        </div>
      </div>

      {error && (
        <p className="rounded-card border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-card border border-dashed border-border bg-secondary/40 px-4 py-8 text-center">
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs font-bold">No images yet</p>
          <p className="text-[11px] text-muted-foreground">
            Upload photos from your device or paste image links. The first image is used as the main product photo.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {images.map((image, index) => {
              const src = previewSrc(image);
              return (
                <div
                  key={imageKey(image, index)}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) move(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`overflow-hidden rounded-card border bg-card ${
                    dragIndex === index ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="relative aspect-square bg-secondary/50">
                    {src ? (
                      <button
                        type="button"
                        aria-label={`Preview image ${index + 1}`}
                        onClick={() => setViewIndex(index)}
                        className="block h-full w-full cursor-zoom-in"
                      >
                        <img src={src} alt={image.alt ?? `Product image ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">Loading…</div>
                    )}
                    {index === 0 && (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        <Star className="h-2.5 w-2.5" /> Main
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-1.5 py-1.5">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Move image ${index + 1} earlier`}
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        className="rounded border border-border p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move image ${index + 1} later`}
                        onClick={() => move(index, index + 1)}
                        disabled={index === images.length - 1}
                        className="rounded border border-border p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => remove(index)}
                      className="rounded border border-border p-0.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Drag a photo onto another, or use the arrows, to change the order. The first image is the main product photo.
          </p>
        </>
      )}

      {viewIndex !== null && images[viewIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setViewIndex(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={previewSrc(images[viewIndex])}
              alt={images[viewIndex].alt ?? `Product image ${viewIndex + 1}`}
              className="mx-auto max-h-[78vh] w-auto max-w-full rounded-card border border-border bg-card object-contain"
            />
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Previous image"
                disabled={viewIndex === 0}
                onClick={() => setViewIndex((current) => (current === null ? null : Math.max(0, current - 1)))}
                className="rounded-full border border-border bg-card p-2 text-foreground hover:bg-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-primary-foreground">
                {viewIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                aria-label="Next image"
                disabled={viewIndex >= images.length - 1}
                onClick={() =>
                  setViewIndex((current) => (current === null ? null : Math.min(images.length - 1, current + 1)))
                }
                className="rounded-full border border-border bg-card p-2 text-foreground hover:bg-secondary disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setViewIndex(null)}
              className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-1.5 text-foreground shadow-sm hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
