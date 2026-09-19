import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nextRun(freq: string, from: Date): Date {
  const d = new Date(from);
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "biweekly") d.setDate(d.getDate() + 14);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  return d;
}

export async function handler(
  req: Request,
  opts?: { trusted?: boolean },
): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Scheduled-job only: the route authenticates the cron bearer secret.
  if (!opts?.trusted) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  );

  try {
    const nowIso = new Date().toISOString();
    const { data: due, error } = await supabase
      .from("order_templates")
      .select("*")
      .eq("schedule_active", true)
      .lte("next_run_at", nowIso)
      .limit(200);
    if (error) throw error;

    const results: any[] = [];
    for (const tpl of due ?? []) {
      try {
        const products = Array.isArray(tpl.products) ? tpl.products : [];
        const total = products.reduce(
          (s: number, p: any) => s + (Number(p.unit_price) || 0) * (Number(p.quantity) || 0),
          0,
        );

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("user_id", tpl.user_id)
          .maybeSingle();

        const { data: order, error: oe } = await supabase
          .from("orders")
          .insert({
            user_id: tpl.user_id,
            type: tpl.type || "bulk",
            destination: tpl.destination || "",
            customer_name: profile?.display_name || profile?.email || "",
            products,
            total,
            status: "pending",
          })
          .select("id")
          .single();
        if (oe) throw oe;

        const next = nextRun(tpl.schedule_frequency, new Date());
        await supabase
          .from("order_templates")
          .update({ last_run_at: nowIso, next_run_at: next.toISOString() })
          .eq("id", tpl.id);

        await supabase.rpc("create_notification", {
          _user_id: tpl.user_id,
          _type: "order",
          _title: "Recurring order created",
          _body: `Auto-created from template "${tpl.name}" — total SAR ${total.toFixed(2)}`,
          _link: `/dropshipping/orders/${order.id}`,
          _metadata: { template_id: tpl.id, order_id: order.id },
        });

        results.push({ template_id: tpl.id, order_id: order.id, ok: true });
      } catch (e: any) {
        console.error("Template run failed", tpl.id, e?.message);
        results.push({ template_id: tpl.id, ok: false, error: e?.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
