import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wahooks-signature',
};

async function verifyHmac(secret: string, payload: string, signature: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    const provided = signature.replace(/^sha256=/, '').toLowerCase();
    return hex === provided;
  } catch {
    return false;
  }
}

function normalizePhone(p: string): string {
  return (p || '').replace(/[^\d]/g, '');
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  );

  // Helper: log every webhook hit so admin can diagnose from WhatsApp Logs page
  const logDebug = async (note: string, extra: Record<string, any> = {}) => {
    try {
      await supabase.from('whatsapp_logs').insert({
        direction: 'inbound_debug',
        customer_name: 'Webhook',
        to_number: '',
        from_number: extra.from || '',
        body: `[${note}] ${JSON.stringify(extra).slice(0, 500)}`,
        wa_msg_id: extra.msgId || null,
        ticket_id: extra.ticketId || null,
        status: 'received',
      });
    } catch (e) {
      console.warn('debug log failed', e);
    }
  };

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wahooks-signature') || req.headers.get('X-Wahooks-Signature') || '';

    // Load webhook secret + admin settings from platform_settings
    const { data: settingsRows } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['whatsapp_admin_number', 'whatsapp_enabled', 'wahooks_webhook_secret']);
    const settingsMap: Record<string, string> = {};
    settingsRows?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    const secret = settingsMap.wahooks_webhook_secret || '';
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    if (secret) {
      const bearerMatch = authHeader === `Bearer ${secret}`;
      let hmacMatch = false;
      if (signature) hmacMatch = await verifyHmac(secret, rawBody, signature);
      if (!bearerMatch && !hmacMatch) {
        console.warn('Webhook auth mismatch — processing anyway (soft-fail). Has signature:', !!signature, 'Has bearer:', authHeader.startsWith('Bearer '));
      }
    }
    console.log('Webhook payload (first 500):', rawBody.slice(0, 500));

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      await logDebug('parse_error', { preview: rawBody.slice(0, 200) });
      return new Response(JSON.stringify({ ok: true, skipped: 'parse_error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = event?.payload || event?.data || event;
    const eventType = event?.event || event?.type || 'message';

    if (!String(eventType).includes('message')) {
      await logDebug('not_message_event', { eventType });
      return new Response(JSON.stringify({ ok: true, skipped: 'not_message_event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const msgId = data.id || data.message_id || data.messageId;
    const fromMe = data.fromMe === true || data.from_me === true;
    const meId = (event?.me?.id || '').toString();
    let from = (data.from || data.sender || data.chat_id || '').toString();
    if (fromMe && meId) from = meId;
    const body = (data.body || data.text || data.message || data.caption || '').toString();
    const quotedId =
      data.quoted_message_id ||
      data.quotedMessageId ||
      data.replyTo?.id ||
      data.replyTo ||
      data.context?.message_id ||
      data.quotedMsg?.id ||
      null;

    if (!body || !from) {
      await logDebug('empty_payload', { eventType, fromMe, hasBody: !!body, hasFrom: !!from });
      return new Response(JSON.stringify({ ok: true, skipped: 'empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip our own bot-sent messages (they get echoed back via message.any since admin = bot number)
    const payloadSource = (data.source || '').toString().toLowerCase();
    const botPrefixes = ['🎫', '💬 Buyer reply', '✅ Tejaraa'];
    const isBotEcho = payloadSource === 'api' || botPrefixes.some(p => body.startsWith(p));
    if (isBotEcho) {
      await logDebug('self_bot_echo', { source: payloadSource, bodyPreview: body.slice(0, 80) });
      return new Response(JSON.stringify({ ok: true, skipped: 'self_bot_echo' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (settingsMap.whatsapp_enabled !== 'true') {
      await logDebug('whatsapp_disabled', { eventType });
      return new Response(JSON.stringify({ ok: true, skipped: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminNum = normalizePhone(settingsMap.whatsapp_admin_number || '');
    const senderIsAdmin = fromMe || normalizePhone(from) === adminNum || normalizePhone(meId) === adminNum;
    if (!senderIsAdmin) {
      await logDebug('not_admin', { from, fromMe, meId, adminNum });
      return new Response(JSON.stringify({ ok: true, skipped: 'not_admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency
    if (msgId) {
      const { data: existing } = await supabase
        .from('ticket_messages')
        .select('id')
        .eq('whatsapp_msg_id', msgId)
        .maybeSingle();
      if (existing) {
        await logDebug('duplicate', { msgId });
        return new Response(JSON.stringify({ ok: true, skipped: 'duplicate' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Resolve ticket: ONLY via 1) quoted message OR 2) #ABCD1234 prefix.
    // No time-based fallback — prevents personal chats from being misrouted into tickets.
    let ticketId: string | null = null;
    let resolution = '';
    const prefixMatch = body.match(/#([A-Fa-f0-9]{8})/);

    // Early skip: no ticket reference at all → it's a personal chat, ignore.
    if (!quotedId && !prefixMatch) {
      await logDebug('no_ticket_reference', { from, bodyPreview: body.slice(0, 80) });
      return new Response(JSON.stringify({ ok: true, skipped: 'no_ticket_reference' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (quotedId) {
      const { data: t } = await supabase
        .from('tickets')
        .select('id')
        .eq('last_admin_wa_msg_id', quotedId)
        .maybeSingle();
      if (t) { ticketId = t.id; resolution = 'quoted'; }
    }
    if (!ticketId && prefixMatch) {
      const prefix = prefixMatch[1].toLowerCase();
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .ilike('id', `${prefix}%`)
        .limit(1);
      if (tickets?.[0]) { ticketId = tickets[0].id; resolution = 'prefix'; }
    }

    console.log('Resolved', { eventType, from, quotedId, ticketId, resolution, bodyPreview: body.slice(0, 80) });
    if (!ticketId) {
      await logDebug('no_ticket_match', { quotedId, bodyPreview: body.slice(0, 80) });
      return new Response(JSON.stringify({ ok: true, skipped: 'no_ticket_match' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find an admin user_id (first admin)
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'No admin user found' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanBody = body.replace(/^#[A-Fa-f0-9]{8}\s*/, '').trim() || body;

    const { data: insertedMsg, error: insertErr } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: adminRole.user_id,
        is_admin: true,
        message: cleanBody,
        source: 'whatsapp',
        whatsapp_msg_id: msgId || null,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Insert message failed', insertErr);
      await logDebug('insert_failed', { ticketId, err: insertErr.message });
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log inbound admin reply (success path)
    try {
      const { data: ticketRow } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('id', ticketId)
        .maybeSingle();
      let convName = 'Customer';
      if (ticketRow?.user_id) {
        const { data: convBuyer } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', ticketRow.user_id)
          .maybeSingle();
        convName = convBuyer?.display_name || convBuyer?.email || 'Customer';
      }
      await supabase.from('whatsapp_logs').insert({
        direction: 'inbound_admin',
        ticket_id: ticketId,
        user_id: ticketRow?.user_id || null,
        customer_name: convName,
        to_number: settingsMap.whatsapp_admin_number || '',
        from_number: from,
        body: `[via=${fromMe ? 'self_sent' : 'inbound'}|match=${resolution}] ${cleanBody}`,
        wa_msg_id: msgId || null,
        status: 'received',
      });
    } catch (logErr) {
      console.warn('inbound log insert failed', logErr);
    }

    // Notify buyer via WA if they have a phone
    try {
      const { handler: sendTicketWhatsapp } = await import('@/lib/edge/send-ticket-whatsapp.server');
      await sendTicketWhatsapp(
        new Request(`${new URL(req.url).origin}/api/fn/send-ticket-whatsapp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env['SUPABASE_SERVICE_ROLE_KEY']}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_id: ticketId,
            message_id: insertedMsg.id,
            direction: 'admin_reply',
          }),
        }),
      );
    } catch (e) {
      console.warn('Buyer WA notify failed', e);
    }

    return new Response(JSON.stringify({ ok: true, ticket_id: ticketId, message_id: insertedMsg.id, resolution }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('webhook error', e);
    await logDebug('exception', { err: e.message });
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
