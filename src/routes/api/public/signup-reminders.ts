import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { corsHeaders } from '@/lib/edge/_shared/runtime.server'

// The scheduler may call this without a bearer, so unauthenticated pings are
// allowed but heavily throttled. The job itself is idempotent: each user gets
// at most one reminder per stage, enforced by a unique index.
const ANON_COOLDOWN_MS = 5 * 60_000
let lastAnonRun = 0

async function run(request: Request) {
  const cronFailure = await authenticateCronRequest(request)
  if (cronFailure !== null) {
    const now = Date.now()
    if (now - lastAnonRun < ANON_COOLDOWN_MS) {
      return new Response(JSON.stringify({ ok: true, throttled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    lastAnonRun = now
  }

  const { handler } = await import('@/lib/edge/signup-reminders.server')
  return handler(request)
}

export const Route = createFileRoute('/api/public/signup-reminders')({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
})
