import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  ticket_id?: string;
  message_id?: string;
  direction: 'new_ticket' | 'buyer_reply' | 'admin_reply' | 'test';
}

const WAHOOKS_API = 'https://api.wahooks.com/api';

function toChatId(to: string): string {
  if (!to) return '';
  if (to.includes('@')) return to; // already a chat id
  const digits = to.replace(/\D/g, '');
  return `${digits}@c.us`;
}

async function sendWahooks(apiKey: string, conn: string, to: string, body: string): Promise<{ id: string | null; error: string | null }> {
  if (!apiKey || !conn) {
    return { id: null, error: 'Wahooks credentials missing' };
  }
  try {
    const url = `${WAHOOKS_API}/connections/${conn}/send`;
    const reqBody = { chatId: toChatId(to), text: body };
    console.log('Wahooks request', url, JSON.stringify(reqBody));
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });
    const raw = await res.text();
    console.log('Wahooks response', res.status, raw);
    let json: any = {};
    try { json = JSON.parse(raw); } catch { /* non-json */ }
    if (!res.ok) {
      return { id: null, error: `Wahooks ${res.status}: ${raw.slice(0, 500)}` };
    }
    // Treat 2xx as success regardless of payload shape
    const id = json.id || json.message_id || json.messageId || json.data?.id || json.key?.id || `ok-${Date.now()}`;
    return { id: String(id), error: null };
  } catch (e: any) {
    console.error('Wahooks fetch failed', e);
    return { id: null, error: e?.message || 'fetch failed' };
  }
}

async function logSend(
  supabase: any,
  row: {
    direction: string;
    ticket_id: string | null;
    user_id: string | null;
    customer_name: string;
    to_number: string;
    body: string;
    wa_msg_id: string | null;
    status: string;
    error: string | null;
  },
) {
  try {
    await supabase.from('whatsapp_logs').insert(row);
  } catch (e) {
    console.warn('whatsapp_logs insert failed', e);
  }
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );

    const userClient = createClient(
      process.env['SUPABASE_URL']!,
      (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as Payload;
    if (!payload?.direction) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['whatsapp_enabled', 'whatsapp_admin_number', 'wahooks_api_key', 'wahooks_connection_id']);
    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    const apiKey = settingsMap.wahooks_api_key || '';
    const connId = settingsMap.wahooks_connection_id || '';
    const adminNumber = settingsMap.whatsapp_admin_number || '';

    // ===== TEST direction =====
    if (payload.direction === 'test') {
      if (!apiKey || !connId) {
        return new Response(JSON.stringify({ ok: false, error: 'Wahooks API key or Connection ID is not configured.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!adminNumber) {
        return new Response(JSON.stringify({ ok: false, error: 'Admin WhatsApp number is not configured.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const text = `✅ Tejaraa WhatsApp test — connection working at ${ts} UTC`;
      const { id, error } = await sendWahooks(apiKey, connId, adminNumber, text);
      await logSend(supabase, {
        direction: 'test',
        ticket_id: null,
        user_id: null,
        customer_name: 'Admin (test)',
        to_number: adminNumber,
        body: text,
        wa_msg_id: id,
        status: id ? 'sent' : 'failed',
        error,
      });
      if (!id) {
        return new Response(JSON.stringify({ ok: false, error: error || 'Send failed' }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true, wa_msg_id: id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All other directions require a ticket
    if (!payload.ticket_id) {
      return new Response(JSON.stringify({ error: 'Missing ticket_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (settingsMap.whatsapp_enabled !== 'true') {
      return new Response(JSON.stringify({ ok: true, skipped: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey || !connId) {
      return new Response(JSON.stringify({ ok: true, skipped: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, subject, user_id, description')
      .eq('id', payload.ticket_id)
      .single();
    if (!ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let messageBody = ticket.description || '';
    if (payload.message_id) {
      const { data: msg } = await supabase
        .from('ticket_messages')
        .select('message')
        .eq('id', payload.message_id)
        .single();
      if (msg) messageBody = msg.message;
    }

    const shortId = ticket.id.slice(0, 8).toUpperCase();

    if (payload.direction === 'new_ticket' || payload.direction === 'buyer_reply') {
      if (!adminNumber) {
        return new Response(JSON.stringify({ ok: true, skipped: 'no_admin_number' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: buyer } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', ticket.user_id)
        .single();
      const buyerName = buyer?.display_name || buyer?.email || 'Customer';

      const label = payload.direction === 'new_ticket' ? '🎫 New ticket' : '💬 Buyer reply';
      const text = `${label} #${shortId} from ${buyerName}\nSubject: ${ticket.subject}\n\n${messageBody}\n\n↩️ Reply to this message to respond.`;

      const { id: waMsgId, error } = await sendWahooks(apiKey, connId, adminNumber, text);
      if (waMsgId) {
        await supabase.from('tickets').update({ last_admin_wa_msg_id: waMsgId }).eq('id', ticket.id);
      }
      await logSend(supabase, {
        direction: 'outbound_admin',
        ticket_id: ticket.id,
        user_id: ticket.user_id,
        customer_name: buyerName,
        to_number: adminNumber,
        body: text,
        wa_msg_id: waMsgId,
        status: waMsgId ? 'sent' : 'failed',
        error,
      });
      return new Response(JSON.stringify({ ok: true, wa_msg_id: waMsgId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.direction === 'admin_reply') {
      const { data: buyer } = await supabase
        .from('profiles')
        .select('phone, display_name, email')
        .eq('user_id', ticket.user_id)
        .single();
      const buyerName = buyer?.display_name || buyer?.email || 'Customer';
      if (!buyer?.phone) {
        await logSend(supabase, {
          direction: 'outbound_buyer',
          ticket_id: ticket.id,
          user_id: ticket.user_id,
          customer_name: buyerName,
          to_number: '',
          body: `(skipped) Reply on ticket #${shortId}`,
          wa_msg_id: null,
          status: 'skipped',
          error: 'no_buyer_phone',
        });
        return new Response(JSON.stringify({ ok: true, skipped: 'no_buyer_phone' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = `💬 Reply on your ticket #${shortId}\n${ticket.subject}\n\n${messageBody}\n\nView: https://tejaraa.com/dropshipping/tickets`;
      const { id: waMsgId, error } = await sendWahooks(apiKey, connId, buyer.phone, text);
      await logSend(supabase, {
        direction: 'outbound_buyer',
        ticket_id: ticket.id,
        user_id: ticket.user_id,
        customer_name: buyerName,
        to_number: buyer.phone,
        body: text,
        wa_msg_id: waMsgId,
        status: waMsgId ? 'sent' : 'failed',
        error,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown direction' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-ticket-whatsapp error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
