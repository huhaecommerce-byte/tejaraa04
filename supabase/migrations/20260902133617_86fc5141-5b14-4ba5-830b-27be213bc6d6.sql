create policy "Service role only"
on public.signup_otps
for all
to service_role
using (true)
with check (true);