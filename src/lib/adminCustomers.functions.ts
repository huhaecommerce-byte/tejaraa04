import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Forbidden')
}

/** Read the auth-level account state (suspended / email confirmed). */
export const getCustomerAccountState = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: res } = await supabaseAdmin.auth.admin.getUserById(data.userId)
    const u: any = res?.user ?? null
    const bannedUntil = u?.banned_until ? new Date(u.banned_until) : null
    return {
      suspended: !!bannedUntil && bannedUntil.getTime() > Date.now(),
      bannedUntil: bannedUntil ? bannedUntil.toISOString() : null,
      emailConfirmed: !!u?.email_confirmed_at,
    }
  })

/** Suspend (ban) or restore a customer account. */
export const setCustomerSuspended = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; suspended: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    if (data.userId === context.userId) throw new Error('You cannot suspend your own account')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      // 100 years ~ indefinite; 'none' lifts the ban
      ban_duration: data.suspended ? '876000h' : 'none',
    } as any)
    if (error) throw new Error(error.message)

    if (data.suspended) {
      await supabaseAdmin.auth.admin.signOut?.(data.userId as any).catch?.(() => {})
    }
    return { suspended: data.suspended }
  })

/** Permanently delete a customer's auth account (cascades app data). */
export const deleteCustomerAccount = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; confirmEmail: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    if (data.userId === context.userId) throw new Error('You cannot delete your own account')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: res } = await supabaseAdmin.auth.admin.getUserById(data.userId)
    const authUser = res?.user ?? null

    // Fall back to the profile row when the auth user no longer exists.
    let email = authUser?.email ?? ''
    if (!email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('user_id', data.userId)
        .maybeSingle()
      email = (profile as { email?: string } | null)?.email ?? ''
    }
    if (!email || email.trim().toLowerCase() !== data.confirmEmail.trim().toLowerCase()) {
      throw new Error('Confirmation email does not match this customer')
    }

    // Guard: never delete another admin from this screen.
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: data.userId,
      _role: 'admin',
    })
    if (isAdmin) throw new Error('This account is an admin and cannot be deleted here')

    await supabaseAdmin.from('profiles').delete().eq('user_id', data.userId)
    if (authUser) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId)
      if (error) throw new Error(error.message)
    }
    return { deleted: true, email }

  })
