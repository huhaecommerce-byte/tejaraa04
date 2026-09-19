import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyAuthShell } from '@/components/agency/auth/AgencyAuthShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { sendSignupOtp, verifySignupOtp } from '@/lib/signupOtp.functions';

const empty = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  password: '',
};

export default function AgencyApply() {
  const { user, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { setChecking(false); return; }
    setForm((f) => ({ ...f, email: f.email || user.email, contact_name: f.contact_name || user.name }));
    supabase
      .from('agency_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate('/agency/portal', { replace: true });
        else setChecking(false);
      });
  }, [user, isLoading, navigate]);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.company_name.trim() ||
      !form.contact_name.trim() ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      toast.error('Please fill in every field — all fields are required.');
      return;
    }
    if (!user && form.password.length < 8) {
      toast.error('Choose a password of at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      let userId = user?.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/agency/portal`,
            data: { display_name: form.contact_name.trim() },
          },
        });
        if (error) throw error;
        userId = data.user?.id;
        if (!data.session) {
          // Email confirmation is on: verify with a 4-digit code, same as seller signup.
          await sendSignupOtp({ data: { email: form.email.trim() } });
          setStep('otp');
          toast.success(`We sent a 4-digit code to ${form.email.trim()}`);
          return;
        }
        await refreshUser();
      }
      if (!userId) throw new Error('Could not create your account');

      const { error: insertError } = await supabase.from('agency_profiles').insert({
        user_id: userId,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        invite_code: '',
      } as never);
      if (insertError) throw insertError;

      await refreshUser();
      setDone(true);
      toast.success('Your partner account is ready.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not send your application.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async (userId: string) => {
    const { error } = await supabase.from('agency_profiles').insert({
      user_id: userId,
      company_name: form.company_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: `${dial}${form.phone.replace(/[\s-]/g, '')}` || null,
      country: form.country.trim() || null,
      invite_code: '',
    } as never);
    if (error) throw error;
  };

  const handleVerify = async (value?: string) => {
    const token = (value ?? code).trim();
    if (token.length !== 4) return;
    setVerifying(true);
    try {
      await verifySignupOtp({ data: { email: form.email.trim(), code: token } });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('Could not create your account');
      await saveProfile(userId);
      await refreshUser();
      setDone(true);
      toast.success('Your partner account is ready.');
    } catch (err: any) {
      setCode('');
      toast.error(err?.message || 'Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading || checking) {
    return (
      <AgencyAuthShell eyebrow="Partner application" title="Preparing your application" subtitle="One moment while we check your account.">
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AgencyAuthShell>
    );
  }

  if (done) {
    return (
      <AgencyAuthShell eyebrow="Account ready" title="Welcome to the partner programme" subtitle="Your partner account is active — no approval needed.">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-retail-light-green text-retail-green">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm leading-6 text-retail-muted">
            Open your partner area to copy your personal invite link and start onboarding dropshippers right away.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button asChild className="bg-retail-green hover:bg-retail-dark-green"><Link to="/agency/portal">Open partner area</Link></Button>
            <Button asChild variant="outline" className="border-retail-border"><Link to="/agency">Programme home</Link></Button>
          </div>
        </div>
      </AgencyAuthShell>
    );
  }

  if (step === 'otp') {
    return (
      <AgencyAuthShell eyebrow="Secure verification" title="Confirm your email" subtitle={`Enter the 4-digit code we sent to ${form.email.trim()}.`}>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-retail-light-green text-retail-green">
            <MailCheck className="h-7 w-7" />
          </div>
          <div className="space-y-4">
            <Input
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCode(v);
                if (v.length === 4) void handleVerify(v);
              }}
              inputMode="numeric"
              placeholder="0000"
              aria-label="Verification code"
              className="mx-auto h-14 max-w-[190px] text-center text-2xl tracking-[0.5em]"
            />
            <Button className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={verifying || code.length !== 4} onClick={() => handleVerify()}>
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm and create my account
            </Button>
            <button
              type="button"
              className="text-xs font-semibold text-retail-green hover:underline"
              onClick={async () => {
                try {
                  await sendSignupOtp({ data: { email: form.email.trim() } });
                  toast.success('New code sent');
                } catch {
                  toast.error('Could not send a new code');
                }
              }}
            >
              Send me a new code
            </button>
          </div>
        </div>
      </AgencyAuthShell>
    );
  }

  return (
    <AgencyAuthShell
      eyebrow="Agency & VA programme"
      title="Create your partner account"
      subtitle="Sign up in a minute and start earning — your partner account is active straight away."
      wide
      footer={<>Already a partner? <Link to="/agency/signin" className="font-semibold text-retail-green hover:underline">Sign in to your portal</Link></>}
    >
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Agency or business name *</Label>
                  <Input id="company" className="w-full" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="Nomad Media" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Your full name *</Label>
                  <Input id="contact" className="w-full" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Sara Al-Otaibi" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp / phone *</Label>
                  <div className="flex overflow-hidden rounded-md border border-input bg-transparent shadow-xs">
                    <span className="flex h-9 items-center justify-center border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground">{dial}</span>
                    <Input id="phone" className="w-full rounded-none border-0 shadow-none focus-visible:ring-0" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d\s-]/g, ''))} placeholder="5x xxx xxxx" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={form.country} onValueChange={(v) => set('country', v)}>
                    <SelectTrigger id="country" className="w-full">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {GCC_COUNTRIES.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" className="w-full" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@company.com" disabled={Boolean(user)} required />
                </div>
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="password">Choose a password *</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" required />
                </div>
              )}

              <Button type="submit" className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create my partner account {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            </form>
    </AgencyAuthShell>
  );
}
