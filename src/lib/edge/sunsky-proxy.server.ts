// SunSky API proxy — signs every request with MD5(sortedParamValues + key, "@" + secret)
// Holds the API secret server-side, validates admin role, and writes an audit log row.
import { createClient } from "@supabase/supabase-js";
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OFFICIAL_SUNSKY_BASE_URL = 'https://open.sunsky-online.com';

// Map of supported endpoints → official SunSky Open API paths
const ENDPOINTS: Record<string, string> = {
  'category/children':   '/openapi/category!getChildren.do',
  'category/sync-roots': '/openapi/category!getChildren.do', // alias: top-level (no categoryId)
  'product/search':     '/openapi/product!search.do',
  'product/details':    '/openapi/product!detail.do',
  'product/images':     '/openapi/product!downloadImages.do',
  'product/changelist': '/openapi/product!getImageChangelist.do',
  'order/countries':    '/openapi/order!getCountries.do',
  'order/quote':        '/openapi/order!getPricesAndFreights.do',
  'order/create':       '/openapi/order!createOrder.do',
  'order/details':      '/openapi/order!getOrderDetail.do',
  'order/search':       '/openapi/order!getOrderList.do',
  'order/labels/add':   '/openapi/order!addLabel.do',
  'order/labels/get':   '/openapi/order!getLabels.do',
  'account/balance':    '/openapi/order!getBalance.do',
  'account/history':    '/openapi/order!getBalanceHistory.do',
  'stats/hot':          '/openapi/stats!getHotItems.do',
  'coupon/list':        '/openapi/coupon!getCouponList.do',
};

function buildSignature(
  paramsWithKey: Record<string, string | number | undefined>,
  secret: string,
): string {
  // Step 1: sort keys alphabetically, concatenate corresponding values (no separators).
  const keys = Object.keys(paramsWithKey).filter(
    (k) => paramsWithKey[k] !== undefined && paramsWithKey[k] !== null && paramsWithKey[k] !== '',
  );
  keys.sort();
  const concat = keys.map((k) => String(paramsWithKey[k])).join('');
  // Step 2: append "@" + secret. Step 3: MD5.
  return createHash('md5').update(concat + '@' + secret).digest('hex');
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const started = Date.now();
  const SUPABASE_URL = process.env['SUPABASE_URL']!;
  const ANON_KEY = (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!;
  const SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
  const SUNSKY_KEY = process.env['SUNSKY_API_KEY'];
  const SUNSKY_SECRET = process.env['SUNSKY_API_SECRET'];

  let actorId: string | null = null;
  let endpointKey = '';
  let httpStatus: number | null = null;
  let result: 'success' | 'error' | 'exception' = 'exception';
  let errorMessage: string | null = null;
  let requestSummary: any = {};
  let responseSummary: any = {};

  try {
    // --- auth: must be admin (or staff with sunsky module)
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    actorId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: actorId, _role: 'admin' });
    const { data: hasModule } = await admin.rpc('has_module_access', { _user_id: actorId, _module: 'sunsky' });
    if (!isAdmin && !hasModule) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUNSKY_KEY || !SUNSKY_SECRET) {
      return new Response(JSON.stringify({
        result: 'error',
        messages: ['SunSky API credentials are not configured. Add SUNSKY_API_KEY and SUNSKY_API_SECRET in project settings.'],
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const body = await req.json().catch(() => ({}));
    endpointKey = String(body?.endpoint ?? '');
    const params: Record<string, any> = body?.params ?? {};

    // ===== Internal (non-passthrough) endpoints for bulk import =====
    if (endpointKey === 'import/preview' || endpointKey === 'import/start' || endpointKey === 'import/cancel'
      || endpointKey === 'product/list' || endpointKey === 'import/item'
      || endpointKey === 'category/sync-all' || endpointKey === 'category/tree-stats') {
      const admin2 = createClient(SUPABASE_URL, SERVICE_KEY);
      const out = await handleImportEndpoint(endpointKey, params, actorId, admin2, SUNSKY_KEY!, SUNSKY_SECRET!);
      result = out.result;
      errorMessage = out.errorMessage ?? null;
      requestSummary = { endpoint: endpointKey, paramKeys: Object.keys(params) };
      responseSummary = { result: out.result };
      await admin2.from('sunsky_sync_log').insert({
        actor_id: actorId,
        endpoint: endpointKey,
        http_status: 200,
        result,
        latency_ms: Date.now() - started,
        request_summary: requestSummary,
        response_summary: responseSummary,
        error_message: errorMessage,
      });
      return new Response(JSON.stringify(out.body), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ENDPOINTS[endpointKey]) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }
    requestSummary = { endpoint: endpointKey, paramKeys: Object.keys(params) };

    // Build signed params
    const flatParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      flatParams[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    // sync-roots is an alias for category/children with no categoryId
    if (endpointKey === 'category/sync-roots') {
      delete flatParams.categoryId;
    }
    flatParams.key = SUNSKY_KEY;
    const signature = buildSignature(flatParams, SUNSKY_SECRET);

    // Resolve base URL from settings (admin-configurable)
    const { data: settings } = await admin
      .from('sunsky_settings')
      .select('base_url')
      .eq('id', true)
      .maybeSingle();
    let baseUrl = (settings?.base_url || OFFICIAL_SUNSKY_BASE_URL).replace(/\/+$/, '');
    // Auto-correct legacy/invalid hosts and docs-site URLs to the official Open API host.
    baseUrl = baseUrl.replace(/^https?:\/\/(api\.|www\.)?sunsky-online\.com$/i, OFFICIAL_SUNSKY_BASE_URL);
    baseUrl = baseUrl.replace(/^https?:\/\/doc\.sunsky-online\.com$/i, OFFICIAL_SUNSKY_BASE_URL);

    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(flatParams)) form.append(k, v);
    form.append('signature', signature);

    const url = baseUrl + ENDPOINTS[endpointKey];
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    httpStatus = upstream.status;
    const text = await upstream.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

    if (parsed?.result === 'success') {
      result = 'success';
    } else {
      result = 'error';
      errorMessage = Array.isArray(parsed?.messages) ? parsed.messages.join('; ') : (parsed?.raw ?? 'Unknown error');
    }
    responseSummary = {
      result: parsed?.result,
      hasData: parsed?.data !== undefined,
      messages: parsed?.messages,
    };

    // Audit log (service role bypasses RLS)
    await admin.from('sunsky_sync_log').insert({
      actor_id: actorId,
      endpoint: endpointKey,
      http_status: httpStatus,
      result,
      latency_ms: Date.now() - started,
      request_summary: requestSummary,
      response_summary: responseSummary,
      error_message: errorMessage,
    });

    // Side-effect: cache balance
    if (endpointKey === 'account/balance' && result === 'success') {
      await admin.from('sunsky_settings').update({
        last_balance_check_at: new Date().toISOString(),
        last_balance_value: parsed?.data?.balance ?? parsed?.data?.amount ?? null,
        last_balance_currency: parsed?.data?.currency ?? null,
      }).eq('id', true);
    }

    // Side-effect: cache categories tree.
    // SunSky's getChildren endpoint returns a flat list. The API's parentId field
    // is unreliable for top-level detection (some real subs of "Mobile Parts" omit
    // parentId, which would make them look like roots). We therefore enforce an
    // authoritative whitelist of the 20 real top-level category names supplied by
    // the SunSky business team — anything matching that list becomes a root,
    // anything else MUST have a valid parent or it is dropped.
    if ((endpointKey === 'category/children' || endpointKey === 'category/sync-roots') && result === 'success') {
      const list: any[] = Array.isArray(parsed?.data) ? parsed.data
        : (parsed?.data?.result ?? parsed?.data?.list ?? parsed?.data?.children ?? []);
      const requestedParent = flatParams.categoryId ? Number(flatParams.categoryId) : null;

      const TOP_LEVEL_NAMES = new Set([
        'apple parts',
        'samsung parts',
        'mobile parts',
        'apple accessories',
        'samsung accessories',
        'xiaomi accessories',
        'oneplus & oppo accessories',
        'mobile accessories',
        'smart wear',
        'smart phones',
        'dji & insta accessories',
        'camera accessories',
        'game accessories',
        'consumer electronics',
        'computer & networking',
        'in car',
        'security',
        'outdoor & sports',
        'home & garden',
        'print your demand(pod)',
      ]);
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

      // On a top-level sync (no categoryId) wipe the cache first so stale rows
      // from earlier broken syncs disappear instead of lingering.
      if (endpointKey === 'category/sync-roots' && requestedParent == null) {
        await admin.from('sunsky_categories').delete().gt('category_id', 0);
      }

      const rawRows = (Array.isArray(list) ? list : []).map((c: any) => {
        const cid = Number(c.id ?? c.categoryId ?? c.category_id);
        if (!Number.isFinite(cid)) return null;
        const name = String(c.name ?? c.label ?? c.title ?? '').trim();
        const rawParentVal = c.parentId ?? c.parent_id ?? c.pid;
        const hasParent = rawParentVal !== undefined && rawParentVal !== null && rawParentVal !== '';
        const rawParent = hasParent ? Number(rawParentVal) : NaN;

        const isWhitelistedRoot = TOP_LEVEL_NAMES.has(normalize(name));
        let parent_id: number | null;
        if (isWhitelistedRoot) {
          parent_id = null;
        } else if (hasParent && Number.isFinite(rawParent) && rawParent !== 0 && rawParent !== cid) {
          parent_id = rawParent;
        } else {
          // Not a known root and no usable parent — drop it so it can't pollute
          // the top column.
          return null;
        }

        return {
          category_id: cid,
          parent_id,
          name,
          has_children: Boolean(c.hasChildren ?? c.has_children ?? c.hasChild ?? false),
          product_count: typeof c.productCount === 'number' ? c.productCount : null,
          raw: c,
          synced_at: new Date().toISOString(),
        };
      }).filter(Boolean) as any[];

      // Derive level (1 = top, 2 = sub, 3 = detail, ...) by walking the parent chain
      // within this batch. Falls back to 1 for root, 2 for any unknown parent.
      const byId = new Map<number, any>();
      for (const r of rawRows) byId.set(r.category_id, r);
      function levelOf(id: number, seen = new Set<number>()): number {
        if (seen.has(id)) return 1;
        seen.add(id);
        const node = byId.get(id);
        if (!node || node.parent_id == null) return 1;
        const parent = byId.get(node.parent_id);
        if (!parent) return 2;
        return Math.min(6, levelOf(parent.category_id, seen) + 1);
      }
      const rows = rawRows.map((r) => ({ ...r, level: levelOf(r.category_id) }));

      // Mark parents that we know have children (based on this batch).
      const parentsWithKids = new Set<number>();
      for (const r of rows) if (r.parent_id != null) parentsWithKids.add(r.parent_id);
      for (const r of rows) {
        if (parentsWithKids.has(r.category_id)) r.has_children = true;
      }

      if (rows.length) {
        // Upsert in chunks to avoid payload limits (the full tree can be 1000+ rows).
        const CHUNK = 500;
        for (let i = 0; i < rows.length; i += CHUNK) {
          await admin
            .from('sunsky_categories')
            .upsert(rows.slice(i, i + CHUNK) as any, { onConflict: 'category_id' });
        }
        if (requestedParent != null) {
          await admin.from('sunsky_categories')
            .update({ has_children: true }).eq('category_id', requestedParent);
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      await admin.from('sunsky_sync_log').insert({
        actor_id: actorId,
        endpoint: endpointKey || 'unknown',
        http_status: httpStatus,
        result: 'exception',
        latency_ms: Date.now() - started,
        request_summary: requestSummary,
        response_summary: responseSummary,
        error_message: errorMessage,
      });
    } catch { /* ignore log failure */ }
    return new Response(JSON.stringify({ result: 'error', messages: [errorMessage] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  }
}

// =============================================================================
// Bulk Category Import — internal endpoints + background worker
// =============================================================================

interface ImportFilters {
  inStockOnly?: boolean;
  minStock?: number;
  maxItems?: number;
  keyword?: string;
  // SunSky status query param: -1 = all, 1 = valid only. Default: -1.
  sunskyStatus?: number;
  // Statuses we actually persist. Default: [1, 3] (Active + OOS, not Deleted/Hidden).
  allowedStatuses?: number[];
}

async function callSunsky(
  endpointKey: string,
  params: Record<string, any>,
  apiKey: string,
  secret: string,
): Promise<any> {
  const path = ENDPOINTS[endpointKey];
  if (!path) throw new Error(`Unknown SunSky endpoint ${endpointKey}`);
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    flat[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  flat.key = apiKey;
  const sig = buildSignature(flat, secret);
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(flat)) form.append(k, v);
  form.append('signature', sig);
  const r = await fetch('https://open.sunsky-online.com' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { result: 'error', messages: [text] }; }
}

function extractItems(payload: any): { items: any[]; total: number; pageCount: number } {
  const d: any = payload?.data ?? {};
  const items: any[] = Array.isArray(d) ? d : (d.result ?? d.list ?? d.items ?? d.products ?? []);
  return {
    items: Array.isArray(items) ? items : [],
    total: Number(d.total ?? items?.length ?? 0),
    pageCount: Number(d.pageCount ?? Math.ceil((d.total ?? items?.length ?? 0) / 40)),
  };
}

async function handleImportEndpoint(
  endpointKey: string,
  params: any,
  actorId: string | null,
  admin: any,
  apiKey: string,
  secret: string,
): Promise<{ result: 'success' | 'error'; body: any; errorMessage?: string }> {
  // ---- Full category tree crawl (incremental, resumable) -----------------
  if (endpointKey === 'category/sync-all' || endpointKey === 'category/tree-stats') {
    return handleCategoryTree(endpointKey, params, admin, apiKey, secret);
  }

  // ---- Product listing (normalised, paginated) ---------------------------
  if (endpointKey === 'product/list') {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(params.pageSize) || 40));
    const cid = Number(params.categoryId);
    const r = await callSunsky('product/search', {
      categoryId: Number.isFinite(cid) && cid > 0 ? cid : undefined,
      keyword: params.keyword || undefined,
      status: params.status != null ? Number(params.status) : -1,
      page,
      pageSize,
      lang: 'en',
    }, apiKey, secret);
    if (r?.result !== 'success') {
      return { result: 'error', body: r, errorMessage: (r?.messages || []).join('; ') };
    }
    const { items, total, pageCount } = extractItems(r);
    const normalised = items.map((it: any) => {
      const itemNo = String(it.itemNo ?? it.item_no ?? it.id ?? '');
      const priceFromList = Array.isArray(it.priceList) && it.priceList.length
        ? Number(it.priceList[0].value) : null;
      return {
        itemNo,
        name: it.name ?? it.title ?? itemNo,
        price: Number(it.price ?? priceFromList ?? 0) || null,
        stock: Number(it.stock ?? 0) || 0,
        status: Number(it.status ?? 1) || 1,
        leadTimeLevel: it.leadTimeLevel ?? null,
        categoryId: Number(it.categoryId ?? cid) || null,
        image: it.imageUrl ?? (Array.isArray(it.images) ? it.images[0] : null)
          ?? (itemNo ? `https://img.sunsky-online.com/${itemNo}.jpg` : null),
        raw: it,
      };
    });
    // Flag which ones are already imported so the UI can show it
    const nos = normalised.map((n) => n.itemNo).filter(Boolean);
    let importedSet: string[] = [];
    if (nos.length) {
      const { data: rows } = await admin.from('sunsky_imported_products')
        .select('sunsky_item_no').in('sunsky_item_no', nos);
      importedSet = (rows ?? []).map((x: any) => String(x.sunsky_item_no));
    }
    return {
      result: 'success',
      body: {
        result: 'success',
        data: {
          items: normalised.map((n) => ({ ...n, imported: importedSet.includes(n.itemNo) })),
          total, pageCount, page, pageSize,
        },
      },
    };
  }

  // ---- Import specific products (one or many) ----------------------------
  if (endpointKey === 'import/item') {
    const list: any[] = Array.isArray(params.items) ? params.items : [];
    if (!list.length) {
      return { result: 'error', body: { result: 'error', messages: ['No products selected'] }, errorMessage: 'No products selected' };
    }
    let imported = 0, updated = 0, failed = 0;
    for (const it of list) {
      const itemNo = String(it.itemNo ?? it.item_no ?? it.id ?? '').trim();
      if (!itemNo) { failed++; continue; }
      try {
        const detail = await callSunsky('product/details', { itemNo, lang: 'en' }, apiKey, secret);
        const d = detail?.result === 'success'
          ? (Array.isArray(detail.data) ? detail.data[0] : (detail.data?.result ?? detail.data))
          : null;
        const merged = { ...(it.raw ?? it), ...(d ?? {}) };
        const statusCode = Number(merged.status ?? it.status ?? 1) || 1;
        const stockQty = Number(merged.stock ?? it.stock ?? 0) || 0;
        const priceFromList = Array.isArray(merged.priceList) && merged.priceList.length
          ? Number(merged.priceList[0].value) : null;
        const { data: existing } = await admin.from('sunsky_imported_products')
          .select('id').eq('sunsky_item_no', itemNo).maybeSingle();
        const { error } = await admin.from('sunsky_imported_products').upsert({
          sunsky_item_no: itemNo,
          last_price_usd: Number(merged.price ?? priceFromList ?? it.price ?? 0) || null,
          last_stock_qty: stockQty,
          in_stock: statusCode === 1 && stockQty > 0,
          last_category_id: Number(it.categoryId ?? merged.categoryId) || null,
          last_category_path: params.categoryPath ?? it.categoryPath ?? null,
          last_image_urls: Array.isArray(merged.images) ? merged.images : [],
          raw_payload: merged,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'sunsky_item_no' });
        if (error) failed++;
        else if (existing) updated++;
        else imported++;
      } catch {
        failed++;
      }
    }
    return { result: 'success', body: { result: 'success', data: { imported, updated, failed } } };
  }

  if (endpointKey === 'import/preview') {
    const cid = Number(params.categoryId);
    if (!Number.isFinite(cid)) return { result: 'error', body: { result: 'error', messages: ['categoryId required'] }, errorMessage: 'categoryId required' };
    const r = await callSunsky('product/search', {
      categoryId: cid,
      keyword: params.keyword || undefined,
      status: params.sunskyStatus ?? -1,
      page: 1,
      pageSize: 12,
      lang: 'en',
    }, apiKey, secret);
    if (r?.result !== 'success') {
      return { result: 'error', body: r, errorMessage: (r?.messages || []).join('; ') };
    }
    const { items, total, pageCount } = extractItems(r);
    return { result: 'success', body: { result: 'success', data: { items, total, pageCount } } };
  }

  if (endpointKey === 'import/cancel') {
    const jobId = String(params.jobId || '');
    if (!jobId) return { result: 'error', body: { result: 'error', messages: ['jobId required'] }, errorMessage: 'jobId required' };
    await admin.from('sunsky_import_jobs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', jobId)
      .in('status', ['queued', 'running']);
    return { result: 'success', body: { result: 'success', data: { jobId } } };
  }

  if (endpointKey === 'import/start') {
    const cid = Number(params.categoryId);
    if (!Number.isFinite(cid)) return { result: 'error', body: { result: 'error', messages: ['categoryId required'] }, errorMessage: 'categoryId required' };
    const filters: ImportFilters = {
      inStockOnly: Boolean(params?.filters?.inStockOnly),
      minStock: Number(params?.filters?.minStock) > 0 ? Number(params.filters.minStock) : 0,
      maxItems: Number(params?.filters?.maxItems) > 0 ? Number(params.filters.maxItems) : 0,
      keyword: params?.filters?.keyword || undefined,
      sunskyStatus: params?.filters?.sunskyStatus != null ? Number(params.filters.sunskyStatus) : -1,
      allowedStatuses: Array.isArray(params?.filters?.allowedStatuses) && params.filters.allowedStatuses.length
        ? params.filters.allowedStatuses.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
        : [1, 3],
    };
    const categoryPath = String(params.categoryPath || '');

    // Get total estimate up-front (using the requested status filter)
    const head = await callSunsky('product/search', {
      categoryId: cid,
      keyword: filters.keyword,
      status: filters.sunskyStatus ?? -1,
      page: 1,
      pageSize: 40,
      lang: 'en',
    }, apiKey, secret);
    const headInfo = head?.result === 'success' ? extractItems(head) : { items: [], total: 0, pageCount: 0 };

    const { data: jobRow, error: insErr } = await admin.from('sunsky_import_jobs').insert({
      category_id: cid,
      category_path: categoryPath,
      filters,
      status: 'queued',
      total_estimate: headInfo.total,
      started_by: actorId,
    }).select('id').single();
    if (insErr) {
      return { result: 'error', body: { result: 'error', messages: [insErr.message] }, errorMessage: insErr.message };
    }
    const jobId = jobRow.id;

    // Run in background — don't block the HTTP response
    // @ts-ignore EdgeRuntime
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runImportJob(jobId, cid, categoryPath, filters, headInfo, admin, apiKey, secret));
    } else {
      runImportJob(jobId, cid, categoryPath, filters, headInfo, admin, apiKey, secret).catch(() => {});
    }
    return { result: 'success', body: { result: 'success', data: { jobId, totalEstimate: headInfo.total } } };
  }

  return { result: 'error', body: { result: 'error', messages: ['unknown endpoint'] }, errorMessage: 'unknown endpoint' };
}

async function runImportJob(
  jobId: string,
  categoryId: number,
  categoryPath: string,
  filters: ImportFilters,
  firstPage: { items: any[]; total: number; pageCount: number },
  admin: any,
  apiKey: string,
  secret: string,
): Promise<void> {
  const PAGE_SIZE = 40;
  const minStock = Math.max(0, filters.minStock ?? 0);
  const inStockOnly = Boolean(filters.inStockOnly);
  const maxItems = filters.maxItems && filters.maxItems > 0 ? filters.maxItems : Infinity;
  const allowedStatuses = new Set<number>(
    Array.isArray(filters.allowedStatuses) && filters.allowedStatuses.length
      ? filters.allowedStatuses
      : [1, 3]
  );

  let imported = 0, updated = 0, skippedOos = 0, skippedStatus = 0, failed = 0, processed = 0;
  let lastPage = 0;

  await admin.from('sunsky_import_jobs').update({
    status: 'running',
    total_estimate: firstPage.total,
  }).eq('id', jobId);

  const totalPages = firstPage.pageCount || 1;

  async function processPage(items: any[], pageNum: number) {
    for (const it of items) {
      if (imported + updated >= maxItems) break;
      const itemNo = it.itemNo ?? it.item_no ?? it.id;
      if (!itemNo) { failed++; continue; }
      const statusCode = Number(it.status ?? 1) || 1;
      // Drop statuses the admin didn't ask for (e.g. Deleted/Hidden by default)
      if (!allowedStatuses.has(statusCode)) {
        skippedStatus++;
        processed++;
        continue;
      }
      const isActive = statusCode === 1;
      const stockQty = Number(it.stock ?? 0) || 0;
      // Real "in stock" = active SKU with units on hand
      const isInStock = isActive && stockQty > 0;
      if (inStockOnly && (!isInStock || stockQty < minStock)) {
        skippedOos++;
        processed++;
        continue;
      }
      const priceFromList = Array.isArray(it.priceList) && it.priceList.length
        ? Number(it.priceList[0].value) : null;
      try {
        const { data: existing } = await admin.from('sunsky_imported_products')
          .select('id').eq('sunsky_item_no', String(itemNo)).maybeSingle();
        const isNew = !existing;
        const { error } = await admin.from('sunsky_imported_products').upsert({
          sunsky_item_no: String(itemNo),
          last_price_usd: Number(it.price ?? priceFromList ?? 0) || null,
          last_stock_qty: stockQty,
          in_stock: isInStock,
          last_category_id: categoryId,
          last_category_path: categoryPath,
          last_image_urls: [],
          // raw_payload already carries `status` and `leadTimeLevel` — UI reads them from here
          raw_payload: it,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'sunsky_item_no' });
        if (error) { failed++; }
        else if (isNew) { imported++; }
        else { updated++; }
      } catch {
        failed++;
      }
      processed++;
    }
    lastPage = pageNum;
    await admin.from('sunsky_import_jobs').update({
      processed,
      imported,
      updated,
      // Combined "skipped" counter — Deleted/Hidden + OOS — surfaced verbatim in the UI
      skipped_oos: skippedOos + skippedStatus,
      failed,
      last_page: lastPage,
    }).eq('id', jobId);
  }

  try {
    await processPage(firstPage.items, 1);

    for (let p = 2; p <= totalPages && imported + updated < maxItems; p++) {
      // honour cancellation
      const { data: cur } = await admin.from('sunsky_import_jobs')
        .select('status').eq('id', jobId).maybeSingle();
      if (!cur || cur.status === 'cancelled') {
        await admin.from('sunsky_import_jobs').update({
          status: 'cancelled', completed_at: new Date().toISOString(),
        }).eq('id', jobId);
        return;
      }
      await new Promise((r) => setTimeout(r, 250));
      const r = await callSunsky('product/search', {
        categoryId,
        keyword: filters.keyword,
        status: filters.sunskyStatus ?? -1,
        page: p,
        pageSize: PAGE_SIZE,
        lang: 'en',
      }, apiKey, secret);
      if (r?.result !== 'success') { failed += 1; continue; }
      const { items } = extractItems(r);
      await processPage(items, p);
      if (!items.length) break;
    }

    await admin.from('sunsky_import_jobs').update({
      status: 'done',
      completed_at: new Date().toISOString(),
      processed,
      imported,
      updated,
      skipped_oos: skippedOos + skippedStatus,
      failed,
      last_page: lastPage,
      error_message: skippedStatus > 0
        ? `Skipped ${skippedStatus} item(s) by status filter; ${skippedOos} by stock filter.`
        : null,
    }).eq('id', jobId);
  } catch (e) {
    await admin.from('sunsky_import_jobs').update({
      status: 'failed',
      error_message: e instanceof Error ? e.message : String(e),
      completed_at: new Date().toISOString(),
      processed, imported, updated, skipped_oos: skippedOos + skippedStatus, failed, last_page: lastPage,
    }).eq('id', jobId);
  }
}

// =============================================================================
// Full category tree crawl — incremental + resumable
// =============================================================================


async function treeStats(admin: any) {
  const total = await admin.from('sunsky_categories').select('*', { count: 'exact', head: true });
  const pending = await admin.from('sunsky_categories')
    .select('*', { count: 'exact', head: true })
    .eq('has_children', true).is('children_synced_at', null);
  const byLevel: Record<string, number> = {};
  for (const lvl of [1, 2, 3, 4, 5, 6]) {
    const { count } = await admin.from('sunsky_categories')
      .select('*', { count: 'exact', head: true }).eq('level', lvl);
    if (count) byLevel[String(lvl)] = count;
  }
  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    byLevel,
  };
}

/**
 * SunSky's getChildren returns the ENTIRE category list (flat, with parentId)
 * in a single response, so the whole family tree is built from one call.
 */
async function handleCategoryTree(
  endpointKey: string,
  _params: any,
  admin: any,
  apiKey: string,
  secret: string,
): Promise<{ result: 'success' | 'error'; body: any; errorMessage?: string }> {
  if (endpointKey === 'category/tree-stats') {
    const stats = await treeStats(admin);
    return { result: 'success', body: { result: 'success', data: stats } };
  }

  const payload = await callSunsky('category/children', { categoryId: 1, lang: 'en' }, apiKey, secret);
  if (payload?.result !== 'success') {
    const msg = (payload?.messages ?? ['SunSky category list failed']).join(' · ');
    return { result: 'error', body: { result: 'error', messages: [msg] }, errorMessage: msg };
  }
  const raw: any[] = Array.isArray(payload?.data)
    ? payload.data
    : (payload?.data?.result ?? payload?.data?.list ?? payload?.data?.children ?? []);

  interface Node { id: number; parentId: number | null; name: string; raw: any }
  const nodes: Node[] = [];
  for (const c of (Array.isArray(raw) ? raw : [])) {
    const id = Number(c.id ?? c.categoryId ?? c.category_id);
    const name = String(c.name ?? c.label ?? c.title ?? '').trim();
    if (!Number.isFinite(id) || id <= 0 || !name) continue;
    const p = Number(c.parentId ?? c.parent_id ?? c.pid);
    nodes.push({ id, parentId: Number.isFinite(p) && p > 0 && p !== id ? p : null, name, raw: c });
  }
  if (nodes.length === 0) {
    const msg = 'SunSky returned no categories';
    return { result: 'error', body: { result: 'error', messages: [msg] }, errorMessage: msg };
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  // A node whose parent is absent from the payload is a top-level category.
  for (const n of nodes) if (n.parentId != null && !byId.has(n.parentId)) n.parentId = null;

  const levelOf = new Map<number, number>();
  const childCount = new Map<number, number>();
  for (const n of nodes) {
    if (n.parentId != null) childCount.set(n.parentId, (childCount.get(n.parentId) ?? 0) + 1);
  }
  const resolveLevel = (n: Node): number => {
    const seen = new Set<number>();
    let depth = 1;
    let cur: Node | undefined = n;
    while (cur?.parentId != null && !seen.has(cur.id) && depth < 12) {
      seen.add(cur.id);
      cur = byId.get(cur.parentId);
      depth += 1;
    }
    return depth;
  };
  for (const n of nodes) levelOf.set(n.id, resolveLevel(n));

  const now = new Date().toISOString();
  const rows = nodes.map((n) => ({
    category_id: n.id,
    parent_id: n.parentId,
    name: n.name,
    level: levelOf.get(n.id) ?? 1,
    has_children: (childCount.get(n.id) ?? 0) > 0,
    child_count: childCount.get(n.id) ?? 0,
    children_synced_at: now,
    raw: n.raw,
    synced_at: now,
  }));

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await admin.from('sunsky_categories')
      .upsert(rows.slice(i, i + CHUNK) as any, { onConflict: 'category_id' });
    if (error) {
      return { result: 'error', body: { result: 'error', messages: [error.message] }, errorMessage: error.message };
    }
  }

  // Drop categories SunSky no longer lists.
  // Drop categories SunSky no longer lists (anything not touched by this sync).
  await admin.from('sunsky_categories').delete().lt('synced_at', now);

  await admin.rpc('sunsky_rebuild_category_paths');
  const stats = await treeStats(admin);

  return {
    result: 'success',
    body: { result: 'success', data: { done: true, discovered: rows.length, expanded: 1, ...stats } },
  };
}
