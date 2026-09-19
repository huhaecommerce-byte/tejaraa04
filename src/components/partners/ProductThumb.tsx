import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { readProductImages } from "@/components/partners/ProductImages";
import { supabase } from "@/integrations/supabase/client";

/** Renders the first image of a product, resolving private storage paths to signed URLs. */
export function ProductThumb({ images, alt, className = "h-9 w-9" }: { images: unknown; alt: string; className?: string }) {
  const first = readProductImages(images)[0];
  const [src, setSrc] = useState<string | null>(first?.url ?? null);

  useEffect(() => {
    let cancelled = false;
    setSrc(first?.url ?? null);
    if (first?.path) {
      supabase.storage
        .from("partner-product-images")
        .createSignedUrl(first.path, 3600)
        .then(({ data }) => {
          if (!cancelled && data?.signedUrl) setSrc(data.signedUrl);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [first?.path, first?.url]);

  if (!src) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/60 text-muted-foreground ${className}`}>
        <ImageIcon className="h-4 w-4" />
      </span>
    );
  }
  return <img src={src} alt={alt} className={`shrink-0 rounded-lg border border-border object-cover ${className}`} loading="lazy" />;
}
