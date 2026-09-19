import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Handshake, Loader2 } from 'lucide-react';

export default function AgencySignIn() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) navigate('/agency/portal', { replace: true });
  }, [isLoading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/agency/portal', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign you in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RetailPublicShell>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Handshake className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Partner sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Agencies and virtual assistants</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <Link to="/shop/forgot-password" className="underline">Forgot password?</Link>
                <Link to="/agency/apply" className="underline">Apply to join</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RetailPublicShell>
  );
}
