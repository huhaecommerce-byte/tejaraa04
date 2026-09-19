// Server-enforced CSV/XLSX export of products with plan quota.
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Exported-Count, X-Quota-Used",
};

const esc = (v: string) => v.replace(/([\\,().])/g, "\\$1");

function buildCategoryOr(categories: string[]): string | null {
  if (!categories || categories.length === 0) return null;
  const groups: string[] = [];
  for (const k of categories) {
    const parts = k.split("::");
    if (parts.length === 1) groups.push(`and(top_category.eq.${esc(parts[0])})`);
    else if (parts.length === 2)
      groups.push(
        `and(top_category.eq.${esc(parts[0])},sub_category.eq.${esc(parts[1])})`
      );
    else if (parts.length === 3)
      groups.push(
        `and(top_category.eq.${esc(parts[0])},sub_category.eq.${esc(parts[1])},detailed_category.eq.${esc(parts[2])})`
      );
  }
  return groups.join(",");
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return '""';
  const s = Array.isArray(v) ? v.join(" | ") : String(v);
  // Always wrap every field in quotes and collapse newlines so spreadsheets
  // parse the file fast and never split a row mid-cell.
  return `"${s.replace(/\r?\n|\r/g, " ").replace(/"/g, '""')}"`;
}


const BASE_COLUMNS = [
  "id", "sku", "name", "name_ar",
  "top_category", "sub_category", "detailed_category",
  "source", "moq", "weight_kg",
  "price_sar", "price_usd",
  "stock_qty", "labelling_available",
  "description",
];
// Columns to actually SELECT from DB (includes images for processing)
const COLUMNS = [...BASE_COLUMNS, "images"];

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = process.env['SUPABASE_URL']!;
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const anonKey = (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!;

    // Authenticate user from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const format = (body.format === "xlsx" ? "xlsx" : body.format === "json" ? "json" : "csv") as
      | "csv"
      | "xlsx"
      | "json";
    const requested = Math.max(1, Math.min(Number(body.limit) || 100, 100000));
    const startOffset = Math.max(0, Number(body.offset) || 0);
    const source = body.source as "all" | "local" | "global" | undefined;
    const search = (body.search ?? "").toString().trim();
    const categories: string[] = Array.isArray(body.categories) ? body.categories : [];


    // Prefer the service-role client; fall back to the caller's own client
    // (RLS applies) when no service key is available in this environment.
    const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : userClient;


    // Resolve limits: per-customer override → platform default → unlimited
    const lmap: Record<string, string> = {};
    const { data: defaults } = await admin
      .from("usage_limit_defaults").select("limit_key, limit_value");
    (defaults ?? []).forEach((l: any) => { lmap[l.limit_key] = l.limit_value; });
    const { data: overrides } = await admin
      .from("customer_usage_limits").select("limit_key, limit_value").eq("user_id", userId);
    (overrides ?? []).forEach((l: any) => { lmap[l.limit_key] = l.limit_value; });

    const access = (lmap["catalog_export"] ?? "unlimited").toString().trim().toLowerCase() || "unlimited";
    if (access === "no" || access === "false" || access === "0") {

      return new Response(JSON.stringify({
        error: "Your current plan does not include catalog export. Upgrade to unlock.",
        code: "PLAN_BLOCKED",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Quota check — a numeric monthly row quota applies regardless of the
    // access value ("yes"/"unlimited" access still respects a configured quota).
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    let allowed = requested;
    let monthUsed = 0;
    const rawQuota = (lmap["catalog_export_qty_monthly"] ?? "").toString().trim().toLowerCase();
    const quotaUncapped =
      rawQuota === "" || rawQuota === "unlimited" || rawQuota === "yes" || rawQuota === "∞";
    if (!quotaUncapped) {
      const quota = Math.max(0, Number(rawQuota.replace(/[^0-9.]/g, "")) || 0);
      const { data: usage } = await admin
        .from("catalog_usage_log")
        .select("count")
        .eq("user_id", userId)
        .eq("action", "csv_export")
        .gte("created_at", monthStart);
      monthUsed = (usage ?? []).reduce((s: number, r: any) => s + (Number(r.count) || 0), 0);
      const remaining = Math.max(0, quota - monthUsed);
      if (remaining <= 0) {
        return new Response(JSON.stringify({
          error: `Monthly export quota reached (${monthUsed} / ${quota}). Contact support to raise your limit.`,
          code: "QUOTA_REACHED", used: monthUsed, quota,
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      allowed = Math.min(requested, remaining);
    }


    // Build query — PostgREST caps each response at 1000 rows, so page through
    // with .range() until we've collected `allowed` rows.
    const PAGE = 1000;
    const rows: any[] = [];
    for (let offset = 0; offset < allowed; offset += PAGE) {
      const from = startOffset + offset;
      const take = Math.min(PAGE, allowed - offset);
      let q = admin
        .from("products")
        .select(COLUMNS.join(","))
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + take - 1);
      if (source === "local" || source === "global") q = q.eq("source", source);
      if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
      const orStr = buildCategoryOr(categories);
      if (orStr) q = q.or(orStr);

      const { data: page, error: qErr } = await q;
      if (qErr) {
        return new Response(JSON.stringify({ error: qErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const batch = (page ?? []) as any[];
      rows.push(...batch);
      if (batch.length < take) break; // no more rows
    }

    const products = rows ?? [];
    if (products.length === 0) {
      if (format === "json") {
        return new Response(JSON.stringify({ rows: [], done: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Exported-Count": "0" },
        });
      }
      return new Response(JSON.stringify({
        error: "No products match these filters.", code: "EMPTY",
      }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log usage (insert one row with actual exported count)
    await admin.from("catalog_usage_log").insert({
      user_id: userId,
      action: "csv_export",
      count: products.length,
      metadata: { format, requested, allowed, offset: startOffset },
    });


    // Build file
    const filename = `tejaraa-catalog-${new Date().toISOString().slice(0, 10)}.${format}`;

    // Compute max images so each image gets its own column
    const maxImages = (products as any[]).reduce(
      (m, p) => Math.max(m, Array.isArray(p.images) ? p.images.length : 0),
      0,
    );
    const imageCols = Array.from({ length: maxImages }, (_, i) => `image_${i + 1}`);
    const outputColumns = [...BASE_COLUMNS, ...imageCols];

    const buildRow = (p: any): Record<string, any> => {
      const out: Record<string, any> = {};
      for (const c of BASE_COLUMNS) {
        out[c] = Array.isArray(p[c]) ? p[c].join(" | ") : (p[c] ?? "");
      }
      const imgs: string[] = Array.isArray(p.images) ? p.images : [];
      for (let i = 0; i < maxImages; i++) {
        out[`image_${i + 1}`] = imgs[i] ?? "";
      }
      return out;
    };

    if (format === "json") {
      return new Response(
        JSON.stringify({
          rows: (products as any[]).map(buildRow),
          columns: outputColumns,
          count: products.length,
          quotaUsed: monthUsed + products.length,
          done: products.length < allowed,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Exported-Count": String(products.length),
            "X-Quota-Used": String(monthUsed + products.length),
          },
        },
      );
    }


    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(
        (products as any[]).map(buildRow),
        { header: outputColumns },
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      return new Response(buf, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Exported-Count": String(products.length),
          "X-Quota-Used": String(monthUsed + products.length),
        },
      });
    }

    // CSV
    const lines = [outputColumns.map((c) => csvEscape(c)).join(",")];
    for (const p of products) {
      const row = buildRow(p);
      lines.push(outputColumns.map((c) => csvEscape(row[c])).join(","));
    }
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Exported-Count": String(products.length),
        "X-Quota-Used": String(monthUsed + products.length),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
