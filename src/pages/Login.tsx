import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { celebrateLogin } from '@/lib/celebrate';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { SellerAuthShell } from '@/components/seller/auth/SellerAuthShell';



type Audience = 'shop' | 'dropshipping';

const Login = ({ audience = 'shop' }: { audience?: Audience }) => {
  const isDropship = audience === 'dropshipping';
  const homeDest = isDropship ? '/dropshipping' : '/account';
  const signupHref = isDropship ? '/selling/signup' : '/shop/signup';
  const forgotHref = isDropship ? '/selling/forgot-password' : '/shop/forgot-password';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get('role') === 'supplier' ? 'supplier' : params.get('role') === 'seller' ? 'seller' : 'buyer';

  // One sign-in entry: suppliers continue in the wholesaler portal.
  useEffect(() => {
    if (role === 'supplier') navigate('/partners/signin', { replace: true });
  }, [role, navigate]);

  useEffect(() => {
    if (isLoading || !user) return;
    navigate(homeDest, { replace: true });
  }, [isLoading, navigate, user, homeDest]);

  if (!isLoading && user) {
    return <div className="min-h-screen bg-background" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const { data: { session } } = await supabase.auth.getSession();
      const displayName = session?.user.user_metadata?.display_name || session?.user.email?.split('@')[0] || '';
      celebrateLogin();
      toast.success(`Welcome back${displayName ? `, ${displayName}` : ''} 👋`);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Dropshipping sign-in uses the same split-screen design as the agency portal.
  if (isDropship) {
    return (
      <SellerAuthShell
        eyebrow="Seller access"
        title="Welcome back"
        subtitle="Sign in to your dropshipping portal to manage sourcing, orders, and fulfilment."
        footer={<>New to Tejaraa selling? <Link to={signupHref} className="font-semibold text-retail-green hover:underline">Create a seller account</Link></>}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email address</Label>
            <Input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="login-password">Password</Label>
              <Link to={forgotHref} className="text-xs font-semibold text-retail-green hover:underline">Forgot password?</Link>
            </div>
            <Input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
          </div>
          <Button type="submit" className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in to portal {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </form>
      </SellerAuthShell>
    );
  }

  // Shop sign-in renders as a normal page inside the shop site chrome.
  return (
    <RetailPublicShell contentClassName="flex items-start justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-retail-border bg-retail-card shadow-sm p-6 sm:p-8">
          <div className="mb-5 lg:mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your shopping account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link to={forgotHref} className="text-xs text-primary font-medium hover:underline">Forgot password?</Link>
              </div>
              <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
            </div>
            <button type="submit" className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 active:scale-[0.98] transition-transform" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5 lg:mt-6">
            Don't have an account? <Link to={signupHref} className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </RetailPublicShell>
  );
};

export default Login;
