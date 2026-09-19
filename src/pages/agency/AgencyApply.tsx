import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, Handshake, Loader2, MailCheck } from 'lucide-react';
import { sendSignupOtp, verifySignupOtp } from '@/lib/signupOtp.functions';

const empty = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  country: 'Saudi Arabia',
  website: '',
  audience: '',
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
    if (!form.company_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      toast.error('Please fill in your name, company and email.');
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
        country: form.country.trim() || null,
        website: form.website.trim() || null,
        audience: form.audience.trim() || null,
        invite_code: '',
      } as never);
      if (insertError) throw insertError;

      setDone(true);
      toast.success('Application received — we will review it shortly.');
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
      phone: form.phone.trim() || null,
      country: form.country.trim() || null,
      website: form.website.trim() || null,
      audience: form.audience.trim() || null,
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
      toast.success('Application received — we will review it shortly.');
    } catch (err: any) {
      setCode('');
      toast.error(err?.message || 'Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading || checking) {
    return (
      <AgencyPublicShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AgencyPublicShell>
    );
  }

  if (done) {
    return (
      <AgencyPublicShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black">Application received</h1>
          <p className="mt-3 text-muted-foreground">
            Our partnerships team reviews applications within two working days. You will get an email
            the moment you are approved, along with your personal invite link.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild><Link to="/agency/portal">Go to my partner area</Link></Button>
            <Button asChild variant="outline"><Link to="/">Back to Tejaraa</Link></Button>
          </div>
        </div>
      </AgencyPublicShell>
    );
  }

  if (step === 'otp') {
    return (
      <AgencyPublicShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black">Confirm your email</h1>
          <p className="mt-3 text-muted-foreground">
            We sent a 4-digit code to <strong>{form.email.trim()}</strong>. Enter it to finish your
            application.
          </p>
          <div className="mt-8 space-y-4">
            <Input
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCode(v);
                if (v.length === 4) void handleVerify(v);
              }}
              inputMode="numeric"
              placeholder="0000"
              className="mx-auto max-w-[180px] text-center text-2xl tracking-[0.5em]"
            />
            <Button className="w-full" size="lg" disabled={verifying || code.length !== 4} onClick={() => handleVerify()}>
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm and send application
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
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
      </AgencyPublicShell>
    );
  }

  return (
    <AgencyPublicShell>
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Handshake className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black">Apply as an agency or VA</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us a little about you. Approval usually takes under two working days.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Agency or business name *</Label>
                  <Input id="company" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="Nomad Media" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Your full name *</Label>
                  <Input id="contact" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Sara Al-Otaibi" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={Boolean(user)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp / phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966 5x xxx xxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={(e) => set('country', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website or social profile</Label>
                  <Input id="website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="instagram.com/..." />
                </div>
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="password">Choose a password *</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" required />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="audience">How will you bring dropshippers to Tejaraa?</Label>
                <Textarea id="audience" rows={4} value={form.audience} onChange={(e) => set('audience', e.target.value)} placeholder="Tell us about your audience, community size, client base or the services you offer sellers." />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send my application
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already a partner? <Link to="/agency/signin" className="underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AgencyPublicShell>
  );
}
