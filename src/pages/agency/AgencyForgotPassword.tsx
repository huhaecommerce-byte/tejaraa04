import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, Loader2, MailCheck } from 'lucide-react';

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
    <AgencyPublicShell>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {sent ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-black">Reset your partner password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Agencies and virtual assistants</p>
        </div>
        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
                </p>
                <Button asChild variant="outline" className="w-full"><Link to="/agency/signin">Back to sign in</Link></Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send reset link
                </Button>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <Link to="/agency/signin" className="underline">Back to sign in</Link>
                  <Link to="/agency/apply" className="underline">Apply to join</Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AgencyPublicShell>
  );
}
