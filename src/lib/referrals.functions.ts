import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const schema = z.object({
  code: z.string().trim().min(1).max(64),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Records a referral-link visit. Runs server-side so the underlying
 * SECURITY DEFINER function stays closed to anonymous API callers.
 */
export const trackReferralVisit = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: result } = await supabaseAdmin.rpc('track_referral_visit', {
      _code: data.code.toUpperCase(),
      _meta: (data.meta ?? {}) as never,
    } as never);
    return { ok: Boolean((result as { ok?: boolean } | null)?.ok) };
  });
