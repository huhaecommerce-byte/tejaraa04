// Public webhook receiver for SunSky callbacks (order updates, image changes, balance changes).
// Verifies the optional shared secret and stores the raw payload for the admin to inspect.
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sunsky-signature',
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = process.env['SUPABASE_URL']!;
  const SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const ip = req.headers.get('x-forwarded-for') ?? '';
  const sigHeader = req.headers.get('x-sunsky-signature') ?? '';

  let payload: any = {};
  try { payload = await req.json(); } catch { payload = { raw: await req.text() }; }

  // Optional signature verification using admin-set webhook_secret.
  let signatureOk = false;
  try {
    const { data: s } = await admin.from('sunsky_settings').select('webhook_secret').eq('id', true).maybeSingle();
    const secret = s?.webhook_secret ?? '';
    signatureOk = !secret || sigHeader === secret; // simple shared secret; can be upgraded
  } catch { signatureOk = false; }

  const eventType = String(payload?.event ?? payload?.type ?? 'unknown');

  await admin.from('sunsky_callback_events').insert({
    event_type: eventType,
    payload,
    signature_ok: signatureOk,
    ip_address: ip,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
