import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyAuthShell } from '@/components/agency/auth/AgencyAuthShell';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2, MailCheck } from 'lucide-react';

export default function AgencyForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Could not send the reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthShell
      eyebrow="Account recovery"
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={sent ? 'We have sent password reset instructions if this email belongs to a partner account.' : 'Enter the email linked to your agency or VA partner account.'}
      footer={<><Link to="/agency/signin" className="font-semibold text-retail-green hover:underline">Back to sign in</Link><span className="mx-2">·</span><Link to="/agency/signup" className="font-semibold text-retail-green hover:underline">Create an account</Link></>}
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-retail-light-green text-retail-green">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="text-sm leading-6 text-retail-muted">If an account exists for <span className="font-semibold text-retail-text">{email}</span>, a reset link is on its way.</p>
          <Button asChild variant="outline" className="h-11 w-full border-retail-border"><Link to="/agency/signin">Return to sign in</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@agency.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
          </div>
          <Button type="submit" className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send reset link {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </form>
      )}
    </AgencyAuthShell>
  );
}
