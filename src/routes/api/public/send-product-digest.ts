import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { corsHeaders } from '@/lib/edge/_shared/runtime.server'

// The scheduler calls this without a bearer token, so anonymous pings are
// allowed but throttled and never trusted: untrusted callers cannot force a
// run, and a real run is idempotent per period key (product_alert_runs).
const ANON_COOLDOWN_MS = 60_000
let lastAnonRun = 0

async function run(request: Request) {
  const cronFailure = await authenticateCronRequest(request)
  const trusted = cronFailure === null

  if (!trusted) {
    const now = Date.now()
    if (now - lastAnonRun < ANON_COOLDOWN_MS) {
      return new Response(JSON.stringify({ ok: true, throttled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    lastAnonRun = now
  }

  const { handler } = await import('@/lib/edge/product-digest.server')
  return handler(request, { trusted })
}

export const Route = createFileRoute('/api/public/send-product-digest')({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
})
