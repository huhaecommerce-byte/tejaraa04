import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { corsHeaders } from '@/lib/edge/_shared/runtime.server'

// Anonymous "drain now" pings (fired by the checkout/order flows) are allowed
// but throttled so the endpoint cannot be used as an unauthenticated work
// amplifier. Cron callers with a valid bearer bypass the cooldown.
const ANON_COOLDOWN_MS = 15_000
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

  const { handler } = await import('@/lib/edge/process-email-outbox.server')
  return handler(new Request('http://local/process-email-outbox'), { trusted })
}

export const Route = createFileRoute('/api/public/process-email-outbox')({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
})
