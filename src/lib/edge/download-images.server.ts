
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { urls, filename } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "No URLs provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single image - proxy directly
    if (urls.length === 1) {
      const res = await fetch(urls[0]);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const blob = await res.blob();
      return new Response(blob, {
        headers: {
          ...corsHeaders,
          "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
          "Content-Disposition": `attachment; filename="${filename || "image.jpg"}"`,
        },
      });
    }

    // Multiple images - fetch all and return as multipart JSON with base64
    const results: { name: string; data: string; type: string }[] = [];
    for (let i = 0; i < urls.length; i++) {
      try {
        const res = await fetch(urls[i]);
        if (!res.ok) continue;
        const arrayBuffer = await res.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        // Convert to base64
        let binary = "";
        for (let j = 0; j < uint8.length; j++) {
          binary += String.fromCharCode(uint8[j]);
        }
        const base64 = btoa(binary);
        const ext = urls[i].split(".").pop()?.split("?")[0] || "jpg";
        results.push({
          name: `${filename || "image"}_${i + 1}.${ext}`,
          data: base64,
          type: res.headers.get("Content-Type") || "image/jpeg",
        });
      } catch {
        // Skip failed images
      }
    }

    return new Response(JSON.stringify({ images: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
