import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { corsHeaders } from '@/lib/edge/_shared/runtime.server'

// Called on a schedule to move agency commissions from "pending" to "approved"
// once the order has been delivered and the return window has closed.
// Anonymous pings are allowed but throttled — the underlying function is
// idempotent, so an untrusted caller can never over-approve anything.
const ANON_COOLDOWN_MS = 60_000
let lastAnonRun = 0

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

async function run(request: Request) {
  const trusted = (await authenticateCronRequest(request)) === null

  if (!trusted) {
    const now = Date.now()
    if (now - lastAnonRun < ANON_COOLDOWN_MS) return json({ ok: true, throttled: true })
    lastAnonRun = now
  }

  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await (supabaseAdmin as any).rpc('agency_approve_due_commissions')
    if (error) return json({ ok: false, error: error.message }, 500)
    return json({ ok: true, approved: data ?? 0 })
  } catch (err: any) {
    return json({ ok: false, error: err?.message ?? 'Unexpected error' }, 500)
  }
}

export const Route = createFileRoute('/api/public/approve-agency-commissions')({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
})
