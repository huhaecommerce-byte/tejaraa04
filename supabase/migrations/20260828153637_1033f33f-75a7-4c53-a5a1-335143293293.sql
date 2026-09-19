REVOKE ALL ON FUNCTION public.protect_return_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_sourcing_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_referral_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_team_member_self_update() FROM PUBLIC, anon, authenticated;