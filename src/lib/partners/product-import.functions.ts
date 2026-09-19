import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

const inputSchema = z.object({ url: z.string().trim().min(1) });

export type ScrapedProduct = {
  name: string;
  brand: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  sourceUrl: string;
};

// Amazon stores the real product gallery in the "colorImages" block for the
// selected variant. Swatch photos for other colors live elsewhere, so we
// extract only from that block when it exists.
function amazonGalleryImages(html: string): string[] {
  const start = html.search(/colorImages/i);
  if (start < 0) return [];
  let region = html.slice(start, start + 60_000);
  const end = region.search(/colorToAsin|holderRatio|landingAsinColor/i);
  if (end > 0) region = region.slice(0, end);
  const found = new Map<string, string>();
  const pattern = /(?:&quot;|"|')(hiRes|large|main|thumb)(?:&quot;|"|'):(?:&quot;|")(https?:\/\/[^"&]+?)(?:&quot;|")/gi;
  for (const match of region.matchAll(pattern)) {
    const kind = (match[1] ?? "").toLowerCase();
    const url = (match[2] ?? "").replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
    if (!/^https?:\/\//i.test(url)) continue;
    // Dedupe the same photo across sizes: Amazon appends ._SL1500_. style
    // segments; the base filename identifies the photo.
    const key = url.replace(/\._[A-Za-z0-9,_]+_\./, ".");
    if (!found.has(key) || kind === "hires") found.set(key, url);
  }
  return [...found.values()];
}

// Pull every image URL out of the page HTML and keep the ones that look like
// product photos (big CDN images, not icons/logos/sprites).
function htmlImageUrls(html: string): string[] {
  const found = new Set<string>();
  const add = (raw: string) => {
    const value = raw.replace(/&amp;/g, "&").trim();
    if (/^https?:\/\//i.test(value) && /\.(jpe?g|png|webp|avif)(\?|#|$)/i.test(value)) found.add(value);
  };
  for (const match of html.matchAll(/src="(https?:\/\/[^"]+)"/gi)) add(match[1]!);
  for (const match of html.matchAll(/data-src="(https?:\/\/[^"]+)"/gi)) add(match[1]!);
  // srcset entries: "url 1x, url 2x" — keep each URL
  for (const match of html.matchAll(/srcset="([^"]+)"/gi)) {
    for (const part of match[1]!.split(",")) add(part.trim().split(/\s+/)[0] ?? "");
  }
  // "hiRes":"url" / "large":"url" style embedded image maps, also HTML-escaped as &quot;
  for (const match of html.matchAll(/(?:&quot;|")(?:hiRes|large|main|thumb)(?:&quot;|"):(?:&quot;|")(https?:\/\/[^"&]+?)(?:&quot;|")/gi)) {
    add(match[1]!.replace(/\\u0026/g, "&"));
  }
const noise = /logo|icon|sprite|favicon|badge|flag|placeholder|grey-pixel|trans\.gif|nav-|arrow|star/i;
  return [...found].filter((value) => !noise.test(value));
}

// Read the real pixel dimensions from the first bytes of an image file.
// Supports JPEG, PNG, GIF and WebP; returns null when it cannot tell.
function imageSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 32) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // PNG: 8-byte signature, then IHDR with width/height at offset 16.
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  // GIF: "GIF8", width/height little-endian at offset 6.
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }
  // WebP: "RIFF....WEBP", then VP8 / VP8L / VP8X chunk.
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) {
    const chunk = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);
    if (chunk === "VP8 " && bytes.length >= 30) {
      return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
    }
    if (chunk === "VP8L" && bytes.length >= 25) {
      const b0 = bytes[21]!, b1 = bytes[22]!, b2 = bytes[23]!, b3 = bytes[24]!;
      return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
    }
    if (chunk === "VP8X" && bytes.length >= 30) {
      return {
        width: 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16)),
        height: 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16)),
      };
    }
    return null;
  }
  // JPEG: walk markers until a start-of-frame block carrying dimensions.
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      const marker = bytes[offset + 1]!;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      }
      offset += 2 + view.getUint16(offset + 2);
    }
  }
  return null;
}

// Download just enough of each image to read its dimensions and drop tiny
// files (thumbnails, swatches, tracking pixels). Images whose size cannot be
// determined are kept.
async function filterSmallImages(urls: string[], minPixels = 200): Promise<string[]> {
  const checks = await Promise.all(
    urls.map(async (imageUrl) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: { Range: "bytes=0-65535", "User-Agent": "Mozilla/5.0" },
        });
        if (!response.ok) return imageUrl;
        const buffer = new Uint8Array(await response.arrayBuffer());
        const size = imageSize(buffer);
        if (!size) return imageUrl;
        return size.width >= minPixels && size.height >= minPixels ? imageUrl : null;
      } catch {
        return imageUrl;
      } finally {
        clearTimeout(timer);
      }
    }),
  );
  return checks.filter((value): value is string => typeof value === "string");
}

const extractionSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Product title" },
    brand: { type: "string", description: "Brand or manufacturer name" },
    sku: { type: "string", description: "SKU, model number or product code" },
    category: { type: "string", description: "Product category" },
    description: { type: "string", description: "Product description, plain text" },
    price: { type: "number", description: "Listed price as a number" },
    currency: { type: "string", description: "Three letter currency code, e.g. AED, SAR, USD" },
    images: { type: "array", items: { type: "string" }, description: "Absolute product image URLs" },
  },
  required: ["name"],
} as const;

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function metaContent(html: string, key: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  const match = html.match(pattern);
  const value = match?.[1] ?? match?.[2] ?? "";
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// AliExpress renders the listing in the browser, so the page the reader
// receives is a generic shell. The real title still sits in the social
// preview tag, the item code in the address, and the price in the
// tracking parameter of shared links.
function aliExpressDetails(url: string, html: string, metadata: Record<string, unknown>) {
  const rawTitle = metaContent(html, "og:title") || text(metadata["og:title"]) || text(metadata["ogTitle"]);
  const title = rawTitle
    .replace(/\s*[-–|]\s*aliexpress(?:\s+\d+)?\s*$/i, "")
    .replace(/\s*[-–|]\s*$/, "")
    .trim();
  let sku = url.match(/\/item\/(?:[a-z-]+\/)?(\d{6,})/i)?.[1] ?? "";
  let price = "";
  let currency = "";
  try {
    const parsedUrl = new URL(url);
    const variant = JSON.parse(parsedUrl.searchParams.get("pdp_ext_f") ?? "{}") as { sku_id?: unknown };
    const variantSku = text(variant.sku_id);
    if (variantSku) sku = variantSku;
    const npi = parsedUrl.searchParams.get("pdp_npi") ?? "";
    for (const part of npi.split("!")) {
      const money = part.trim().match(/^([A-Z]{3})\s*([\d,]+(?:\.\d+)?)$/);
      if (money) {
        currency = money[1]!;
        price = money[2]!.replace(/,/g, "");
      }
    }
  } catch {
    /* ignore malformed links */
  }

  const lowerTitle = title.toLowerCase();
  let category = "";
  if (/remote control|air conditioner|electronic|charger|cable|headphone|earphone|speaker|camera|phone|tablet|computer/.test(lowerTitle)) {
    category = "Electronics & Accessories";
  } else if (/kitchen|cook|storage|furniture|decor|bathroom|bedroom|household/.test(lowerTitle)) {
    category = "Home & Kitchen";
  } else if (/beauty|cosmetic|makeup|skin care|hair|perfume/.test(lowerTitle)) {
    category = "Beauty & Personal Care";
  } else if (/shirt|dress|shoe|jacket|trouser|clothing|fashion|bag/.test(lowerTitle)) {
    category = "Fashion & Apparel";
  }

  return {
    title,
    sku,
    price,
    currency,
    category,
    description: title,
  };
}

const GENERIC_TITLE = /shopping page|online shopping|welcome to|^aliexpress(?:\s+product)?$|^amazon(?:\s+product)?$/i;

// When every reader is blocked, the address itself still carries a readable
// product name and code (e.g. noon: /saudi-en/<slug>/N38506385A/p/).
function productFromUrlOnly(url: string): ScrapedProduct | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  const code = segments.find((part) => /^[A-Z]?\d{6,}[A-Z]?$/.test(part)) ?? "";
  const slug = [...segments].reverse().find((part) => part.includes("-") && part.length > 8) ?? "";
  if (!slug) return null;
  const name = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
  if (!name) return null;
  return {
    name,
    brand: "",
    sku: code,
    category: "",
    description: "",
    price: "",
    currency: "",
    images: [],
    sourceUrl: url,
  };
}


export const scrapeProductFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ScrapedProduct> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["FIRECRAWL_API_KEY"];
    if (!lovableKey || !connectionKey) throw new Error("Product import is not configured yet. Please contact support.");

    let url = data.url.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      new URL(url);
    } catch {
      throw new Error("That does not look like a valid web address.");
    }

    const callScrape = (extra: Record<string, unknown>) =>
      fetch(`${GATEWAY}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": connectionKey,
        },
        body: JSON.stringify({
          url,
          // Full page, not just the article body: galleries (Amazon etc.) live
          // outside the main content block and get stripped otherwise. rawHtml
          // keeps the embedded gallery data that processed HTML removes.
          onlyMainContent: false,
          formats: [{ type: "json", schema: extractionSchema }, "rawHtml"],
          ...extra,
        }),
      });

    // Big retailers block plain fetches; retry harder with a stealth proxy and
    // a longer render wait before giving up.
    let response = await callScrape({});
    let bodyText = await response.text();
    if (!response.ok) {
      console.error(`Firecrawl scrape failed [${response.status}]: ${bodyText}`);
      if (response.status !== 402 && response.status !== 403) {
        response = await callScrape({ proxy: "stealth", waitFor: 5000, timeout: 60000 });
        bodyText = await response.text();
        if (!response.ok) console.error(`Firecrawl stealth retry failed [${response.status}]: ${bodyText}`);
      }
    }
    // Last resort: fetch the page ourselves with browser-like headers. Many
    // shops that refuse the scraping engines still answer a plain request.
    let directHtml = "";
    if (!response.ok) {
      console.error(`Firecrawl gave up on ${url}; trying a direct fetch.`);
      try {
        const direct = await fetch(url, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        if (direct.ok) directHtml = await direct.text();
        else console.error(`Direct fetch failed [${direct.status}] for ${url}`);
      } catch (error) {
        console.error("Direct fetch threw", error);
      }
    }

    if (!response.ok && !directHtml) {
      if (response.status === 402 || response.status === 403) throw new Error("The page reader has run out of credits. Please try again later.");
      // Some shops (noon, and other Akamai-protected stores) block every
      // automated reader. Rather than a dead end, hand back what the link
      // itself reveals so the form is pre-filled and editable.
      const draft = productFromUrlOnly(url);
      if (draft) return draft;
      throw new Error("We could not read that page. Please check the link and try again.");
    }

    const parsed = (
      response.ok
        ? JSON.parse(bodyText)
        : {}
    ) as {
      json?: Record<string, unknown>;
      html?: string;
      rawHtml?: string;
      data?: { json?: Record<string, unknown>; html?: string; rawHtml?: string; metadata?: Record<string, unknown> };
      metadata?: Record<string, unknown>;
    };
    const json = parsed.json ?? parsed.data?.json ?? {};
    const metadata = parsed.metadata ?? parsed.data?.metadata ?? {};
    const html =
      (typeof parsed.rawHtml === "string" ? parsed.rawHtml : undefined) ??
      (typeof parsed.data?.rawHtml === "string" ? parsed.data.rawHtml : undefined) ??
      (typeof parsed.html === "string" ? parsed.html : (parsed.data?.html ?? "")) ??
      "";
    const pageHtml = html || directHtml;

    const images: string[] = [];
    const seen = new Set<string>();
    const pushImage = (value: string) => {
      if (/^https?:\/\//i.test(value) && !seen.has(value)) {
        seen.add(value);
        images.push(value);
      }
    };
    // On Amazon, the real gallery is the colorImages block; other photos on the
    // page are variant swatches and promos, so skip them when a gallery exists.
    const gallery = amazonGalleryImages(pageHtml);
    if (gallery.length) {
      gallery.forEach(pushImage);
    } else {
      if (Array.isArray(json['images'])) (json['images'] as unknown[]).map(text).forEach(pushImage);
      htmlImageUrls(pageHtml).forEach(pushImage);
    }
    const ogImage = text(metadata["ogImage"]);
    if (!images.length) pushImage(ogImage);
    images.splice(12);
    // Remove thumbnails/small images: anything under 200px in either
    // dimension is dropped automatically.
    const filtered = await filterSmallImages(images);
    if (filtered.length) {
      images.length = 0;
      images.push(...filtered.slice(0, 8));
    } else {
      images.splice(8);
    }

    const host = new URL(url).hostname.toLowerCase();
    const isAli = /aliexpress\./i.test(host);
    const ali = isAli ? aliExpressDetails(url, pageHtml, metadata) : null;

    const ogTitle = metaContent(pageHtml, "og:title").replace(/\s*[-–|]\s*(aliexpress|amazon)[^-–|]*$/i, "").trim();
    // AliExpress's structured extraction frequently returns the placeholder
    // "AliExpress Product" even when the real listing title is available in
    // og:title. Always prefer that social-preview title for AliExpress pages.
    let name = isAli && ali?.title
      ? ali.title
      : text(json['name']) || text(metadata["title"]);
    if (!name || GENERIC_TITLE.test(name)) name = ali?.title || ogTitle || name;
    if (!name) throw new Error("We could not find any product details on that page.");

    let brand = text(json['brand']);
    if (/^(aliexpress|amazon|ebay|noon)$/i.test(brand)) brand = "";

    let description = text(json['description']) || text(metadata["description"]) || metaContent(pageHtml, "og:description");
    if (GENERIC_TITLE.test(description) || /smarter shopping, better living/i.test(description)) description = "";
    if (isAli && !description) description = ali?.description ?? "";

    let category = text(json['category']);
    if (/^online shopping$/i.test(category)) category = "";
    if (isAli && !category) category = ali?.category ?? "";

    const sku = text(json['sku']) && !isAli ? text(json['sku']) : (ali?.sku ?? text(json['sku']));
    const jsonPrice = text(json['price']);
    const price = ali?.price || (jsonPrice === "0" ? "" : jsonPrice);
    const currency = (ali?.currency || text(json['currency'])).toUpperCase();

    return {
      name,
      brand,
      sku,
      category,
      description,
      price,
      currency,
      images,
      sourceUrl: url,
    };
  });

