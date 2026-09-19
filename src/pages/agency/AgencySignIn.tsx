import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyAuthShell } from '@/components/agency/auth/AgencyAuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

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
    <AgencyAuthShell
      eyebrow="Partner access"
      title="Welcome back"
      subtitle="Sign in to manage your dropshippers, earnings, and payouts."
      footer={<>New to the programme? <Link to="/agency/signup" className="font-semibold text-retail-green hover:underline">Create a partner account</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link to="/agency/forgot-password" className="text-xs font-semibold text-retail-green hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
        </div>
        <Button type="submit" className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in to portal {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </form>
    </AgencyAuthShell>
  );
}
